import { Router, Response } from 'express'
import { requireAuth } from '../middleware/auth.js'
import { db } from '../db/prisma.js'
import { AuthRequest } from '../middleware/auth-types.js'

export const exportRouter = Router()
exportRouter.use(requireAuth as any)

// ── POST /api/export/:resumeId/pdf ────────────────────────
exportRouter.post('/:resumeId/pdf', async (req, res) => {
  const authReq = req as AuthRequest;

  const resumeId = Number(req.params.resumeId);
  const userId = Number(authReq.userId);

  if (isNaN(resumeId) || isNaN(userId)) {
    return res.status(400).json({ error: 'Invalid ID' });
  }

  const resume = await db.resume.findFirst({
    where: { id: resumeId, userId },
  });

  if (!resume) {
    return res.status(404).json({ error: 'Resume not found' });
  }

  const content = resume.optimizedText || resume.originalText;

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="${resume.originalFilename.replace(/\s+/g, '_')}.pdf"`
  );

  res.send(Buffer.from(`%PDF-1.4 — ${resume.originalFilename}\n\n${content}`));
});

// ── POST /api/export/:resumeId/txt ────────────────────────
exportRouter.post('/:resumeId/txt', async (req, res) => {
  const authReq = req as AuthRequest;

  const resumeId = Number(req.params.resumeId);
  const userId = Number(authReq.userId);

  if (isNaN(resumeId) || isNaN(userId)) {
    return res.status(400).json({ error: 'Invalid ID' });
  }

  const resume = await db.resume.findFirst({
    where: { id: resumeId, userId },
  });

  if (!resume) {
    return res.status(404).json({ error: 'Resume not found' });
  }

  const content = resume.optimizedText || resume.originalText;

  res.setHeader('Content-Type', 'text/plain');
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="${resume.originalFilename.replace(/\s+/g, '_')}.txt"`
  );

  res.send(content);
});
