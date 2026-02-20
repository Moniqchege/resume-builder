import { Router, Request, Response } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { db } from "../db/prisma";
import { z } from 'zod';
import multer from 'multer';
import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';
import { analyzeWithAI, generatePDF, optimizeWithConfirmedSkills } from '../services/aiService.js';
import path from 'path';

export interface AuthRequest extends Request {
  userId?: string;
}

export const resumeRouter = Router();
resumeRouter.use(requireAuth as any);

const CreateResumeSchema = z.object({
  title: z.string().min(1).max(200),
  company: z.string().max(200).optional(),
  rawText: z.string().min(50, 'Resume text must be at least 50 characters'),
});

const UpdateResumeSchema = CreateResumeSchema.partial();

const OptimizeSchema = z.object({
  jobDescription: z.string().min(50),
});

const upload = multer({ storage: multer.memoryStorage() });

/* ── GET /api/resumes ── */
resumeRouter.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const userId = Number(req.userId);
    if (isNaN(userId)) return res.status(400).json({ error: 'Invalid user ID' });

    const resumes = await db.resume.findMany({
      where: { userId },
      include: {
        atsAnalyses: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: { atsScore: true, companyName: true, createdAt: true },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    const mapped = resumes.map(r => ({
      id: r.id,
      title: r.originalFilename,
      company: r.atsAnalyses[0]?.companyName ?? null,
      status: r.status,
      overallScore: r.atsAnalyses[0]?.atsScore ?? 0,
      delta: r.atsAnalyses[0] ? r.atsAnalyses[0].atsScore - (r.currentScore ?? 0) : 0,
      updatedAt: r.updatedAt,
    }));

    res.json({ resumes: mapped });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch resumes' });
  }
});

/* ── GET /api/resumes/stats ── */
resumeRouter.get('/stats', async (req: AuthRequest, res: Response) => {
  try {
    const userId = Number(req.userId);
    if (isNaN(userId)) return res.status(400).json({ error: 'Invalid user ID' });

    const [totalResumes, analyses, todayCount] = await Promise.all([
      db.resume.count({ where: { userId } }),
      db.atsAnalysis.findMany({ where: { resume: { userId } }, select: { atsScore: true } }),
      db.resume.count({
        where: {
          userId,
          status: 'OPTIMIZED',
          updatedAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
        },
      }),
    ]);

    const avgScore = analyses.length
      ? Math.round(analyses.reduce((acc, a) => acc + a.atsScore, 0) / analyses.length)
      : 0;

    res.json({
      totalResumes,
      avgScore,
      jobsApplied: 0,
      optimizedToday: todayCount,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch resume stats' });
  }
});

/* ── GET /api/resumes/:id ── */
resumeRouter.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const resumeId = Number(req.params.id);
    const userId = Number(req.userId);
    if (isNaN(resumeId) || isNaN(userId)) return res.status(400).json({ error: 'Invalid ID or user ID' });

    const resume = await db.resume.findFirst({
      where: { id: resumeId, userId },
      include: { atsAnalyses: { orderBy: { createdAt: 'desc' }, take: 3 } },
    });

    if (!resume) return res.status(404).json({ error: 'Resume not found' });
    res.json(resume);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch resume' });
  }
});

/* ── POST /api/resumes ── */
resumeRouter.post('/', async (req: AuthRequest, res: Response) => {
  const result = CreateResumeSchema.safeParse(req.body);
  if (!result.success) return res.status(400).json({ error: result.error.flatten() });

  try {
    const userId = Number(req.userId);
    if (isNaN(userId)) return res.status(400).json({ error: 'Invalid user ID' });

    const resume = await db.resume.create({
      data: {
        userId,
        originalFilename: result.data.title,
        originalText: result.data.rawText,
        originalFileUrl: '',
        status: 'DRAFT',
        currentScore: 0,
      },
    });

    res.status(201).json(resume);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create resume' });
  }
});

/* ── POST /api/resumes/:id/optimize ── */
resumeRouter.post('/:id/optimize', async (req: AuthRequest, res: Response) => {
  try {
    const resumeId = Number(req.params.id);
    const userId = Number(req.userId);
    if (isNaN(resumeId) || isNaN(userId)) return res.status(400).json({ error: 'Invalid ID or user ID' });

    const existingResume = await db.resume.findFirst({ where: { id: resumeId, userId } });
    if (!existingResume) return res.status(404).json({ error: 'Resume not found' });

    const parseResult = OptimizeSchema.safeParse(req.body);
    if (!parseResult.success) return res.status(400).json({ error: parseResult.error.flatten() });

    const { jobDescription } = parseResult.data;

    const aiResult = await analyzeWithAI({
      resumeText: existingResume.originalText,
      jobDescription,
    });
    res.json({
      resumeId: existingResume.id,
      overallScore: aiResult.overallScore,
      keywordMatches: aiResult.keywordMatches,
      missingKeywords: aiResult.missingKeywords,
      unconfirmedSkills: aiResult.missingKeywords, 
      requiresConfirmation: true,
    });
  } catch (err) {
    console.error('AI optimization failed:', err);
    res.status(500).json({ error: 'AI optimization failed' });
  }
});

/* ── POST /api/resumes/:id/optimize-confirmed ── */
resumeRouter.post('/:id/optimize-confirmed', async (req: AuthRequest, res: Response) => {
  try {
    const resumeId = Number(req.params.id);
    const userId = Number(req.userId);
    if (isNaN(resumeId) || isNaN(userId)) return res.status(400).json({ error: 'Invalid ID or user ID' });

    const existingResume = await db.resume.findFirst({ where: { id: resumeId, userId } });
    if (!existingResume) return res.status(404).json({ error: 'Resume not found' });

    const { jobDescription, confirmedSkills, overallScore, keywordMatches, missingKeywords } = req.body;
    if (!jobDescription) return res.status(400).json({ error: 'Job description is required' });

    const optimizedText = await optimizeWithConfirmedSkills(
      existingResume.originalText,
      jobDescription,
      confirmedSkills ?? []
    );

    const analysis = await db.atsAnalysis.create({
      data: {
        resumeId: existingResume.id,
        atsScore: overallScore ?? 70,
        previousScore: existingResume.currentScore ?? 0,
        matchedKeywords: [...(keywordMatches ?? []), ...(confirmedSkills ?? [])],
        missingKeywords: (missingKeywords ?? []).filter((k: string) => !confirmedSkills?.includes(k)),
        jobDescription,
      },
    });

    const fileUrlForDB = await generatePDF(existingResume.id, optimizedText);
    const updatedResume = await db.resume.update({
      where: { id: existingResume.id },
      data: {
        optimizedText,
        optimizedFileUrl: fileUrlForDB,
        currentScore: overallScore ?? 70,
        status: 'OPTIMIZED',
      },
    });

    res.json({
      resumeId: updatedResume.id,
      analysisId: analysis.id,
      overallScore: overallScore ?? 70,
      optimizedText,
      optimizedFileUrl: `http://localhost:4000/uploads/optimized_${resumeId}.pdf`,
    });
  } catch (err) {
    console.error('Confirmed optimization failed:', err);
    res.status(500).json({ error: 'Optimization failed' });
  }
});

/* ── PATCH /api/resumes/:id ── */
resumeRouter.patch('/:id', async (req: AuthRequest, res: Response) => {
  const parseResult = UpdateResumeSchema.safeParse(req.body);
  if (!parseResult.success) return res.status(400).json({ error: parseResult.error.flatten() });

  try {
    const resumeId = Number(req.params.id);
    const userId = Number(req.userId);
    if (isNaN(resumeId) || isNaN(userId)) return res.status(400).json({ error: 'Invalid ID or user ID' });

    const existingResume = await db.resume.findFirst({ where: { id: resumeId, userId } });
    if (!existingResume) return res.status(404).json({ error: 'Resume not found' });

    const updateData: any = {};
    if (parseResult.data.title !== undefined) updateData.originalFilename = parseResult.data.title;
    if (parseResult.data.rawText !== undefined) updateData.originalText = parseResult.data.rawText;

    const updated = await db.resume.update({
      where: { id: existingResume.id },
      data: updateData,
    });

    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update resume' });
  }
});

/* ── DELETE /api/resumes/:id ── */
resumeRouter.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const resumeId = Number(req.params.id);
    const userId = Number(req.userId);
    if (isNaN(userId)) return res.status(400).json({ error: 'Invalid user ID' });

    const existing = await db.resume.findFirst({ where: { id: resumeId, userId } });
    if (!existing) return res.status(404).json({ error: 'Resume not found' });

    await db.resume.delete({ where: { id: resumeId } });
    res.json({ message: 'Resume deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete resume' });
  }
});

/* ── POST /api/resumes/upload ── */
resumeRouter.post('/upload', upload.single('file'), async (req: AuthRequest, res: Response) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

  const { buffer, originalname, mimetype } = req.file;
  let text = '';

  try {
    if (mimetype === 'application/pdf') {
      const pdf = await pdfParse(buffer);
      text = pdf.text;
    } else if (
      mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      mimetype === 'application/msword'
    ) {
      const doc = await mammoth.extractRawText({ buffer });
      text = doc.value;
    } else if (mimetype === 'text/plain') {
      text = buffer.toString('utf-8');
    } else {
      return res.status(400).json({ error: 'Unsupported file type' });
    }

    const userId = Number(req.userId);
    if (isNaN(userId)) return res.status(400).json({ error: 'Invalid user ID' });

    const resume = await db.resume.create({
      data: {
        userId,
        originalFilename: originalname,
        originalFileUrl: '',
        originalText: text,
        status: 'DRAFT',
        currentScore: 0,
      },
    });

    res.json({ resumeId: resume.id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to process resume' });
  }
});

resumeRouter.get('/:id/download', async (req, res) => {
  const resumeId = Number(req.params.id);
  const userId = Number((req as AuthRequest).userId);

  const resume = await db.resume.findFirst({
    where: { id: resumeId, userId },
  });

  if (!resume?.optimizedFileUrl) {
    return res.status(404).send('File not found');
  }

  const filePath = path.join(process.cwd(), resume.optimizedFileUrl);

  res.download(filePath); 
});

export default resumeRouter;