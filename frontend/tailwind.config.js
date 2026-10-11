/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        brand: {
          50:  '#081b36',
          100: '#0c2a54',
          200: '#0e4184',
          300: '#0284c7',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
          950: '#082f49',
        },
        surface: {
          50:  '#030712',
          100: '#080e1e',
          200: '#121c32',
          300: '#1e2c4a',
          400: '#4b5e80',
          500: '#8496b3',
          600: '#cbd5e1',
          700: '#e2e8f0',
          800: '#f1f5f9',
          900: '#ffffff',
          950: '#ffffff',
        },
        success: { DEFAULT: '#10b981', light: '#064e3b', dark: '#34d399' },
        warning: { DEFAULT: '#f59e0b', light: '#78350f', dark: '#fbbf24' },
        danger:  { DEFAULT: '#f43f5e', light: '#881337', dark: '#fb7185' },
        info:    { DEFAULT: '#38bdf8', light: '#0c4a6e', dark: '#7dd3fc' },
      },
      borderRadius: {
        'xl': '0.75rem',
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
      boxShadow: {
        'xs': '0 1px 2px 0 rgba(0, 0, 0, 0.4)',
        'card': '0 4px 20px -2px rgba(0, 0, 0, 0.7), 0 0 15px -3px rgba(14, 165, 233, 0.08)',
        'card-md': '0 8px 30px -4px rgba(0, 0, 0, 0.75), 0 0 20px -2px rgba(14, 165, 233, 0.12)',
        'card-lg': '0 20px 45px -6px rgba(0, 0, 0, 0.85), 0 0 30px 0px rgba(14, 165, 233, 0.18)',
        'card-hover': '0 16px 36px -4px rgba(0, 0, 0, 0.8), 0 0 25px 2px rgba(14, 165, 233, 0.25)',
        'glow': '0 0 35px 2px rgba(14, 165, 233, 0.4)',
        'glow-sm': '0 0 20px 0px rgba(14, 165, 233, 0.3)',
      },
    },
  },
  plugins: [],
}
