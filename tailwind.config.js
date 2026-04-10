import colors from 'tailwindcss/colors';

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        indigo: {
          50: '#fff1f2',
          100: '#fee2e2',
          200: '#fecdd3',
          300: '#fda4af',
          400: '#fb7185',
          500: '#f43f5e',
          600: '#991b1b', // Sarthak Maroon
          700: '#7f1d1d',
          800: '#450a0a',
          900: '#2d0606', // Dark Maroon for Sidebar
        },
        blue: {
          50: '#fff1f2',
          100: '#fee2e2',
          200: '#fecdd3',
          300: '#fda4af',
          400: '#fb7185',
          500: '#f43f5e',
          600: '#991b1b',
          700: '#7f1d1d',
          800: '#450a0a',
          900: '#2d0606',
        },
      },
      boxShadow: {
        input: '0px 2px 3px -1px rgba(0, 0, 0, 0.1), 0px 1px 0px 0px rgba(25, 28, 33, 0.02), 0px 0px 0px 1px rgba(25, 28, 33, 0.08)',
      }
    },
  },
  plugins: [],
};
