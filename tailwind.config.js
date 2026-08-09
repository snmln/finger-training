/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        basalt: {
          DEFAULT: '#16181A', // app background
          surface: '#212427', // card/panel background
          light: '#2C3033', // elevated surface / borders
        },
        chalk: '#EDEAE3', // primary text
        tape: '#4FB3A9', // primary accent
        pr: '#D8A13F', // personal records
        crimson: '#C1543F', // warnings / destructive
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'monospace'],
      },
    },
  },
  plugins: [],
}
