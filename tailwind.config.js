/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'brand-black': '#000000',
        'brand-blue': '#4A90E2',
        'brand-green': '#3DFF8C',
        'brand-white': '#FDFDFD',
        'brand-gray': {
          DEFAULT: '#888888',
          light: '#B3B3B3',
          medium: '#4A5565',
          dark: '#2A2A2E',
          'darker': '#1A1A1E',
          'darkest': '#000000',
        },
        'brand-yellow': '#FDC700',
        'brand-orange': '#E17100',
      },
      fontFamily: {
        inter: ['"Inter"', 'sans-serif'],
        'inter-display': ['"Inter Display"', 'sans-serif'],
      },
      backgroundImage: {
        'grid-pattern': 'linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)',
      },
      backgroundSize: {
        'grid-size': '40px 40px',
      },
      boxShadow: {
        'green-glow': '0 0 20px 5px rgba(61, 255, 140, 0.2)',
        'blue-glow': '0 0 20px 5px rgba(74, 144, 226, 0.2)',
      }
    },
  },
  plugins: [],
}
