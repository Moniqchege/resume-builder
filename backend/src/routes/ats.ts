import { Router, Response } from 'express'
import { z } from 'zod'
import { requireAuth, AuthRequest } from '../middleware/auth.js'
import { db } from '../db/prisma.js'
import {
  extractKeywords,
  scoreATS,
  generateSuggestions,
} from '../services/atsService.js'

export const atsRouter = Router()
atsRouter.use(requireAuth)

const AnalyzeSchema = z.object({
  resumeId:       z.string().optional(),
  resumeText:     z.string().min(50).optional(),
  jobDescription: z.string().min(100, 'Job description must be at least 100 characters'),
  jobTitle:       z.string().max(200).optional(),
  company:        z.string().max(200).optional(),
})

// ── POST /api/ats/analyze ─────────────────────────────────
// Core endpoint: analyze a resume against a job description
atsRouter.post('/analyze', async (req: AuthRequest, res: Response) => {
  const result = AnalyzeSchema.safeParse(req.body)
  if (!result.success) {
    return res.status(400).json({ error: result.error.flatten() })
  }

  const { resumeId, resumeText, jobDescription, jobTitle = 'Unknown Role', company = 'Unknown Company' } = result.data

  // Get resume text (from ID or directly from body)
  let text = resumeText
  let resume = null

  if (resumeId) {
    resume = await db.resume.findFirst({
      where: { id: resumeId, userId: req.userId! },
    })
    if (!resume) return res.status(404).json({ error: 'Resume not found' })
    text = resume.rawText
    // Mark as analyzing
    await db.resume.update({ where: { id: resumeId }, data: { status: 'ANALYZING' } })
  }

  if (!text) {
    return res.status(400).json({ error: 'Provide either resumeId or resumeText' })
  }

  try {
    // Step 1: Extract keywords
    const keywords = await extractKeywords(jobDescription)

    // Step 2: Score the resume
    const breakdown = await scoreATS(text, jobDescription, keywords)

    // Step 3: Generate suggestions
    const suggestions = await generateSuggestions(breakdown, jobTitle, company)

    // Step 4: Get previous score for before/after comparison
    let previousScore = 0
    if (resume) {
      const lastAnalysis = await db.aTSAnalysis.findFirst({
        where:   { resumeId: resume.id },
        orderBy: { createdAt: 'desc' },
        select:  { overallScore: true },
      })
      previousScore = lastAnalysis?.overallScore ?? 0
    }

    // Step 5: Save to DB
    const analysis = await db.aTSAnalysis.create({
      data: {
        resumeId:       resume?.id ?? (await createTempResume(req.userId!, text, jobTitle, company)),
        jobDescription,
        jobTitle,
        company,
        overallScore:    breakdown.overallScore,
        keywordScore:    breakdown.keywordScore    || 0,
        formatScore:     breakdown.formatScore     || 0,
        experienceScore: breakdown.experienceScore || 0,
        skillsScore:     breakdown.skillsScore     || 0,
        actionWordScore: breakdown.actionWordScore || 0,
        previousScore,
        keywordsFound:   breakdown.keywordsFound   || [],
        keywordsMissing: breakdown.keywordsMissing || [],
        suggestions,
      },
    })

    // Update resume status
    if (resume) {
      await db.resume.update({
        where: { id: resume.id },
        data:  { status: 'OPTIMIZED', company },
      })
    }

    res.json({
      analysisId: analysis.id,
      overallScore:    analysis.overallScore,
      previousScore:   analysis.previousScore,
      keywordsFound:   analysis.keywordsFound,
      keywordsMissing: analysis.keywordsMissing,
      suggestions,
    })
  } catch (err) {
    // Reset resume status on failure
    if (resumeId) {
      await db.resume.update({ where: { id: resumeId }, data: { status: 'DRAFT' } }).catch(() => {})
    }
    throw err
  }
})

// ── GET /api/ats/analyses/:resumeId ──────────────────────
// Get all analyses for a resume
atsRouter.get('/analyses/:resumeId', async (req: AuthRequest, res: Response) => {
  // Check if param is an analysisId directly
  const analysis = await db.aTSAnalysis.findFirst({
    where: { id: req.params.resumeId },
    include: { resume: { select: { userId: true } } },
  })

  if (analysis && analysis.resume.userId === req.userId) {
    return res.json({
      id:              analysis.id,
      overallScore:    analysis.overallScore,
      previousScore:   analysis.previousScore ?? 0,
      jobTitle:        analysis.jobTitle,
      company:         analysis.company,
      keywordsFound:   analysis.keywordsFound,
      keywordsMissing: analysis.keywordsMissing,
      suggestions:     analysis.suggestions,
      categories: [
        { label: 'Keyword Match',      score: analysis.keywordScore,    note: `${analysis.keywordsFound.length} keywords`, color: '#B8FF00' },
        { label: 'Format & Structure', score: analysis.formatScore,     note: 'ATS-friendliness', color: '#00D4FF' },
        { label: 'Experience Align',   score: analysis.experienceScore, note: 'Level match',      color: '#7B2FFF' },
        { label: 'Skills Coverage',    score: analysis.skillsScore,     note: 'Skills matched',   color: '#FF8C42' },
        { label: 'Action Words',       score: analysis.actionWordScore, note: 'Verb strength',    color: '#FF4D6D' },
      ],
    })
  }

  // Otherwise treat as resumeId
  const resume = await db.resume.findFirst({
    where:   { id: req.params.resumeId, userId: req.userId! },
    include: { analyses: { orderBy: { createdAt: 'desc' }, take: 10 } },
  })
  if (!resume) return res.status(404).json({ error: 'Not found' })
  res.json({ analyses: resume.analyses })
})

// ── Helpers ───────────────────────────────────────────────
async function createTempResume(
  userId: string,
  rawText: string,
  jobTitle: string,
  company: string
): Promise<string> {
  const resume = await db.resume.create({
    data: {
      userId,
      title:   jobTitle,
      company,
      rawText,
      status:  'OPTIMIZED',
    },
  })
  return resume.id
}
