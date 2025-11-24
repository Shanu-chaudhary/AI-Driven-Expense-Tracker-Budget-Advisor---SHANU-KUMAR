/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        inter: ["Inter", "sans-serif"],
      },
      colors: {
        orange_peel: {
          DEFAULT: '#ff9f1c',
          100: '#382100',
          200: '#704100',
          300: '#a86200',
          400: '#e08300',
          500: '#ff9f1c',
          600: '#ffb347',
          700: '#ffc675',
          800: '#ffd9a3',
          900: '#ffecd1',
        },
        hunyadi_yellow: {
          DEFAULT: '#ffbf69',
          100: '#482900',
          200: '#915200',
          300: '#d97b00',
          400: '#ffa023',
          500: '#ffbf69',
          600: '#ffcc89',
          700: '#ffd9a6',
          800: '#ffe5c4',
          900: '#fff2e1',
        },
        white: {
          DEFAULT: '#ffffff',
          100: '#333333',
          200: '#666666',
          300: '#999999',
          400: '#cccccc',
          500: '#ffffff',
        },
        mint_green: {
          DEFAULT: '#cbf3f0',
          100: '#114844',
          200: '#229088',
          300: '#3ad1c7',
          400: '#81e2db',
          500: '#cbf3f0',
        },
        light_sea_green: {
          DEFAULT: '#2ec4b6',
          100: '#092724',
          200: '#124e48',
          300: '#1b746c',
          400: '#249b8f',
          500: '#2ec4b6',
        },
      },
    },
  },
  plugins: [],
}
