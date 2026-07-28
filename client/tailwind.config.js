/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0f7ff',
          100: '#e0effe',
          200: '#bae0fd',
          300: '#7cc8fc',
          400: '#36aef8',
          500: '#0c92e7',
          600: '#0274c6',
          700: '#035ca2',
          800: '#074e85',
          900: '#0c426e',
          950: '#082a49'
        },
        accent: {
          500: '#f59e0b',
          600: '#d97706'
        }
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'sans-serif']
      }
    }
  },
  plugins: []
};
