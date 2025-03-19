/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Brand colors
        gold: {
          DEFAULT: '#cea25d',
          light: '#deb77d',
          dark: '#ad8040',
        },
        sage: {
          DEFAULT: '#99aa88',
          light: '#b5c2a9',
          dark: '#7d8f6d',
        },
        forest: {
          DEFAULT: '#2d5954',
          light: '#3a7370',
          dark: '#1e3c38', 
        },
        cream: {
          DEFAULT: '#f9f6ef',
          light: '#ffffff',
          dark: '#eae4d4',
        },
        rust: {
          DEFAULT: '#751d0c',
          light: '#9a2811',
          dark: '#591508',
        },
        brick: {
          DEFAULT: '#dd3b00',
          light: '#f74e1e',
          dark: '#b42f00',
        },
        sky: {
          DEFAULT: '#789ba8',
          light: '#a0b8c2',
          dark: '#5b7d8a',
        },
      },
    },
  },
  plugins: [],
}

