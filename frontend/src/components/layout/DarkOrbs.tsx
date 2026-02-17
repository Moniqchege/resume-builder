export default function DarkOrbs() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      {/* Cyan orb — top-left */}
      <div className="absolute -top-48 -left-24 w-[600px] h-[600px] rounded-full animate-orb-float1"
        style={{ background: 'radial-gradient(circle, rgba(0,212,255,0.07) 0%, transparent 70%)' }}
      />
      {/* Violet orb — bottom-right */}
      <div className="absolute -bottom-36 -right-20 w-[500px] h-[500px] rounded-full animate-orb-float2"
        style={{ background: 'radial-gradient(circle, rgba(123,47,255,0.1) 0%, transparent 70%)' }}
      />
      {/* Lime orb — mid-right */}
      <div className="absolute top-[40%] right-[20%] w-[280px] h-[280px] rounded-full"
        style={{ background: 'radial-gradient(circle, rgba(184,255,0,0.05) 0%, transparent 70%)' }}
      />
    </div>
  )
}
