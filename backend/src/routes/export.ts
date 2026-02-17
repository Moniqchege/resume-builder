import { Router, Response } from 'express'
import { requireAuth, AuthRequest } from '../middleware/auth.js'
import { db } from '../db/prisma.js'

export const exportRouter = Router()
exportRouter.use(requireAuth)

// ── POST /api/export/:resumeId/pdf ────────────────────────
exportRouter.post('/:resumeId/pdf', async (req: AuthRequest, res: Response) => {
  const resume = await db.resume.findFirst({
    where: { id: req.params.resumeId, userId: req.userId! },
  })
  if (!resume) return res.status(404).json({ error: 'Resume not found' })

  // TODO: Integrate pdf-lib or puppeteer to generate styled PDF
  // For MVP: return a plain text version
  const content = resume.optimizedText || resume.rawText

  res.setHeader('Content-Type', 'application/pdf')
  res.setHeader('Content-Disposition', `attachment; filename="${resume.title.replace(/\s+/g, '_')}.pdf"`)

  // Placeholder — in production generate a real PDF here
  res.send(Buffer.from(`%PDF-1.4 — ${resume.title}\n\n${content}`))
})

// ── POST /api/export/:resumeId/txt ────────────────────────
exportRouter.post('/:resumeId/txt', async (req: AuthRequest, res: Response) => {
  const resume = await db.resume.findFirst({
    where: { id: req.params.resumeId, userId: req.userId! },
  })
  if (!resume) return res.status(404).json({ error: 'Resume not found' })

  const content = resume.optimizedText || resume.rawText
  res.setHeader('Content-Type', 'text/plain')
  res.setHeader('Content-Disposition', `attachment; filename="${resume.title.replace(/\s+/g, '_')}.txt"`)
  res.send(content)

  // Log export in DB
  await db.export.create({
    data: { resumeId: resume.id, format: 'TXT' },
  }).catch(() => {})
})
