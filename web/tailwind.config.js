/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        aura: {
          bg: '#0B0E14',
          surface: '#121722',
          card: '#1A2234',
          border: '#243048',
          cyan: '#00F2FE',
          blue: '#4FACFE',
          purple: '#7F00FF',
          magenta: '#E100FF',
          glow: 'rgba(0, 242, 254, 0.25)',
          purpleGlow: 'rgba(127, 0, 255, 0.25)',
          text: '#F8FAFC',
          muted: '#94A3B8',
          darkMuted: '#64748B',
          success: '#10B981',
          danger: '#EF4444',
          warning: '#F59E0B'
        }
      },
      animation: {
        'pulse-glow': 'pulseGlow 2.5s infinite ease-in-out',
        'orb-float': 'orbFloat 4s infinite ease-in-out',
        'spin-slow': 'spin 12s linear infinite',
      },
      keyframes: {
        pulseGlow: {
          '0%, 100%': { transform: 'scale(1)', opacity: '0.8', filter: 'drop-shadow(0 0 25px rgba(0, 242, 254, 0.45))' },
          '50%': { transform: 'scale(1.05)', opacity: '1', filter: 'drop-shadow(0 0 45px rgba(127, 0, 255, 0.65))' },
        },
        orbFloat: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        }
      }
    },
  },
  plugins: [],
}
