/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#ecfeff',
          100: '#cffafe',
          500: '#06b6d4',
          600: '#0891b2',
          700: '#0e7490',
        },
        dark: {
          900: '#0a0a0f',
          800: '#12121a',
          700: '#161622',
          600: '#1e1e2e',
          500: '#2a2a3a',
        },
        accent: {
          cyan: '#00ffcc',
          green: '#00ff88',
        }
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'glow-cyan': '0 0 20px rgba(0, 255, 204, 0.2)',
        'glow-green': '0 0 20px rgba(0, 255, 136, 0.2)',
      },
    },
  },
  plugins: [],
}
