/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          950: '#05081a',
          900: '#070b1a',
          850: '#0b1020',
          800: '#111833',
          750: '#161f42',
          700: '#1e2a55',
        },
        brand: {
          300: '#5eead4',
          400: '#2dd4bf',
          500: '#14b8a6',
          600: '#0d9488',
        },
        sky2: {
          400: '#38bdf8',
          500: '#0ea5e9',
        },
      },
      fontFamily: {
        sans: [
          'ui-sans-serif',
          'system-ui',
          '-apple-system',
          'Segoe UI',
          'Roboto',
          'Helvetica Neue',
          'Arial',
          'sans-serif',
        ],
      },
      boxShadow: {
        glow: '0 0 24px rgba(45, 212, 191, 0.35)',
        'glow-sm': '0 0 12px rgba(45, 212, 191, 0.3)',
        card: '0 10px 40px rgba(0, 0, 0, 0.45)',
      },
      keyframes: {
        pop: {
          '0%': { transform: 'scale(0.4)', opacity: '0' },
          '60%': { transform: 'scale(1.35)', opacity: '1' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        fadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        slideUp: {
          from: { opacity: '0', transform: 'translateY(28px) scale(0.97)' },
          to: { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        shimmer: {
          from: { backgroundPosition: '200% 0' },
          to: { backgroundPosition: '-200% 0' },
        },
        flamePulse: {
          '0%, 100%': { transform: 'scale(1)', opacity: '1' },
          '50%': { transform: 'scale(1.18)', opacity: '0.9' },
        },
        strike: {
          from: { backgroundSize: '0% 2px' },
          to: { backgroundSize: '100% 2px' },
        },
      },
      animation: {
        pop: 'pop 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)',
        fadeIn: 'fadeIn 0.25s ease-out',
        slideUp: 'slideUp 0.32s cubic-bezier(0.22, 1, 0.36, 1)',
        shimmer: 'shimmer 2.6s linear infinite',
        flamePulse: 'flamePulse 1.6s ease-in-out infinite',
        strike: 'strike 0.3s ease-out forwards',
      },
    },
  },
  plugins: [],
}
