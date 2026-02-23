import { useState, useEffect } from 'react'
import { useParams, useLocation } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import ScoreRing from '@components/ats/ScoreRing'
import { scoreColor } from '@lib/utils'
import api from '@lib/api'

interface ATSData {
  resumeId:      number
  analysisId:    number
  overallScore:  number
  previousScore: number
  jobTitle:      string
  company:       string
  categories: {
    label: string
    score: number
    note:  string
    color: string
  }[]
  keywordsFound:   string[]
  keywordsMissing: string[]
  suggestions: {
    icon:  string
    color: string
    title: string
    body:  string
  }[]
}

const PLACEHOLDER: ATSData = {
  resumeId: 0,
  analysisId: 0,
  overallScore: 0,
  previousScore: 0,
  jobTitle: 'Loading…',
  company: '',
  categories: [],
  keywordsFound: [],
  keywordsMissing: [],
  suggestions: [],
}

export default function ATSPage() {
  const { analysisId } = useParams<{ analysisId: string }>()
  const location = useLocation()
  const initialState = (location.state as { ats?: ATSData })?.ats

  const [animScore, setAnimScore] = useState(initialState?.overallScore || 0)
  const [barsReady, setBarsReady] = useState(false)

 const { data: ats = PLACEHOLDER, refetch, isFetching } = useQuery<ATSData>({
  queryKey: ['ats', analysisId],
  queryFn: () => api.get(`/api/ats/analyses/${analysisId}`).then(r => r.data),
  enabled: !!analysisId,
  placeholderData: PLACEHOLDER,
});

useEffect(() => {
  setAnimScore(0);
  setBarsReady(false);
  setCategoryWidths(ats.categories.map(() => 0));
}, [analysisId]);
  useEffect(() => {
    let cur = 0
    const target = ats.overallScore
    const iv = setInterval(() => {
      cur += Math.max(target / 40, 1) 
      setAnimScore(Math.min(cur, target))
      if (cur >= target) clearInterval(iv)
    }, 18)
    setTimeout(() => setBarsReady(true), 400)
    return () => clearInterval(iv)
  }, [ats.overallScore])

  const [categoryWidths, setCategoryWidths] = useState<number[]>(() =>
  ats.categories.map(() => 0)
)

useEffect(() => {
  setCategoryWidths(ats.categories.map(() => 0))
  const ivs: NodeJS.Timeout[] = []

  ats.categories.forEach((cat, i) => {
    ivs[i] = setInterval(() => {
      setCategoryWidths((prev) => {
        const next = [...prev]
        next[i] = Math.min((prev[i] ?? 0) + Math.max(cat.score / 40, 1), cat.score)
        return next
      })
    }, 18)
  })

  return () => ivs.forEach(clearInterval)
}, [ats.categories])

  const handleDownloadPDF = async () => {
  try {
    const response = await api.get(`/api/resumes/${ats.resumeId}`);
    const resume = response.data;

    if (!resume.optimizedFileUrl) {
      alert('Optimized PDF not available yet.');
      return;
    }
    window.open(resume.optimizedFileUrl, '_blank');

  } catch (err) {
    console.error('Failed to open PDF:', err);
    alert('Failed to open PDF.');
  }
};

  const circumference = 2 * Math.PI * 72
  const dashOffset = circumference - (circumference * animScore) / 100
  const delta = ats.overallScore - ats.previousScore

  return (
    <div className="animate-fade-up space-y-6">
      {/* ── Header ── */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <p className="text-[11px] text-lime font-mono tracking-[2px] mb-1.5">ANALYSIS COMPLETE</p>
          <h1 className="text-[32px] font-bold text-ink-primary tracking-[-1px] mb-1.5">ATS Score Report</h1>
          <p className="text-ink-muted text-sm">{ats.jobTitle} · {ats.company} · Analyzed just now</p>
        </div>
        <div className="flex gap-2.5">
          {/* <button className="btn-ghost text-sm px-4 py-2.5" onClick={() => refetch()} disabled={isFetching}>{isFetching ? "Re-analyzing..." : "↻ Re-analyze"}</button> */}
          {/* <button className="btn-lime text-sm" onClick={handleDownloadPDF}>↓ Export PDF</button> */}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[270px_1fr] gap-5">
        {/* ── Score Donut Card ── */}
        <div className="glass-card p-8 flex flex-col items-center text-center">
          <div className="relative w-[180px] h-[180px] mb-5">
            <svg width="180" height="180" viewBox="0 0 180 180" style={{ transform: 'rotate(-90deg)' }}>
              <circle cx="90" cy="90" r="72" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="14" />
              <circle
                cx="90"
                cy="90"
                r="72"
                fill="none"
                stroke="url(#bigGrad)"
                strokeWidth="14"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={dashOffset}
                style={{ transition: 'stroke-dashoffset 0.03s linear' }}
              />
              <defs>
                <linearGradient id="bigGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#00D4FF" />
                  <stop offset="50%" stopColor="#7B2FFF" />
                  <stop offset="100%" stopColor="#B8FF00" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-[52px] font-bold font-mono leading-none text-gradient-cyan">
                {Math.round(animScore)}
              </span>
              <span className="text-sm text-ink-dim">/ 100</span>
            </div>
          </div>

          {/* Status badge */}
          <div className="px-5 py-2 rounded-full bg-lime/10 border border-lime/20 text-lime text-[12px] font-bold font-mono mb-4 animate-scale-in">
            ✓ HIGH MATCH
          </div>

          {/* Before / After */}
          <div className="w-full p-4 rounded-xl bg-space-surface/60 border border-dashed border-cyan/15">
            <p className="text-[10px] text-ink-dim font-mono tracking-[1px] mb-3">BEFORE → AFTER</p>
            <div className="flex items-center justify-center gap-4">
              <div className="text-center">
                <div className="text-[30px] font-bold text-status-danger font-mono">{ats.previousScore}</div>
                <div className="text-[11px] text-ink-dim">Original</div>
              </div>
              <span className="text-[20px] font-bold text-gradient-cyan">→</span>
              <div className="text-center">
                <div className="text-[30px] font-bold text-lime font-mono">{ats.overallScore}</div>
                <div className="text-[11px] text-ink-dim">Optimized</div>
              </div>
            </div>
            <p className="text-[13px] font-bold text-cyan font-mono mt-2.5">+{delta} points 🚀</p>
          </div>
        </div>

        {/* ── Right Column ── */}
        <div className="flex flex-col gap-4">
          {/* Category Bars */}
<div className="glass-card p-6">
  <h3 className="text-[14px] font-bold text-ink-primary mb-5">Category Breakdown</h3>

  <div className="space-y-4">
   {ats.categories.map((cat, i) => (
  <div key={cat.label}>
    <div className="flex justify-between mb-1.5">
      <div>
        <span className="text-[13px] font-bold text-ink-primary">{cat.label}</span>
        <span className="text-[11px] text-ink-dim font-mono ml-2">{cat.note}</span>
      </div>
      <span className="text-[13px] font-bold font-mono" style={{ color: cat.color }}>
        {Math.round(categoryWidths[i] ?? 0)}%
      </span>
    </div>
    <div className="h-2 rounded-full bg-space-surface/60 overflow-hidden">
      <div
        className="h-full rounded-full transition-all duration-1000"
        style={{
          width: `${categoryWidths[i] ?? 0}%`,
          background: `linear-gradient(90deg, ${cat.color}99, ${cat.color})`,
          boxShadow: `0 0 10px ${cat.color}44`,
          transitionDelay: `${i * 0.1}s`,
        }}
      />
    </div>
  </div>
))}
 </div>
 </div>

          {/* Keywords — Found & Missing */}
          <div className="grid grid-cols-2 gap-4">
            <div className="glass-card p-5 border-lime/15">
              <p className="text-[10px] font-bold text-lime font-mono tracking-[2px] mb-3">
                ✓ FOUND ({ats.keywordsFound.length})
              </p>
              <div className="flex flex-wrap gap-1.5">
                {ats.keywordsFound.map(k => (
                  <span key={k} className="kw-found">{k}</span>
                ))}
              </div>
            </div>
            <div className="glass-card p-5 border-status-danger/15">
              <p className="text-[10px] font-bold text-status-danger font-mono tracking-[2px] mb-3">
                ✗ MISSING ({ats.keywordsMissing.length})
              </p>
              <div className="space-y-2">
                {ats.keywordsMissing.map(k => (
                  <div key={k} className="flex items-center gap-2">
                    <span className="kw-missing">{k}</span>
                    <span className="text-[10px] text-ink-dim font-mono">→ add</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Action Row ── */}
      <div className="flex flex-col sm:flex-row gap-3">
        <button className="btn-lime flex-1 text-center" onClick={handleDownloadPDF}>↓ Export Optimized PDF</button>
      </div>
    </div>
  )
}
