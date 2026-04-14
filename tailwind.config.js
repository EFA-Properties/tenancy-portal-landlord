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
        primaryHover: '#0d9488',
        navyDark: '#1e2a3a',
        tealLight: '#f0fdfa',
        // UI colors from brand pack
        background: '#f8f9fb',
        surface: '#f0f2f5',
        border: '#e2e6ec',
        border2: '#c8cdd6',
        // Text colors
        textPrimary: '#141820',
        textSecondary: '#4a5268',
        textMuted: '#8a90a0',
        // Status colors — exact brand pack values
        success: '#15803d',
        successLight: '#f0fdf4',
        warning: '#b45309',
        warningLight: '#fffbeb',
        error: '#b91c1c',
        errorLight: '#fef2f2',
        'teal': {
          '50': '#f0fdfa',
          '100': '#ccfbf1',
          '200': '#99f6e4',
          '300': '#5eead4',
          '400': '#2dd4bf',
          '500': '#14b8a6',
          '600': '#0d9488',
          '700': '#0f766e',
          '800': '#115e59',
          '900': '#134e4a',
          '950': '#042f2e',
        },
      },
      fontFamily: {
        'fraunces': ['Fraunces', 'serif'],
        'sans': ['DM Sans', 'sans-serif'],
        'mono': ['DM Mono', 'monospace'],
      },
      fontSize: {
        'body': ['15.5px', { lineHeight: '1.6' }],
        'small': ['13.5px', { lineHeight: '1.5' }],
        'xs-brand': ['11px', { lineHeight: '1.4' }],
        'label': ['9px', { lineHeight: '1', letterSpacing: '0.1em' }],
        'tag': ['8px', { lineHeight: '1', letterSpacing: '0.12em' }],
      },
      borderRadius: {
        'DEFAULT': '6px',
        'sm': '4px',
        'md': '6px',
        'lg': '12px',
        'xl': '12px',
        '2xl': '12px',
        'card': '12px',
        'pill': '20px',
      },
      boxShadow: {
        'card': '0 1px 3px 0 rgb(0 0 0 / 0.04), 0 1px 2px -1px rgb(0 0 0 / 0.04)',
        'card-hover': '0 20px 60px rgba(0, 0, 0, 0.08)',
      },
      spacing: {
        '4.5': '18px',
        '5.5': '22px',
        '7': '28px',
      },
    },
  },
  plugins: [],
}
