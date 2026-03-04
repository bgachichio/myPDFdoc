/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html","./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#237352',
          hover:   '#1e6347',
          light:   '#2d9166',
          50:      '#f0f9f4',
          100:     '#d6eee3',
          200:     '#a8d8be',
          700:     '#1a5a3f',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
