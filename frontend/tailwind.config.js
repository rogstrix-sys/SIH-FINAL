/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        slate: {
          850: '#162032',
          950: '#0b1120',
        },
        graphite: {
          950: '#0b0f17',
          900: '#111722',
          850: '#161f2e',
          800: '#1e293b',
          700: '#334155',
          600: '#475569',
        },
        safety: {
          400: '#fb923c',
          500: '#f97316',
          600: '#ea580c',
          700: '#c2410c',
          glow: 'rgba(249, 115, 22, 0.25)',
        },
        sanitation: {
          50: '#f0fdf4',
          100: '#dcfce7',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
        },
        hazard: {
          50: '#fef2f2',
          500: '#ef4444',
          600: '#dc2626',
        }
      }
    },
  },
  plugins: [],
}
