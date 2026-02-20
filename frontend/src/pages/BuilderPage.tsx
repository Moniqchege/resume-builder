import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { useDropzone } from 'react-dropzone'
import toast from 'react-hot-toast'
import api from '@lib/api'

const STEPS = ['Job Description', 'AI Analysis', 'Confirm Skills', 'Score & Edit', 'Export']

const ANALYSIS_STAGES = [
  'Parsing job description…',
  'Extracting ATS keywords…',
  'Analyzing skill requirements…',
  'Mapping your experience…',
  'Scoring keyword coverage…',
  'Generating optimized bullets…',
  'Finalizing ATS report…',
]

const EXAMPLE_JD = `Senior Frontend Engineer at Stripe

We're looking for a Senior Frontend Engineer to join Stripe's Growth team.

Requirements:
- 5+ years of React/TypeScript experience
- Strong knowledge of Next.js and SSR
- Experience with GraphQL and REST APIs
- CI/CD pipelines (GitHub Actions)
- Performance optimization and Core Web Vitals
- Agile/Scrum methodology
- Webpack/Vite build tooling`

interface AnalysisResult {
  resumeId: number
  overallScore: number
  keywordMatches: string[]
  missingKeywords: string[]
  unconfirmedSkills: string[]
  requiresConfirmation: boolean
}

export default function BuilderPage() {
  const navigate = useNavigate()
  const [step, setStep]                   = useState(0)
  const [jd, setJd]                       = useState('')
  const [progress, setProgress]           = useState(0)
  const [stage, setStage]                 = useState('')
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null)
  const [checkedSkills, setCheckedSkills] = useState<Record<string, boolean>>({})

  useEffect(() => {
    async function checkResume() {
      const res = await api.get('/api/resumes')
      if (res.data.resumes.length) {
        localStorage.setItem('activeResumeId', res.data.resumes[0].id)
      }
    }
    checkResume()
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc', '.docx'],
      'text/plain': ['.txt']
    },
    maxFiles: 1,
    onDrop: async (files) => {
      const file = files[0]
      if (!file) return
      try {
        const formData = new FormData()
        formData.append('file', file)
        const res = await api.post('/api/resumes/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
        localStorage.setItem('activeResumeId', res.data.resumeId)
        toast.success('Resume uploaded successfully!')
      } catch (err: any) {
        toast.error(err?.response?.data?.error ?? 'Resume upload failed.')
      }
    },
  })

  const resumeId = localStorage.getItem('activeResumeId')
  const analyzeMutation = useMutation({
    mutationFn: (payload: { jobDescription: string }) =>
      api.post(`/api/resumes/${resumeId}/optimize`, payload).then(r => r.data),

    onMutate: () => {
      setStep(1)
      setProgress(0)
      let p = 0
      let si = 0
      setStage(ANALYSIS_STAGES[0])
      const iv = setInterval(() => {
        p += Math.random() * 10 + 2
        setProgress(Math.min(p, 90))
        si = Math.min(Math.floor((p / 100) * ANALYSIS_STAGES.length), ANALYSIS_STAGES.length - 1)
        setStage(ANALYSIS_STAGES[si])
        if (p >= 90) clearInterval(iv)
      }, 200)
    },

    onSuccess: (data: AnalysisResult) => {
      setProgress(100)
      setStage('Analysis complete!')
      setAnalysisResult(data)
      const initial: Record<string, boolean> = {}
      data.unconfirmedSkills.forEach(s => { initial[s] = false })
      setCheckedSkills(initial)
      setTimeout(() => setStep(2), 400) 
    },

    onError: (err: any) => {
      toast.error(err?.response?.data?.error ?? 'Analysis failed.')
      setStep(0)
      setProgress(0)
    },
  })
  const confirmMutation = useMutation({
    mutationFn: (payload: {
      jobDescription: string
      confirmedSkills: string[]
      overallScore: number
      keywordMatches: string[]
      missingKeywords: string[]
    }) =>
      api.post(`/api/resumes/${resumeId}/optimize-confirmed`, payload).then(r => r.data),

    onMutate: () => {
      setStep(3)
      setProgress(0)
      let p = 0
      setStage('Weaving in your skills…')
      const iv = setInterval(() => {
        p += Math.random() * 12 + 3
        setProgress(Math.min(p, 90))
        if (p >= 90) {
          setStage('Finalizing resume…')
          clearInterval(iv)
        }
      }, 200)
    },

    onSuccess: (data) => {
      setProgress(100)
      setStage('Complete!')
      setTimeout(() => navigate(`/ats-analyzer/${data.analysisId}`), 600)
    },

    onError: (err: any) => {
      toast.error(err?.response?.data?.error ?? 'Optimization failed.')
      setStep(2)
    },
  })

  function handleAnalyze() {
    const resumeId = localStorage.getItem('activeResumeId')
    if (!resumeId) return toast.error('Please upload your resume first.')
    if (!jd.trim()) return toast.error('Please paste a job description first.')
    analyzeMutation.mutate({ jobDescription: jd })
  }

  function handleConfirm() {
    if (!analysisResult) return
    const confirmedSkills = Object.entries(checkedSkills)
      .filter(([, checked]) => checked)
      .map(([skill]) => skill)

    confirmMutation.mutate({
      jobDescription: jd,
      confirmedSkills,
      overallScore: analysisResult.overallScore,
      keywordMatches: analysisResult.keywordMatches,
      missingKeywords: analysisResult.missingKeywords,
    })
  }

  function toggleSkill(skill: string) {
    setCheckedSkills(prev => ({ ...prev, [skill]: !prev[skill] }))
  }

  const wordCount = jd.split(/\s+/).filter(Boolean).length

  return (
    <div className="animate-fade-up space-y-8">
      {/* Header */}
      <div>
        <p className="text-[11px] text-cyan font-mono tracking-[2px] mb-1.5">NEW RESUME</p>
        <h1 className="text-[34px] font-bold text-ink-primary tracking-[-1px]">Resume Builder</h1>
        <p className="text-ink-muted text-sm mt-1">Paste a job description to kick off AI optimization</p>
      </div>

      {/* Step Indicator */}
      <div className="flex items-center gap-0">
        {STEPS.map((s, i) => {
          const done = i < step
          const cur  = i === step
          return (
            <div key={s} className="flex items-center">
              <div className="flex items-center gap-2">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 transition-all duration-300 ${
                  done ? 'bg-grad-lime text-space-bg shadow-lime' :
                  cur  ? 'bg-grad-cyan text-space-bg shadow-cyan' :
                         'bg-space-card text-ink-dim border border-space-border'
                }`}>
                  {done ? '✓' : i + 1}
                </div>
                <span className={`text-[13px] font-${cur ? 'bold' : 'normal'} ${cur ? 'text-ink-primary' : 'text-ink-dim'}`}>{s}</span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={`w-8 h-px mx-2.5 ${done ? 'bg-cyan/40' : 'bg-space-border'} transition-colors`} />
              )}
            </div>
          )
        })}
      </div>

      {/* ── Step 2: Skill Confirmation ── */}
      {step === 2 && analysisResult && (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-5">
          <div className="glass-card p-6 space-y-5">
            <div>
              <p className="text-[10px] font-semibold text-cyan font-mono tracking-[2px] mb-1">◎ SKILL CONFIRMATION</p>
              <h2 className="text-[20px] font-bold text-ink-primary">Which of these do you actually have?</h2>
              <p className="text-[13px] text-ink-muted mt-1">
                These skills appear in the job description but weren't found in your resume.
                Tick any you genuinely have — they'll be woven into your optimized resume.
              </p>
            </div>

            {/* Already matched skills */}
            {analysisResult.keywordMatches.length > 0 && (
              <div>
                <p className="text-[11px] font-semibold text-lime font-mono tracking-[1px] mb-2">✓ ALREADY IN YOUR RESUME</p>
                <div className="flex flex-wrap gap-2">
                  {analysisResult.keywordMatches.map(skill => (
                    <span key={skill} className="px-3 py-1 rounded-full text-[12px] font-mono bg-lime/10 text-lime border border-lime/20">
                      ✓ {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Skills to confirm */}
            {analysisResult.unconfirmedSkills.length > 0 && (
              <div>
                <p className="text-[11px] font-semibold text-violet font-mono tracking-[1px] mb-3">? TICK ONES YOU HAVE (BUT DIDN'T LIST)</p>
                <div className="space-y-2">
                  {analysisResult.unconfirmedSkills.map(skill => (
                    <label
                      key={skill}
                      className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all duration-150 ${
                        checkedSkills[skill]
                          ? 'border-cyan/40 bg-cyan/[0.06]'
                          : 'border-space-border bg-space-surface/30 hover:border-cyan/20'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={!!checkedSkills[skill]}
                        onChange={() => toggleSkill(skill)}
                        className="w-4 h-4 accent-cyan rounded"
                      />
                      <span className="text-[13px] text-ink-primary font-mono">{skill}</span>
                      {checkedSkills[skill] && (
                        <span className="ml-auto text-[11px] text-cyan font-mono">will be added ✓</span>
                      )}
                    </label>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button
                onClick={handleConfirm}
                disabled={confirmMutation.isPending}
                className="btn-primary flex-1 py-3.5 text-[14px]"
              >
                ✦ Optimize My Resume
              </button>
              <button
                onClick={() => setStep(0)}
                className="px-5 py-3.5 text-[13px] border border-space-border rounded-xl text-ink-muted hover:border-cyan/30 hover:text-ink-primary transition-all"
              >
                ← Back
              </button>
            </div>
          </div>

          {/* Score preview */}
          <div className="glass-card p-5 h-fit">
            <p className="text-[10px] font-semibold text-cyan font-mono tracking-[2px] mb-4">◎ CURRENT SCORE</p>
            <div className="text-center py-4">
              <div className="text-[52px] font-bold text-ink-primary leading-none">
                {analysisResult.overallScore}
                <span className="text-[22px] text-ink-muted">%</span>
              </div>
              <p className="text-[12px] text-ink-muted mt-2">ATS match score</p>
              <p className="text-[11px] text-cyan font-mono mt-1">
                +{Object.values(checkedSkills).filter(Boolean).length} skills selected
              </p>
            </div>
            <div className="h-1.5 rounded-full bg-space-surface overflow-hidden mt-2">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{
                  width: `${analysisResult.overallScore}%`,
                  background: 'linear-gradient(90deg, #00D4FF, #7B2FFF)',
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* ── Steps 0, 1, 3: JD input + progress ── */}
      {step !== 2 && (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-5">
          <div>
            <div className={`glass-card overflow-hidden transition-colors ${jd ? 'border-cyan/30' : 'border-space-border'}`}>
              <div className={`px-5 py-3 border-b border-space-border flex items-center gap-2.5 ${jd ? 'bg-cyan/[0.04]' : 'bg-space-surface/30'}`}>
                <div className={`w-2 h-2 rounded-full ${jd ? 'bg-cyan' : 'bg-space-border'}`} />
                <span className="text-[12px] text-ink-muted font-mono flex-1">job_description.txt</span>
                {jd && <span className="text-[11px] text-cyan font-mono">{wordCount} words</span>}
              </div>

              <textarea
                value={jd}
                onChange={e => setJd(e.target.value)}
                disabled={step > 0}
                placeholder={"Paste the full job description here…\n\nThe more detail you include, the better our AI can optimize your resume for ATS filters.\n\nTip: Include title, requirements, preferred skills."}
                className="w-full min-h-[320px] p-5 bg-transparent border-none outline-none
                           text-ink-primary font-mono text-[13px] leading-[1.75] resize-y
                           placeholder:text-ink-dim disabled:opacity-60"
              />

              {!jd && (
                <div {...getRootProps()} className={`mx-5 mb-5 border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all duration-200 ${
                  isDragActive ? 'border-cyan/60 bg-cyan/[0.04]' : 'border-space-border hover:border-cyan/30 hover:bg-cyan/[0.02]'
                }`}>
                  <input {...getInputProps()} />
                  <p className="text-[13px] text-ink-muted">
                    Or <span className="text-cyan font-semibold">drop a file</span> — PDF, DOCX, or TXT
                  </p>
                </div>
              )}
            </div>

            <button
              onClick={() => setJd(EXAMPLE_JD)}
              className="mt-2.5 text-[12px] text-ink-muted hover:text-cyan transition-colors
                         border border-space-border hover:border-cyan/30 px-3.5 py-1.5 rounded-lg"
            >
              Load example (Stripe Sr. Engineer)
            </button>

            {step > 0 ? (
              <div className="mt-5 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-[13px] text-ink-muted font-mono">{stage}</span>
                  <span className="text-[14px] font-bold text-cyan font-mono">{Math.round(progress)}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-space-surface overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-200 ease-out"
                    style={{
                      width: `${progress}%`,
                      background: 'linear-gradient(90deg, #00D4FF, #7B2FFF, #B8FF00)',
                      boxShadow: '0 0 12px rgba(0,212,255,0.4)',
                    }}
                  />
                </div>
                <div className="flex items-center gap-1.5 pt-1">
                  {[0,1,2,3,4].map(i => (
                    <div key={i} className="w-1 h-5 rounded-full animate-pulse"
                      style={{ background: i % 2 === 0 ? '#00D4FF' : '#7B2FFF', animationDelay: `${i * 0.12}s` }} />
                  ))}
                  <span className="ml-2 text-[11px] text-ink-dim font-mono">AI analyzing…</span>
                </div>
              </div>
            ) : (
              <button
                onClick={handleAnalyze}
                disabled={!jd.trim() || analyzeMutation.isPending}
                className="btn-primary w-full mt-5 text-[15px] py-4"
              >
                ✦ Analyze &amp; Optimize Resume
              </button>
            )}
          </div>

          {/* Tips panel — unchanged */}
          <div className="space-y-4">
            <div className="glass-card p-5">
              <p className="text-[10px] font-semibold text-cyan font-mono tracking-[2px] mb-4">◎ ATS TIPS</p>
              {[
                'Include exact keywords from JD',
                'Quantify achievements (%, $, ×)',
                'Use standard section headings',
                'Avoid tables & graphics for ATS',
                'Tailor your summary for each role',
              ].map(tip => (
                <div key={tip} className="flex gap-2.5 mb-2.5 items-start">
                  <span className="text-lime text-[11px] font-bold mt-0.5 shrink-0">✓</span>
                  <span className="text-[12px] text-ink-muted leading-[1.5]">{tip}</span>
                </div>
              ))}
            </div>

            <div className="glass-card p-5">
              <p className="text-[10px] font-semibold text-violet font-mono tracking-[2px] mb-4">✦ WE ANALYZE</p>
              {[
                ['Keyword Match',  '35% weight — most critical'],
                ['Format Score',   'ATS-friendliness'],
                ['Experience Fit', 'Role & level alignment'],
                ['Skills Gap',     'Missing critical skills'],
                ['Action Words',   'Impact verb strength'],
              ].map(([title, desc]) => (
                <div key={title} className="mb-3">
                  <p className="text-[12px] font-bold text-ink-primary">{title}</p>
                  <p className="text-[10px] text-ink-dim font-mono mt-0.5">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}