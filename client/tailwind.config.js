/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#0f172a', // Deep Navy
        card: '#1e293b',       // Slate 800
        primary: '#3b82f6',    // Blue 500
        secondary: '#64748b',  // Slate 500
        accent: '#22c55e',     // Green 500
        text: '#e5e7eb',       // Gray 200
        'text-muted': '#9ca3af' // Gray 400
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      }
    },
  },
  plugins: [],
}
