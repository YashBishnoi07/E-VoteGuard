/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Election-Civic Palette
        'ev-navy': {
          DEFAULT: '#0D1B2A',
          800: '#162032',
          700: '#1E2F47',
        },
        'ev-saffron': {
          DEFAULT: '#FF6B00',
          light: '#FF8C38',
          glow: '#FF6B0033',
        },
        'ev-green': {
          DEFAULT: '#00A86B',
          light: '#00C880',
          glow: '#00A86B33',
        },
        'ev-red': {
          DEFAULT: '#C0392B',
          light: '#E74C3C',
          glow: '#C0392B33',
        },
        'ev-gold': {
          DEFAULT: '#D4AF37',
          light: '#F0C93A',
          glow: '#D4AF3733',
        },
        'ev-surface': {
          DEFAULT: '#111827',
          card: '#1A2535',
          border: '#243044',
        },
        'ev-text': {
          primary: '#F0F4F8',
          secondary: '#94A3B8',
          muted: '#4A5568',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      backgroundImage: {
        'election-gradient': 'linear-gradient(135deg, #0D1B2A 0%, #162032 50%, #111827 100%)',
        'saffron-green': 'linear-gradient(to right, #FF6B00, #00A86B)',
      },
      animation: {
        'fraud-pulse': 'fraud-pulse 1.5s ease-out infinite',
        'saffron-shimmer': 'saffron-shimmer 2s linear infinite',
      },
      keyframes: {
        'fraud-pulse': {
          '0%': { boxShadow: '0 0 0 0 rgba(192, 57, 43, 0.7)' },
          '70%': { boxShadow: '0 0 0 12px rgba(192, 57, 43, 0)' },
          '100%': { boxShadow: '0 0 0 0 rgba(192, 57, 43, 0)' },
        },
        'saffron-shimmer': {
          '0%': { backgroundPosition: '-200% center' },
          '100%': { backgroundPosition: '200% center' },
        }
      }
    },
  },
  plugins: [],
}
