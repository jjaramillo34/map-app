/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#0050a4',
          600: '#0f3d91',
          700: '#0b3277',
          800: '#08265b',
          900: '#061b40',
        },
        flag: {
          red: '#ed0000',
          blue: '#0050a4',
        },
      },
    },
  },
  plugins: [],
}
