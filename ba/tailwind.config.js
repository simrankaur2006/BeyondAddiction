/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        forest: { 50: '#eef6f2', 100: '#d5e9df', 200: '#acd2c0', 300: '#78b49b', 400: '#479478', 500: '#2d7860', 600: '#1f5f4c', 700: '#184c3d', 800: '#133d32', 900: '#0d2b23' },
        teal2: { 400: '#2bb3a6', 500: '#14968b', 600: '#0f7a72' },
        paper: '#faf7f0',
        sand: '#efe9dc',
        ink: '#1c2a26',
        clay: '#c8692f',
      },
      fontFamily: {
        display: ['Fraunces', 'Georgia', 'serif'],
        sans: ['"Instrument Sans"', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
