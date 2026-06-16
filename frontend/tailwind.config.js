/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        orbitron: ['Orbitron', 'sans-serif'],
        quicksand: ['Quicksand', 'sans-serif'],
      },
      colors: {
        cyberBg: '#05050f',
        cyberGlow: '#00e5ff',
        cyberPurple: '#b44dff',
        cyberPink: '#ff2d95',
        cyberBorder: 'rgba(0, 229, 255, 0.15)',
        cyberCard: 'rgba(10, 10, 25, 0.6)',
      },
      boxShadow: {
        neonBlue: '0 0 10px rgba(0, 229, 255, 0.5), 0 0 20px rgba(0, 229, 255, 0.2)',
        neonPurple: '0 0 10px rgba(180, 77, 255, 0.5), 0 0 20px rgba(180, 77, 255, 0.2)',
        neonPink: '0 0 10px rgba(255, 45, 149, 0.5), 0 0 20px rgba(255, 45, 149, 0.2)',
      }
    },
  },
  plugins: [],
}
