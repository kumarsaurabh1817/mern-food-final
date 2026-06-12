/** @type {import('tailwindcss').Config} */
// NOTE: This project uses Tailwind CSS v4 via @tailwindcss/vite.
// Tailwind v4 uses CSS-first configuration (@theme in index.css).
// This file exists as a reference and for tooling/IDE support.
// Brand tokens are defined as CSS custom properties in src/index.css.

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        outfit:       ['Outfit', 'sans-serif'],
        'space-grotesk': ['Space Grotesk', 'sans-serif'],
      },
      colors: {
        orange:    '#FF5C00',
        'orange-2': '#FF8040',
        surface: {
          0: '#080808',
          1: '#111111',
          2: '#1C1C1E',
          3: '#252528',
        },
        'text-1': '#FFFFFF',
        'text-2': '#AAAAAA',
        'text-3': '#666666',
        brand: {
          green: '#22C55E',
          red:   '#EF4444',
          amber: '#F59E0B',
        },
      },
      borderRadius: {
        card: '20px',
        pill: '999px',
      },
      boxShadow: {
        'orange-glow': '0 0 32px rgba(255,92,0,0.35)',
      },
      keyframes: {
        fadeUp: {
          from: { opacity: '0', transform: 'translateY(16px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        scalePop: {
          from: { opacity: '0', transform: 'scale(0.94)' },
          to:   { opacity: '1', transform: 'scale(1)' },
        },
        shimmer: {
          from: { backgroundPosition: '-400px 0' },
          to:   { backgroundPosition: '400px 0' },
        },
        'ping-slow': {
          '0%, 100%': { transform: 'scale(1)',   opacity: '1' },
          '50%':      { transform: 'scale(1.4)', opacity: '0' },
        },
        'slide-in-bottom': {
          from: { transform: 'translateY(100%)' },
          to:   { transform: 'translateY(0)' },
        },
        'glow-pulse': {
          '0%, 100%': { boxShadow: '0 0 0 rgba(255,92,0,0)' },
          '50%':      { boxShadow: '0 0 24px rgba(255,92,0,0.5)' },
        },
      },
      animation: {
        fadeUp:          'fadeUp 0.35s ease forwards',
        scalePop:        'scalePop 0.25s ease forwards',
        shimmer:         'shimmer 1.4s infinite',
        'ping-slow':     'ping-slow 2s ease-in-out infinite',
        'slide-in-bottom': 'slide-in-bottom 0.3s ease forwards',
        'glow-pulse':    'glow-pulse 2s infinite',
      },
    },
  },
  plugins: [],
};
