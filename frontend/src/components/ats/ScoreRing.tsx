import { scoreColor } from '@lib/utils'

interface Props {
  score:     number
  size?:     number
  stroke?:   number
  animated?: boolean
  className?: string
}

export default function ScoreRing({
  score,
  size    = 56,
  stroke  = 6,
  animated = false,
  className = '',
}: Props) {
  const r = (size / 2) - stroke
  const circ = 2 * Math.PI * r
  const offset = circ - (circ * score / 100)
  const color = scoreColor(score)

  return (
    <div className={`relative shrink-0 ${className}`} style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        style={{ transform: 'rotate(-90deg)' }}
      >
        {/* Track */}
        <circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none"
          stroke="rgba(255,255,255,0.05)"
          strokeWidth={stroke}
        />
        {/* Fill */}
        <circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none"
          stroke={animated ? 'url(#scoreGrad)' : color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          style={animated ? { transition: 'stroke-dashoffset 0.05s linear' } : undefined}
        />
        {animated && (
          <defs>
            <linearGradient id="scoreGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%"   stopColor="#00D4FF" />
              <stop offset="50%"  stopColor="#7B2FFF" />
              <stop offset="100%" stopColor="#B8FF00" />
            </linearGradient>
          </defs>
        )}
      </svg>
      {/* Center label */}
      <div className="absolute inset-0 flex items-center justify-center">
        <span
          className="font-mono font-bold leading-none"
          style={{ fontSize: size * 0.23, color }}
        >
          {score}
        </span>
      </div>
    </div>
  )
}
