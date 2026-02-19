import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../middleware/auth.js";
import { db } from "../db/prisma.js";
import {
  extractKeywords,
  scoreATS,
  generateSuggestions,
} from "../services/atsService.js";
import type { AuthRequest } from "../middleware/auth-types.js";
import { Resume } from "@prisma/client";

export const atsRouter = Router();

atsRouter.use(requireAuth as any);

const AnalyzeSchema = z.object({
  resumeId: z.string().optional(),
  resumeText: z.string().min(50).optional(),
  jobDescription: z
    .string()
    .min(100, "Job description must be at least 100 characters"),
  jobTitle: z.string().max(200).optional(),
  company: z.string().max(200).optional(),
});

/* ─────────────────────────────────────────────
   POST /api/ats/analyze
───────────────────────────────────────────── */
atsRouter.post("/analyze", async (req, res): Promise<void> => {
  const authReq = req as AuthRequest;

  const result = AnalyzeSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({ error: result.error.flatten() });
    return;
  }

  const {
    resumeId,
    resumeText,
    jobDescription,
    jobTitle = "Unknown Role",
    company = "Unknown Company",
  } = result.data;

    const resumeIdNum = resumeId ? Number(resumeId) : undefined;
  if (resumeIdNum && isNaN(resumeIdNum)) {
    res.status(400).json({ error: "Invalid resumeId" });
    return;
  }

  let text = resumeText;
  let resume: Resume | null = null;

  // Ensure userId is a number
  const userId = Number(authReq.userId);
  if (isNaN(userId)) {
    res.status(401).json({ error: "Invalid user" });
    return;
  }

  if (resumeId) {
    const resumeIdNum = Number(resumeId);
    if (isNaN(resumeIdNum)) {
      res.status(400).json({ error: "Invalid resumeId" });
      return;
    }

    resume = await db.resume.findFirst({
      where: { id: resumeIdNum, userId },
    });

    if (!resume) {
      res.status(404).json({ error: "Resume not found" });
      return;
    }

    text = resume.originalText;

    await db.resume.update({
      where: { id: resumeIdNum },
      data: { status: "ANALYZING" },
    });
  }

  if (!text) {
    res.status(400).json({ error: "Provide either resumeId or resumeText" });
    return;
  }

  try {
    const keywords = await extractKeywords(jobDescription);
    const breakdown = await scoreATS(text, jobDescription, keywords);
    const suggestions = await generateSuggestions(breakdown, jobTitle, company);

    let previousScore = 0;

    if (resume) {
      const lastAnalysis = await db.atsAnalysis.findFirst({
        where: { resumeId: resume.id },
        orderBy: { createdAt: "desc" },
        select: { atsScore: true, previousScore: true },
      });

      previousScore = lastAnalysis?.previousScore ?? 0;
    }

 const analysis = await db.atsAnalysis.create({
  data: {
    resumeId: resume?.id ?? (await createTempResume(authReq.userId!, text)),
    jobDescription,
    jobTitle: jobTitle ?? "Unknown Role",
    companyName: company ?? "Unknown Company",
    atsScore: breakdown.overallScore,
    keywordMatchPercentage: breakdown.keywordScore ?? 0,
    previousScore,
    matchedKeywords: breakdown.keywordsFound || [],
    missingKeywords: breakdown.keywordsMissing || [],
    improvementSuggestions: suggestions.join("\n") || "",
  },
});

console.log("Created analysis:", analysis.id);

    if (resume) {
      await db.resume.update({
        where: { id: resume.id },
        data: { status: "OPTIMIZED" },
      });
    }

    res.json({
      analysisId: analysis.id,
      atsScore: analysis.atsScore,
      previousScore: analysis.previousScore,
      keywordsFound: analysis.matchedKeywords ?? [],
      keywordsMissing: analysis.missingKeywords ?? [],
      suggestions,
    });
  } catch (err) {
    if (resumeId) {
      await db.resume.update({
        where: { id: Number(resumeId) },
        data: { status: "DRAFT" },
      }).catch(() => {});
    }

    throw err;
  }
});


/* ─────────────────────────────────────────────
   GET /api/ats/analyses/:analysisId
───────────────────────────────────────────── */
atsRouter.get("/analyses/:id", async (req, res) => {
  const analysisId = Number(req.params.id);
  const authReq = req as AuthRequest;
  const userId = Number(authReq.userId);

  if (isNaN(analysisId)) return res.status(400).json({ error: "Invalid analysis ID" });

  // Lookup analysis by its actual ID
  console.log("req.userId:", authReq.userId);
console.log("analysisId:", analysisId);

  const analysis = await db.atsAnalysis.findFirst({
    where: { id: analysisId },
    include: { resume: { select: { userId: true } } },
  });

  console.log("analysis fetched:", analysis);

  if (!analysis) return res.status(404).json({ error: "Analysis not found" });

  // Verify ownership
  if (analysis.resume.userId !== userId) {
    return res.status(403).json({ error: "Unauthorized" });
  }

  const matchedKeywords = Array.isArray(analysis.matchedKeywords) ? analysis.matchedKeywords : [];

  res.json({
    analysisId: analysis.id,
    resumeId: analysis.resumeId,
    overallScore: analysis.atsScore,
    previousScore: analysis.previousScore ?? 0,
    jobTitle: analysis.jobTitle,
    company: analysis.companyName,
    keywordsFound: analysis.matchedKeywords ?? [],
    keywordsMissing: analysis.missingKeywords ?? [],
    suggestions: (analysis.improvementSuggestions ?? "").split("\n").map((s) => ({
      icon: "📌",
      color: "#7B2FFF",
      title: s,
      body: s,
    })),
    categories: [
      { label: "Keyword Match", score: analysis.keywordMatchPercentage ?? 0, note: `${matchedKeywords.length} keywords`, color: "#B8FF00" },
      { label: "Format & Structure", score: 0, note: "ATS-friendliness", color: "#00D4FF" },
      { label: "Experience Align", score: 0, note: "Level match", color: "#7B2FFF" },
      { label: "Skills Coverage", score: 0, note: "Skills matched", color: "#FF8C42" },
      { label: "Action Words", score: 0, note: "Verb strength", color: "#FF4D6D" },
    ],
  });
});

/* ─────────────────────────────────────────────
   Helpers
───────────────────────────────────────────── */
async function createTempResume(
  userId: number,
  rawText: string
): Promise<number> {
  const resume = await db.resume.create({
    data: {
      userId,
      originalText: rawText,
      originalFilename: "temp_resume.txt", 
      originalFileUrl: "",                 
      status: "OPTIMIZED",
    },
  });

  return resume.id;
}
