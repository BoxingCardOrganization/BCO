
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bco: {
          primary: '#FF6B35',
          secondary: '#004225',
          accent: '#F7931E',
          neutral: '#1A1A1A',
          success: '#22C55E',
          warning: '#F59E0B',
          error: '#EF4444'
        }
      }
    },
  },
  plugins: [],
}
