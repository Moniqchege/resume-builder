import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Anthropic from '@anthropic-ai/sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';
import Groq from 'groq-sdk';


const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface AIAnalyzeInput {
  resumeText: string
  jobDescription?: string | null
}

export interface AIAnalyzeOutput {
  overallScore: number
  keywordMatches: string[]
  missingKeywords: string[]
  unconfirmedSkills: string[] 
  optimizedText: string
  jobTitle?: string
  companyName?: string
}

const SKILLS_LIST = [
  'React', 'TypeScript', 'Next.js', 'GraphQL', 'REST', 'CI/CD',
  'Agile', 'Scrum', 'Webpack', 'Vite', 'Performance optimization'
]

function extractJobInfo(jd: string) {
  const firstLine = jd.split('\n')[0] || ''
  const match = firstLine.match(/(.+) at (.+)/i)
  if (match) {
    return {
      jobTitle: match[1].trim(),
      companyName: match[2].trim()
    }
  }
  return { jobTitle: undefined, companyName: undefined }
}

export async function analyzeWithAI(input: AIAnalyzeInput): Promise<AIAnalyzeOutput> {
  const { resumeText, jobDescription } = input;
  if (!jobDescription) throw new Error('Job description is required');

  const firstLine = jobDescription.split('\n')[0];
  const jobMatch = firstLine.match(/(.+) at (.+)/i);
  const jobTitle = jobMatch?.[1]?.trim();
  const companyName = jobMatch?.[2]?.trim();
  const analysisResponse = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [{
      role: 'user',
      content: `You are a professional resume analyst. Compare this resume to the job description.

Respond ONLY with valid JSON, no markdown:
{
  "overallScore": <number 0-100>,
  "keywordMatches": ["skills explicitly present in resume"],
  "missingKeywords": ["important JD skills completely absent from resume"],
  "impliedSkills": ["skills not explicitly named in resume but strongly implied by the candidate's experience"]
}

RESUME:
${resumeText}

JOB DESCRIPTION:
${jobDescription}`
    }],
    temperature: 0.3,
  });

  let analysis = {
    overallScore: 70,
    keywordMatches: [] as string[],
    missingKeywords: [] as string[],
    impliedSkills: [] as string[]
  };
  try {
    const raw = (analysisResponse.choices[0].message.content || '').replace(/```json|```/g, '').trim();
    analysis = JSON.parse(raw);
  } catch (e) {
    console.error('Failed to parse analysis JSON', e);
  }

  return {
    overallScore: analysis.overallScore,
    keywordMatches: analysis.keywordMatches,
    missingKeywords: analysis.missingKeywords,
    unconfirmedSkills: analysis.missingKeywords, 
    optimizedText: '', 
    companyName
  };
}

export async function optimizeWithConfirmedSkills(
  resumeText: string,
  jobDescription: string,
  confirmedSkills: string[]
): Promise<string> {

  const optimizeResponse = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [{
      role: 'user',
      content: `You are an expert ATS-optimized resume writer.

The candidate has confirmed they possess these additional skills:
CONFIRMED ADDITIONAL SKILLS: ${confirmedSkills.join(', ')}

STRICT RULES:
- Naturally integrate the CONFIRMED ADDITIONAL SKILLS into the resume where relevant.
- Mirror exact JD terminology where the candidate has equivalent experience.
- Reorder bullet points so most JD-relevant achievements appear first.
- Rewrite the Summary to directly address the job title and top requirements.
- Do NOT add any skills beyond what's in the original resume + confirmed additional skills.
- Output plain text only. No markdown. Section headers in ALL CAPS.

AI & MACHINE LEARNING RULES (very important):
- Any mention of AI, artificial intelligence, machine learning, AI agents, or ML-related work may ONLY appear in:
  1. The SUMMARY section
  2. Work history entries dated 2024 or later
- For any work experience before 2024 (e.g. 2022, 2023 roles), completely remove any AI/ML language even if it appears in the original resume.
- This applies to phrases like "teaching AI agents", "machine learning principles", "AI-driven", "ML models", etc.
- Earlier roles should describe only the genuine technical work done at the time (HTML, CSS, React, APIs, etc.)

TARGET JOB DESCRIPTION:
${jobDescription}

CANDIDATE'S ORIGINAL RESUME:
${resumeText}

Now rewrite the resume:`
    }],
    temperature: 0.4,
  });

  return optimizeResponse.choices[0].message.content || resumeText;
}

export async function generatePDF(resumeId: number, text: string): Promise<string> {
  const uploadsDir = path.join(__dirname, '../../uploads');

  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  const filePath = path.join(uploadsDir, `optimized_${resumeId}.pdf`);
  const doc = new PDFDocument({ autoFirstPage: true });

  return new Promise<string>((resolve, reject) => {
    const stream = fs.createWriteStream(filePath);

    doc.pipe(stream);
    doc.font('Times-Roman').fontSize(12).text(text, { lineGap: 4 });
    doc.end();

    stream.on('finish', () => {
      const backendUrl = process.env.BACKEND_URL || 'http://localhost:4000';
      resolve(`${backendUrl}/uploads/optimized_${resumeId}.pdf`);
    });

    stream.on('error', (err) => reject(err));
  });
}