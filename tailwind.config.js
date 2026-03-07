/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html"
  ],
  theme: {
    extend: {
      colors: {
        'dark': {
          '900': '#0a0a0a',
          '800': '#111111',
          '700': '#1a1a1a',
          '600': '#222222',
          '500': '#2a2a2a'
        },
        'cyan': {
          '400': '#22d3ee',
          '500': '#06b6d4',
          '600': '#0891b2'
        }
      },
      fontFamily: {
        'mono': ['JetBrains Mono', 'Fira Code', 'monospace']
      }
    },
  },
  plugins: [],
}
