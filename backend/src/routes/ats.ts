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
        resumeId: resume?.id ?? (await createTempResume(userId, text, jobTitle)),
        jobDescription,
        jobTitle,
        companyName: company,      // <-- matches Prisma schema
        atsScore: breakdown.overallScore,  // <-- matches schema
        keywordMatchPercentage: breakdown.keywordScore ?? 0,
        previousScore,
        missingKeywords: breakdown.keywordsMissing || [],
        matchedKeywords: breakdown.keywordsFound || [],
        improvementSuggestions: suggestions.join("\n"),
      },
    });

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
atsRouter.get("/analyses/:analysisId", async (req, res): Promise<void> => {
  const authReq = req as AuthRequest;
  const analysisId = Number(req.params.analysisId);

  if (isNaN(analysisId)) {
    res.status(400).json({ error: "Invalid analysis id" });
    return;
  }

  const analysis = await db.atsAnalysis.findUnique({
    where: { id: analysisId },
    include: {
      resume: { select: { userId: true } },
    },
  });

  if (!analysis) {
    res.status(404).json({ error: "Analysis not found" });
    return;
  }

  if (analysis.resume.userId !== authReq.userId) {
    res.status(403).json({ error: "Unauthorized" });
    return;
  }

  res.json({
    analysisId: analysis.id,
    resumeId: analysis.resumeId,
    overallScore: analysis.overallScore,
    previousScore: analysis.previousScore ?? 0,
    jobTitle: analysis.jobTitle,
    company: analysis.company,
    keywordsFound: analysis.keywordsFound ?? [],
    keywordsMissing: analysis.keywordsMissing ?? [],
    suggestions: analysis.suggestions ?? [],
    categories: [
      {
        label: "Keyword Match",
        score: analysis.keywordScore ?? 0,
        note: `${analysis.keywordsFound?.length ?? 0} keywords`,
      },
      {
        label: "Format & Structure",
        score: analysis.formatScore ?? 0,
        note: "ATS-friendliness",
      },
      {
        label: "Experience Align",
        score: analysis.experienceScore ?? 0,
        note: "Level match",
      },
      {
        label: "Skills Coverage",
        score: analysis.skillsScore ?? 0,
        note: "Skills matched",
      },
      {
        label: "Action Words",
        score: analysis.actionWordScore ?? 0,
        note: "Verb strength",
      },
    ],
  });
});

/* ─────────────────────────────────────────────
   Helpers
───────────────────────────────────────────── */
async function createTempResume(
  userId: string,
  rawText: string,
  jobTitle: string,
  company: string
): Promise<string> {
  const resume = await db.resume.create({
    data: {
      userId,
      title: jobTitle,
      company,
      rawText,
      status: "OPTIMIZED",
    },
  });

  return resume.id;
}
