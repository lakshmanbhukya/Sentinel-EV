/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'void': '#020617', // Deepest background
        'void-light': '#0f172a', // Secondary background
        'neon-cyan': '#22d3ee',
        'neon-lime': '#bef264',
        'plasma': '#ef4444',
      },
      fontFamily: {
        sans: ['Outfit', 'sans-serif'],
        mono: ['Space Grotesk', 'monospace'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow-fade': 'glowFade 2s ease-in-out infinite',
      },
      keyframes: {
        glowFade: {
          '0%, 100%': { opacity: '1', filter: 'brightness(1.2)' },
          '50%': { opacity: '0.8', filter: 'brightness(1)' },
        }
      }
    },
  },
  plugins: [],
}
