/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#0f766e',
        primaryLight: '#14b8a6',
        textPrimary: '#0f172a',
        textSecondary: '#64748b',
      },
      fontFamily: {
        'fraunces': ['Fraunces', 'serif'],
        'sans': ['DM Sans', 'sans-serif'],
        'mono': ['DM Mono', 'monospace'],
      },
      borderRadius: {
        'DEFAULT': '8px',
        'md': '8px',
        'lg': '12px',
        'card': '12px',
      },
    },
  },
  plugins: [],
}
