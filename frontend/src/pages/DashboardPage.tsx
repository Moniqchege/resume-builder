import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '@store/authStore'
import { scorePillClass, scoreColor } from '@lib/utils'
import ScoreRing from '@components/ats/ScoreRing'
import api from '@lib/api'
import { useUser } from '@/store/UserContext'

interface Resume {
  id:            string
  title:         string
  company:       string
  overallScore:  number
  delta:         number
  status:        string
  updatedAt:     string
}

interface Stats {
  totalResumes:  number
  avgScore:      number
  jobsApplied:   number
  optimizedToday: number
}

export default function DashboardPage() {
  const { user } = useUser()
  const navigate  = useNavigate()

  const { data: stats } = useQuery<Stats>({
    queryKey: ['stats'],
    queryFn:  () => api.get('/api/resumes/stats').then(r => r.data),
    placeholderData: { totalResumes: 12, avgScore: 84, jobsApplied: 9, optimizedToday: 2 },
  })

  const { data: resumes = [] } = useQuery<Resume[]>({
    queryKey: ['resumes'],
    queryFn:  () => api.get('/api/resumes').then(r => r.data.resumes),
    placeholderData: [
      { id: '1', title: 'Senior Frontend Engineer', company: 'Stripe',  overallScore: 91, delta: 34, status: 'OPTIMIZED', updatedAt: 'Today' },
      { id: '2', title: 'Full Stack Developer',      company: 'Vercel',  overallScore: 74, delta: 18, status: 'DRAFT',     updatedAt: 'Yesterday' },
      { id: '3', title: 'React Engineer',            company: 'Linear',  overallScore: 87, delta: 29, status: 'OPTIMIZED', updatedAt: '3 days ago' },
      { id: '4', title: 'Software Engineer II',      company: 'Notion',  overallScore: 62, delta: 11, status: 'DRAFT',     updatedAt: '5 days ago' },
    ],
  })

  const statCards = [
    { label: 'Resumes Created',  value: stats?.totalResumes ?? 0,   sub: '+3 this week',      icon: '📄', color: 'text-cyan' },
    { label: 'Avg ATS Score',    value: stats?.avgScore ?? 0,        sub: '↑ 12 pts improved', icon: '◎',  color: 'text-lime' },
    // { label: 'Jobs Applied',     value: stats?.jobsApplied ?? 0,     sub: '2 interviews!',     icon: '🎯', color: 'text-violet' },
    { label: 'Optimized Today',  value: stats?.optimizedToday ?? 0,  sub: 'Last: 12 min ago',  icon: '✦',  color: 'text-[#FF8C42]' },
  ]

  const firstName = user?.displayName?.split(' ')[0] ?? 'there'

  return (
    <div className="animate-fade-up space-y-8">
      {/* ── Header ── */}
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <p className="text-[11px] text-cyan font-mono tracking-[2px] mb-1.5">
            {new Date().toLocaleDateString('en-US',{weekday:'long',month:'short',day:'numeric',year:'numeric'}).toUpperCase()}
          </p>
          <h1 className="text-[34px] font-bold text-ink-primary leading-tight tracking-[-1px]">
            Good morning,{' '}
            <span className="text-gradient-cyan">{firstName} 👋</span>
          </h1>
        </div>
        <button onClick={() => navigate('/resume-builder')} className="btn-primary whitespace-nowrap">
          ✦ New Resume
        </button>
      </div>

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {statCards.map((s, i) => (
          <div key={i} className="glass-card p-4" style={{ animationDelay: `${i * 0.07}s` }}>
            <div className="text-2xl">{s.icon}</div>
            <div className={`text-[32px] font-bold font-mono tracking-[-1px] ${s.color}`}>
              {s.value}
            </div>
            <p className="text-xs text-ink-muted mb-2">{s.label}</p>
            <p className="text-[11px] text-[#FF8C42] font-mono">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* ── CTA Banner ── */}
      <div className="rounded-card p-7 relative overflow-hidden border border-cyan/20"
        style={{ background: 'linear-gradient(135deg, rgba(0,212,255,0.1) 0%, rgba(123,47,255,0.14) 100%)' }}>
        {/* decorative circles */}
        <div className="absolute -right-12 -top-12 w-56 h-56 rounded-full bg-cyan/[0.04] pointer-events-none" />
        <div className="flex items-center justify-between flex-wrap gap-5 relative">
          <div>
            <p className="text-[11px] text-ink-muted font-mono tracking-[2px] mb-1.5">NEW OPPORTUNITY?</p>
            <h3 className="text-[20px] font-bold text-ink-primary tracking-[-0.5px] mb-1.5">
              Drop a job description → AI handles the rest
            </h3>
            <p className="text-sm text-ink-muted">Tailored resume + ATS score in under 30 seconds</p>
          </div>
          <button onClick={() => navigate('/resume-builder')} className="btn-primary whitespace-nowrap">
            Optimize Resume →
          </button>
        </div>
      </div>

      {/* ── Resume List ── */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[18px] font-bold text-ink-primary">Recent Resumes</h2>
          <span className="text-xs text-ink-dim">{resumes.length} resumes</span>
        </div>

        <div className="space-y-2.5">
          {resumes.map((r) => (
            <button
              key={r.id}
              onClick={() => navigate(`/ats-analyzer/${r.id}`)}
              className="glass-card w-full p-5 flex items-center gap-5 text-left
                         hover:border-cyan/25 hover:bg-cyan/[0.03] transition-all duration-200
                         hover:-translate-y-0.5"
            >
              <ScoreRing score={r.overallScore} size={54} />

              <div className="flex-1 min-w-0">
                <p className="text-[14px] font-bold text-ink-primary truncate">{r.title}</p>
                <p className="text-[12px] text-ink-muted">{r.company}</p>
              </div>

              <span className="text-[12px] font-bold text-lime font-mono shrink-0">
                +{r.delta} pts
              </span>

              <span className={`${scorePillClass(r.overallScore)} shrink-0`}>
                {r.overallScore >= 85 ? 'ATS READY' : r.overallScore >= 65 ? 'REVIEW' : 'NEEDS WORK'}
              </span>

              <span className="text-ink-dim text-lg ml-1">›</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
