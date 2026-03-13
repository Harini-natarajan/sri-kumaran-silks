/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        silk: {
          terracotta: '#B8400E',
          terracottaDark: '#8c2e08',
          terracottaLight: '#d45a1a',
          cream: '#FFF8D6',
          creamLight: '#fdf7ef',
          gold: '#C6941F',
          ink: '#2a1208',
          blush: '#f5ede0',
          // Legacy aliases kept for client-side compat
          maroon: '#B8400E',
          brick: '#8c2e08',
          accent: '#fdf7ef',
        },
      },
      fontFamily: {
        display: ['"Playfair Display"', 'serif'],
        body: ['"Inter"', 'sans-serif'],
      },
      boxShadow: {
        silk: '0 12px 40px rgba(184, 64, 14, 0.16)',
      },
      keyframes: {
        floatIn: {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        floatIn: 'floatIn 420ms ease-out both',
      },
    },
  },
  plugins: [],
};
