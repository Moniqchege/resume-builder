// ─── Floating Orb Background ─────────────────────────────────────────────────
export default function OrbBackground() {
  return (
    <div style={{ position: "fixed", inset: 0, overflow: "hidden", pointerEvents: "none", zIndex: 0 }}>
      <div style={{
        position: "absolute", width: 600, height: 600, borderRadius: "50%",
        background: "radial-gradient(circle, rgba(0,212,255,0.08) 0%, transparent 70%)",
        top: -200, left: -100, animation: "orbFloat1 12s ease-in-out infinite"
      }} />
      <div style={{
        position: "absolute", width: 500, height: 500, borderRadius: "50%",
        background: "radial-gradient(circle, rgba(123,47,255,0.1) 0%, transparent 70%)",
        bottom: -150, right: -80, animation: "orbFloat2 15s ease-in-out infinite"
      }} />
      <div style={{
        position: "absolute", width: 300, height: 300, borderRadius: "50%",
        background: "radial-gradient(circle, rgba(184,255,0,0.06) 0%, transparent 70%)",
        top: "40%", right: "20%", animation: "orbFloat3 10s ease-in-out infinite"
      }} />
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=JetBrains+Mono:wght@300;400;500&display=swap');
        @keyframes orbFloat1 { 0%,100%{transform:translate(0,0)} 50%{transform:translate(40px,60px)} }
        @keyframes orbFloat2 { 0%,100%{transform:translate(0,0)} 50%{transform:translate(-50px,-40px)} }
        @keyframes orbFloat3 { 0%,100%{transform:translate(0,0)} 50%{transform:translate(30px,-50px)} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(30px)} to{opacity:1;transform:translateY(0)} }
        @keyframes scanLine { 0%{transform:translateY(-100%)} 100%{transform:translateY(400%)} }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        @keyframes shimmer { 0%{background-position:-200% center} 100%{background-position:200% center} }
        @keyframes scoreGrow { from{stroke-dashoffset:283} to{stroke-dashoffset:var(--target)} }
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #0A0E1A; font-family: 'Syne', sans-serif; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: #0A0E1A; }
        ::-webkit-scrollbar-thumb { background: #1E2A45; border-radius: 2px; }
      `}</style>
    </div>
  );
}