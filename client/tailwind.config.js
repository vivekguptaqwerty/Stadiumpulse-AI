/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          dark: '#020617',
          card: '#0f172a',
          accent: '#10b981',
          warning: '#f59e0b',
          orange: '#f97316',
          danger: '#ef4444',
          primary: '#3b82f6',
        }
      }
    },
  },
  plugins: [],
}
