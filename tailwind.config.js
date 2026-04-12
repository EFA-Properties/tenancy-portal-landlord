/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Abode design system
        abode: {
          bg: '#f7f6f4',
          bg2: '#ffffff',
          bg3: '#f0eeeb',
          bg4: '#e8e5e0',
          border: '#e2deda',
          border2: '#cdc8c1',
          text: '#181613',
          text2: '#6b6560',
          text3: '#a8a099',
          teal: '#0d7377',
          'teal-light': '#f0fafa',
          'teal-mid': 'rgba(13,115,119,0.1)',
          green: '#2d7a4f',
          'green-light': '#f0faf4',
          amber: '#b45309',
          'amber-light': '#fef9f0',
          red: '#b91c1c',
          'red-light': '#fef2f2',
        }
      },
      fontFamily: {
        'instrument': ['Instrument Serif', 'serif'],
        'sans': ['DM Sans', 'sans-serif'],
        'mono': ['DM Mono', 'monospace'],
      },
      borderRadius: {
        'DEFAULT': '14px',
        'md': '14px',
        'lg': '14px',
        'card': '14px',
      },
    },
  },
  plugins: [],
}
