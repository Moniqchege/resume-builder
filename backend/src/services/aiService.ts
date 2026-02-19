export interface AIAnalyzeInput {
  resumeText: string
  jobDescription?: string | null
}

export interface AIAnalyzeOutput {
  overallScore: number
  keywordMatches: string[]
  missingKeywords: string[]
  optimizedText: string
}

export async function analyzeWithAI(input: AIAnalyzeInput): Promise<AIAnalyzeOutput> {
  const { resumeText, jobDescription } = input

  const jdWords = jobDescription?.split(/\W+/).filter(Boolean) || []
  const resumeWords = resumeText.split(/\W+/).filter(Boolean)

  const keywordMatches = jdWords.filter(word =>
    resumeWords.some(rw => rw.toLowerCase() === word.toLowerCase())
  )

  const missingKeywords = jdWords.filter(word =>
    !keywordMatches.includes(word)
  )

  const overallScore = jdWords.length
    ? Math.round((keywordMatches.length / jdWords.length) * 100)
    : 50 
  const optimizedText = resumeText + '\n\nOptimized Keywords: ' + keywordMatches.join(', ')
  await new Promise(resolve => setTimeout(resolve, 500))

  return {
    overallScore,
    keywordMatches,
    missingKeywords,
    optimizedText,
  }
}
