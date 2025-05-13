/** @type {import('tailwindcss').Config} */
const defaultTheme = require('tailwindcss/defaultTheme')

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
      extend: {
        fontFamily:{
          sans: ["Inter", ...defaultTheme.fontFamily.sans],
          inter: ["Inter", "sans-serif"],
          poppins: ["Poppins", "sans-serif"],
          montserrat: ["Montserrat", "sans-serif"],
          outfit: ["Outfit", "sans-serif"],
          manrope: ["Manrope", "sans-serif"]
        }
      },
    },
    plugins: [],
  }