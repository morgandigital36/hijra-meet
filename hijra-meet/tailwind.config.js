/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'navy': '#0F172A', // Keeping for legacy support if needed
        'hijra-black': '#020A08', // Main Background
        'hijra-dark': '#0D251F',  // Cards / Sidebar
        'hijra-card': '#071814',  // Slightly darker card
        'emerald': {
          DEFAULT: '#10B981',
          hover: '#059669',
          light: '#34D399',
        },
        'gray': {
          300: '#CBD5E1', // Text secondary
          400: '#94A3B8',
          800: '#1e293b',
        }
      },
    },
  },
  plugins: [],
}
