/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Dark Futuristic Palette
        space: {
          bg:      '#0A0E1A',
          surface: '#0F1629',
          card:    '#151D35',
          card2:   '#1A2340',
          border:  '#1E2A45',
        },
        cyan:   { DEFAULT: '#00D4FF', glow: 'rgba(0,212,255,0.25)' },
        violet: { DEFAULT: '#7B2FFF', glow: 'rgba(123,47,255,0.25)' },
        lime:   { DEFAULT: '#B8FF00', glow: 'rgba(184,255,0,0.25)'  },
        // Semantic
        brand: {
          primary:   '#00D4FF',
          secondary: '#7B2FFF',
          accent:    '#B8FF00',
        },
        ink: {
          primary: '#E8EDF5',
          muted:   '#8A94A6',
          dim:     '#4A5568',
        },
        status: {
          success: '#B8FF00',
          warning: '#FF8C42',
          danger:  '#FF4D6D',
          info:    '#00D4FF',
        },
      },
      fontFamily: {
        sans:  ['Syne', 'system-ui', 'sans-serif'],
        mono:  ['JetBrains Mono', 'Menlo', 'monospace'],
        // Login page
        warm:  ['Plus Jakarta Sans', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'grad-cyan':    'linear-gradient(135deg, #00D4FF 0%, #7B2FFF 100%)',
        'grad-lime':    'linear-gradient(135deg, #B8FF00 0%, #00D4FF 100%)',
        'grad-violet':  'linear-gradient(135deg, #7B2FFF 0%, #00D4FF 100%)',
        'grad-rainbow': 'linear-gradient(135deg, #FF4D6D 0%, #FF8C42 30%, #FFD166 60%, #06D6A0 100%)',
        'grid-dark':    `
          linear-gradient(rgba(0,212,255,0.03) 1px, transparent 1px),
          linear-gradient(90deg, rgba(0,212,255,0.03) 1px, transparent 1px)
        `,
      },
      backgroundSize: {
        'grid': '60px 60px',
      },
      boxShadow: {
        'card':    '0 8px 40px rgba(0,0,0,0.4), 0 2px 8px rgba(0,0,0,0.2)',
        'cyan':    '0 8px 24px rgba(0,212,255,0.3)',
        'lime':    '0 8px 24px rgba(184,255,0,0.3)',
        'violet':  '0 8px 24px rgba(123,47,255,0.3)',
        'glow-sm': '0 0 12px rgba(0,212,255,0.4)',
      },
      animation: {
        'fade-up':    'fadeUp 0.5s ease both',
        'scale-in':   'scaleIn 0.4s cubic-bezier(0.34,1.56,0.64,1) both',
        'pulse-dot':  'pulseDot 1.8s ease-in-out infinite',
        'orb-float1': 'orbFloat1 12s ease-in-out infinite',
        'orb-float2': 'orbFloat2 15s ease-in-out infinite',
        'bar-grow':   'barGrow 1s cubic-bezier(0.34,1.1,0.64,1) both',
        'shimmer':    'shimmer 1.5s linear infinite',
      },
      keyframes: {
        fadeUp:     { from: { opacity: '0', transform: 'translateY(24px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        scaleIn:    { from: { opacity: '0', transform: 'scale(0.93)' }, to: { opacity: '1', transform: 'scale(1)' } },
        pulseDot:   { '0%,100%': { opacity: '1', transform: 'scale(1)' }, '50%': { opacity: '0.5', transform: 'scale(0.9)' } },
        orbFloat1:  { '0%,100%': { transform: 'translate(0,0)' }, '50%': { transform: 'translate(40px,60px)' } },
        orbFloat2:  { '0%,100%': { transform: 'translate(0,0)' }, '50%': { transform: 'translate(-50px,-40px)' } },
        barGrow:    { from: { width: '0%' }, to: { width: 'var(--bar-width)' } },
        shimmer: {
          '0%':   { backgroundPosition: '-400px 0' },
          '100%': { backgroundPosition: '400px 0' },
        },
      },
      borderRadius: {
        'card': '1.25rem',
      },
    },
  },
  plugins: [],
}
