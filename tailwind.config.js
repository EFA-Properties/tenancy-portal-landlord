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
        primaryLight: '#0d9488',
        textPrimary: '#141820',
        textSecondary: '#4a5268',
        textMuted: '#8a90a0',
        'teal': {
          '50': '#f0fdf4',
          '100': '#dcfce7',
          '200': '#bbf7d0',
          '300': '#86efac',
          '400': '#4ade80',
          '500': '#22c55e',
          '600': '#0d9488',
          '700': '#0f766e',
          '800': '#15803d',
          '900': '#166534',
        },
      },
      fontFamily: {
        'fraunces': ['Fraunces', 'serif'],
        'sans': ['DM Sans', 'sans-serif'],
        'mono': ['DM Mono', 'monospace'],
      },
      borderRadius: {
        'DEFAULT': '8px',
        'md': '6px',
        'lg': '12px',
        'card': '12px',
      },
    },
  },
  plugins: [],
}
