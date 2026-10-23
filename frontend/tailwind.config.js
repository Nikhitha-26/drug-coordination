/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        forest: '#174d3b',
        mint: '#e6f4ec',
        canvas: '#f5f8f6',
        ink: '#1f2e28',
        muted: '#718078'
      },
      boxShadow: { soft: '0 8px 30px rgba(28, 66, 48, .06)' }
    }
  },
  plugins: []
}
