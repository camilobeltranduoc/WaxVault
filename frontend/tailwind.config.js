/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        vinyl: {
          black: '#1a1a1a',
          groove: '#2d2d2d',
          label: '#c9a84c',
          cream: '#f5f0e8',
          red: '#c0392b',
        },
      },
      fontFamily: {
        sans:    ['Inter', 'system-ui', 'sans-serif'],
        display: ['Bebas Neue', 'Impact', 'sans-serif'],
        mono:    ['Space Mono', 'Courier New', 'monospace'],
      },
      boxShadow: {
        vinyl: '0 4px 20px rgba(0, 0, 0, 0.3)',
        'vinyl-glow': '0 0 20px rgba(201, 168, 76, 0.35)',
      },
      animation: {
        'spin-slow': 'spin 3s linear infinite',
        'vinyl-spin': 'spin 8s linear infinite',
        'fade-in-up': 'fadeInUp 0.6s ease-out forwards',
        'fade-in': 'fadeIn 0.4s ease-out forwards',
      },
      keyframes: {
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(28px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}
