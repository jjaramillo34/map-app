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
          50: '#f0f4ff',
          100: '#e0e9ff',
          200: '#c7d7fe',
          300: '#a5b8fc',
          400: '#8b94f8',
          500: '#667eea',
          600: '#764ba2',
          700: '#5a3d7a',
          800: '#4a2f5f',
          900: '#3d2549',
        },
      },
    },
  },
  plugins: [],
}

