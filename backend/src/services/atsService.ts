import OpenAI from 'openai'
import Groq from 'groq-sdk';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
const MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini'
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export interface KeywordData {
  required: string[]
  preferred: string[]
  soft: string[]
}

export interface ATSScoreBreakdown {
  overallScore: number
  keywordScore: number
  formatScore: number
  experienceScore: number
  skillsScore: number
  actionWordsScore: number
  keywordsFound: string[]
  keywordsMissing: string[]
}

export interface Suggestion {
  icon: string
  color: string
  title: string
  body: string
}

// Helpers
function safeJsonParse<T>(raw: string, fallback: T): T {
  try {
    return JSON.parse(raw)
  } catch {
    return fallback
  }
}

/** Deterministic keyword matching */
function matchKeywords(resumeText: string, keywords: string[]): string[] {
  const lowerResume = resumeText.toLowerCase()
  return keywords.filter(k => lowerResume.includes(k.toLowerCase()))
}

// ── 1. Extract keywords from job description ──────────────
export async function extractKeywords(jobDescription: string): Promise<KeywordData> {
  const resp = await openai.chat.completions.create({
    model: MODEL,
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'system',
        content: `
You are an expert ATS recruiter. Extract ONLY job-critical keywords from the job description.
Return a JSON object with exactly these keys:
- required: string[]   (must-have technical skills, tools, qualifications)
- preferred: string[]  (nice-to-have skills)
- soft: string[]       (soft skills and methodologies)
Keep each keyword concise (1–3 words). Aim for 15–25 required keywords total.
        `,
      },
      {
        role: 'user',
        content: `Extract keywords from this job description:\n\n${jobDescription}`,
      },
    ],
    max_tokens: 800,
    temperature: 0.1,
  })

  const raw = resp.choices[0].message.content || '{}'
  return safeJsonParse<KeywordData>(raw, { required: [], preferred: [], soft: [] })
}

// ── 2. Score resume against job description ───────────────
export async function scoreATS(resumeText: string, jobDescription: string) {
  const response = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [{
      role: 'user',
      content: `You are an ATS scoring engine. Analyze this resume against the job description and respond ONLY with valid JSON, no markdown:
{
  "overallScore": <0-100>,
  "keywordScore": <0-100, % of JD keywords found in resume>,
  "formatScore": <0-100, how ATS-friendly is the structure: clear sections, no tables/graphics, standard headings>,
  "experienceScore": <0-100, how well does candidate's experience level and role history match the JD requirements>,
  "skillsScore": <0-100, % of required technical skills covered>,
  "actionWordsScore": <0-100, strength and variety of action verbs used in bullet points>,
  "keywordsFound": ["skill1", "skill2"],
  "keywordsMissing": ["skill3", "skill4"]
}

RESUME:
${resumeText}

JOB DESCRIPTION:
${jobDescription}`
    }],
    temperature: 0.2,
  });

  const raw = (response.choices[0].message.content || '').replace(/```json|```/g, '').trim();
  console.log('scoreATS raw response:', raw);
  
  try {
    const parsed = JSON.parse(raw);
    return {
      overallScore: parsed.overallScore ?? 70,
      keywordScore: parsed.keywordScore ?? 0,
      formatScore: parsed.formatScore ?? 0,
      experienceScore: parsed.experienceScore ?? 0,
      skillsScore: parsed.skillsScore ?? 0,
      actionWordsScore: parsed.actionWordsScore ?? 0,
      keywordsFound: parsed.keywordsFound ?? [],
      keywordsMissing: parsed.keywordsMissing ?? [],
    };
  } catch (e) {
    console.error('Failed to parse scoreATS JSON', e);
    return {
      overallScore: 70, keywordScore: 0, formatScore: 0,
      experienceScore: 0, skillsScore: 0, actionWordsScore: 0,
      keywordsFound: [], keywordsMissing: [],
    };
  }
}

// ── 3. Generate AI optimization suggestions ───────────────
export async function generateSuggestions(
  breakdown: ATSScoreBreakdown,
  jobTitle: string,
  company: string
): Promise<Suggestion[]> {
  const topMissing = breakdown.keywordsMissing.slice(0, 8)

  const resp = await openai.chat.completions.create({
    model: MODEL,
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'system',
        content: `
You are a resume coach. Given ATS analysis results, write 3 specific, actionable improvement suggestions.
Return a JSON object: { suggestions: Array<{icon: string, color: string, title: string, body: string}> }
Use these colors: #7B2FFF, #00D4FF, #FF4D6D (one each, in order)
Use emojis for icons: 📌, ⚙️, 📊
Keep body under 120 characters. Be very specific about what to add.
      `,
      },
      {
        role: 'user',
        content: `
Job: ${jobTitle} at ${company}
Score: ${breakdown.overallScore}/100
Missing keywords: ${topMissing.join(', ')}
Lowest scoring areas based on scores:
- Keyword: ${breakdown.keywordScore}
- Format: ${breakdown.formatScore}
- Experience: ${breakdown.experienceScore}
- Skills: ${breakdown.skillsScore}
- Action words: ${breakdown.actionWordsScore}
      `,
      },
    ],
    max_tokens: 600,
    temperature: 0.5,
  })

  const raw = resp.choices[0].message.content || '{}'
  const data = safeJsonParse<any>(raw, {})
  return data.suggestions || []
}

export async function optimizeBullet(
  originalBullet: string,
  targetKeywords: string[],
  seniority: string = 'senior'
): Promise<string> {
  const resp = await openai.chat.completions.create({
    model: MODEL,
    messages: [
      {
        role: 'system',
        content: `
You are a professional resume writer specializing in ATS optimization.
Rewrite the bullet point to naturally incorporate target keywords.
Rules:
- Keep the same core achievement/responsibility
- Start with a strong action verb
- Quantify only if measurable impact is implied; otherwise insert [X%] placeholder
- Do NOT fabricate skills or experience
- Keep under 2 lines
- Return ONLY the rewritten bullet, no explanation
        `,
      },
      {
        role: 'user',
        content: `
Seniority level: ${seniority}
Target keywords to weave in: ${targetKeywords.join(', ')}

Original bullet:
${originalBullet}
        `,
      },
    ],
    max_tokens: 200,
    temperature: 0.4,
  })

  return resp.choices[0].message.content?.trim() || originalBullet
}