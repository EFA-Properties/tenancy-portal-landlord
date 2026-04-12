/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        teal: {
          50: '#f0fdfa',
          100: '#ccfbf1',
          200: '#99f6e4',
          300: '#5eead4',
          400: '#2dd4bf',
          500: '#14b8a6',
          600: '#0d9488',
          700: '#0f766e',
          800: '#115e59',
          900: '#134e4a',
        },
        slate: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
        }
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
      backgroundColor: {
        'primary': '#0f766e',
        'primary-light': '#14b8a6',
        'primary-dark': '#0d5f58',
        'surface': '#ffffff',
        'background': '#f8fafc',
      },
      textColor: {
        'primary': '#0f172a',
        'secondary': '#64748b',
      },
      borderColor: {
        'DEFAULT': '#e2e8f0',
      },
    },
  },
  plugins: [],
}
