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
          dark: '#09090B',
          muted: '#64748B',
          border: '#E2E8F0',
          bg: '#FFFFFF'
        }
      }
    },
  },
  plugins: [],
}