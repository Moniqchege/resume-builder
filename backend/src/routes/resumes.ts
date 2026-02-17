import { Router, Response } from 'express'
import { requireAuth, AuthRequest } from '../middleware/auth.js'
import { db } from '../db/prisma.js'
import { z } from 'zod'

export const resumeRouter = Router()
resumeRouter.use(requireAuth)

const CreateResumeSchema = z.object({
  title:   z.string().min(1).max(200),
  company: z.string().max(200).optional(),
  rawText: z.string().min(50, 'Resume text must be at least 50 characters'),
})

const UpdateResumeSchema = CreateResumeSchema.partial()

// ── GET /api/resumes ──────────────────────────────────────
resumeRouter.get('/', async (req: AuthRequest, res: Response) => {
  const resumes = await db.resume.findMany({
    where:   { userId: req.userId! },
    include: {
      analyses: {
        orderBy: { createdAt: 'desc' },
        take: 1,
        select: { overallScore: true, previousScore: true, createdAt: true },
      },
    },
    orderBy: { updatedAt: 'desc' },
  })

  const mapped = resumes.map(r => ({
    id:           r.id,
    title:        r.title,
    company:      r.company,
    status:       r.status,
    overallScore: r.analyses[0]?.overallScore ?? 0,
    delta:        r.analyses[0]
      ? r.analyses[0].overallScore - (r.analyses[0].previousScore ?? 0)
      : 0,
    updatedAt:    r.updatedAt,
  }))

  res.json({ resumes: mapped })
})

// ── GET /api/resumes/stats ────────────────────────────────
resumeRouter.get('/stats', async (req: AuthRequest, res: Response) => {
  const [totalResumes, analyses, todayCount] = await Promise.all([
    db.resume.count({ where: { userId: req.userId! } }),
    db.aTSAnalysis.findMany({
      where:   { resume: { userId: req.userId! } },
      select:  { overallScore: true },
    }),
    db.resume.count({
      where: {
        userId:    req.userId!,
        status:    'OPTIMIZED',
        updatedAt: { gte: new Date(new Date().setHours(0,0,0,0)) },
      },
    }),
  ])

  const avgScore = analyses.length
    ? Math.round(analyses.reduce((acc, a) => acc + a.overallScore, 0) / analyses.length)
    : 0

  res.json({
    totalResumes,
    avgScore,
    jobsApplied:    0,  // extend later with a JobApplication model
    optimizedToday: todayCount,
  })
})

// ── GET /api/resumes/:id ──────────────────────────────────
resumeRouter.get('/:id', async (req: AuthRequest, res: Response) => {
  const resume = await db.resume.findFirst({
    where:   { id: req.params.id, userId: req.userId! },
    include: { analyses: { orderBy: { createdAt: 'desc' }, take: 3 } },
  })
  if (!resume) return res.status(404).json({ error: 'Resume not found' })
  res.json(resume)
})

// ── POST /api/resumes ─────────────────────────────────────
resumeRouter.post('/', async (req: AuthRequest, res: Response) => {
  const result = CreateResumeSchema.safeParse(req.body)
  if (!result.success) {
    return res.status(400).json({ error: result.error.flatten() })
  }

  const resume = await db.resume.create({
    data: { userId: req.userId!, ...result.data },
  })
  res.status(201).json(resume)
})

// ── PATCH /api/resumes/:id ────────────────────────────────
resumeRouter.patch('/:id', async (req: AuthRequest, res: Response) => {
  const existing = await db.resume.findFirst({
    where: { id: req.params.id, userId: req.userId! },
  })
  if (!existing) return res.status(404).json({ error: 'Resume not found' })

  const result = UpdateResumeSchema.safeParse(req.body)
  if (!result.success) return res.status(400).json({ error: result.error.flatten() })

  const updated = await db.resume.update({
    where: { id: req.params.id },
    data:  result.data,
  })
  res.json(updated)
})

// ── DELETE /api/resumes/:id ───────────────────────────────
resumeRouter.delete('/:id', async (req: AuthRequest, res: Response) => {
  const existing = await db.resume.findFirst({
    where: { id: req.params.id, userId: req.userId! },
  })
  if (!existing) return res.status(404).json({ error: 'Resume not found' })

  await db.resume.delete({ where: { id: req.params.id } })
  res.json({ message: 'Resume deleted' })
})
