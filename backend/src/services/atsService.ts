import OpenAI from 'openai'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
const MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini'

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
  actionWordScore: number
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
export async function scoreATS(
  resumeText: string,
  jobDescription: string,
  keywords: KeywordData
): Promise<ATSScoreBreakdown> {

  // Deterministic keyword matching
  const allKeywords = [...keywords.required, ...keywords.preferred]
  const keywordsFound = matchKeywords(resumeText, allKeywords)
  const keywordsMissing = allKeywords.filter(k => !keywordsFound.includes(k))

  // LLM scoring explanation (controlled temperature)
  const resp = await openai.chat.completions.create({
    model: MODEL,
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'system',
        content: `
You are an ATS scoring engine. Analyze the resume against the job description.
Return a JSON object with these keys (all integers 0-100):
- keywordScore
- formatScore
- experienceScore
- skillsScore
- actionWordScore
Do NOT include overallScore; it will be computed in code.
      `,
      },
      {
        role: 'user',
        content: `
Job Description:
${jobDescription}

Resume:
${resumeText}

Matched Keywords: ${keywordsFound.join(', ')}
Missing Keywords: ${keywordsMissing.join(', ')}
      `,
      },
    ],
    max_tokens: 1000,
    temperature: 0.1,
  })

  const raw = resp.choices[0].message.content || '{}'
  const data = safeJsonParse<any>(raw, {})

  // Compute overall score deterministically
  const keywordScore    = data.keywordScore    ?? 0
  const formatScore     = data.formatScore     ?? 0
  const experienceScore = data.experienceScore ?? 0
  const skillsScore     = data.skillsScore     ?? 0
  const actionWordScore = data.actionWordScore ?? 0

  const overallScore = Math.round(
    keywordScore * 0.35 +
    formatScore * 0.20 +
    experienceScore * 0.20 +
    skillsScore * 0.15 +
    actionWordScore * 0.10
  )

  return { overallScore, keywordScore, formatScore, experienceScore, skillsScore, actionWordScore, keywordsFound, keywordsMissing }
}

// ── 3. Generate AI optimization suggestions ───────────────
export async function generateSuggestions(
  breakdown: ATSScoreBreakdown,
  jobTitle: string,
  company: string
): Promise<Suggestion[]> {

  // Only top 8 missing keywords for clarity
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
- Action words: ${breakdown.actionWordScore}
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

// ── 4. AI-optimized bullet point ─────────────────────────
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