/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        'sora': ['Sora', 'sans-serif'],
        'redhat': ['Red Hat Display', 'sans-serif'],
      },
      colors: {
        // Brand colors from style guide
        obsidian: {
          DEFAULT: '#1a1a1a', // Olympic Park Obsidian
        },
        tan: {
          DEFAULT: '#cea25d', // Canyonlands Tan
        },
        sage: {
          DEFAULT: '#99aa88', // Spiral Jetty Sage 
        },
        green: {
          DEFAULT: '#2d5954', // Great Salt Lake Green
        },
        white: {
          DEFAULT: '#f9f6ef', // Snowbird White
        },
        mahogany: {
          DEFAULT: '#751d0c', // Moab Mahogany
        },
        blue: {
          DEFAULT: '#789ba8', // Bonneville Salt Flats Blue
        },
        rust: {
          DEFAULT: '#dd3b00', // Rocky Mountain Rust
        },
      },
      fontSize: {
        'section-header': ['36px', { lineHeight: '1.2' }],
        'sub-header': ['20px', { lineHeight: '1.2' }],
        'body': ['9pt', { lineHeight: '1.5' }],
      },
    },
  },
  plugins: [],
}

