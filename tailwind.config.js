/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html"
  ],
  theme: {
    extend: {
      colors: {
        dark: {
          900: '#0a0a0a',
          800: '#121212',
          700: '#1a1a1a',
          600: '#2a2a2a',
          500: '#3a3a3a'
        },
        cyan: {
          400: '#22d3ee',
          500: '#06b6d4',
          600: '#0891b2'
        },
        neon: {
          pink: '#ff00ff',
          cyan: '#00ffff',
          yellow: '#ffff00',
          green: '#00ff00'
        },
        // Foundations Design-System Farben
        foundations: {
          // Hintergrundfarben (dunkel)
          950: '#0f0f0f',
          900: '#1a1a1a',
          800: '#242424',
          700: '#2e2e2e',
          600: '#3a3a3a',
          500: '#4a4a4a',
          // Primäre Akzentfarbe: Orange
          orange: '#d97706',
          'orange-light': '#f59e0b',
          'orange-dark': '#b45309',
          // Sekundäre Akzentfarbe: Grün
          green: '#10b981',
          'green-light': '#34d399',
          'green-dark': '#059669'
        }
      },
      // Foundations Border-Radius
      borderRadius: {
        'foundations-sm': '4px',
        'foundations-md': '8px',
        'foundations-lg': '12px',
        'foundations-full': '999px'
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'monospace'],
        retro: ['VT323', 'Press Start 2P', 'monospace']
      },
      animation: {
        'pulse-cyan': 'pulseCyan 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'neon-flicker': 'neonFlicker 1.5s ease-in-out infinite alternate',
        'scanline': 'scanline 8s linear infinite',
        'float': 'float 3s ease-in-out infinite'
      },
      keyframes: {
        pulseCyan: {
          '0%, 100%': { opacity: 1 },
          '50%': { opacity: 0.5 }
        },
        glow: {
          '0%': { boxShadow: '0 0 5px currentColor, 0 0 10px currentColor' },
          '100%': { boxShadow: '0 0 10px currentColor, 0 0 20px currentColor, 0 0 30px currentColor' }
        },
        neonFlicker: {
          '0%, 19%, 21%, 23%, 25%, 54%, 56%, 100%': {
            textShadow: '0 0 4px #fff, 0 0 11px #fff, 0 0 19px #fff, 0 0 40px #0ff, 0 0 80px #0ff'
          },
          '20%, 24%, 55%': {
            textShadow: 'none'
          }
        },
        scanline: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100%)' }
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' }
        }
      },
      backdropBlur: {
        '3xl': '64px'
      },
      boxShadow: {
        'neon-pink': '0 0 5px #ff00ff, 0 0 10px #ff00ff, 0 0 20px #ff00ff',
        'neon-cyan': '0 0 5px #00ffff, 0 0 10px #00ffff, 0 0 20px #00ffff',
        'neon-yellow': '0 0 5px #ffff00, 0 0 10px #ffff00, 0 0 20px #ffff00',
        'glass': '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
        'inner-light': 'inset 0 1px 0 0 rgba(255, 255, 255, 0.1)',
        // Foundations Design-System Schatten
        'foundations-raised': '0 2px 8px rgba(0, 0, 0, 0.4), 0 4px 16px rgba(0, 0, 0, 0.2)',
        'foundations-inset': 'inset 0 2px 4px rgba(0, 0, 0, 0.4)',
        'foundations-pressed': 'inset 0 1px 3px rgba(0, 0, 0, 0.6)',
        'foundations-subtle': '0 1px 2px rgba(0, 0, 0, 0.2)'
      },
      backgroundImage: {
        'grid-pattern': 'linear-gradient(rgba(0, 255, 255, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 255, 255, 0.1) 1px, transparent 1px)',
        'scanlines': 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0, 0, 0, 0.3) 2px, rgba(0, 0, 0, 0.3) 4px)',
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))'
      },
      backgroundSize: {
        'grid': '40px 40px'
      }
    }
  },
  plugins: []
}
