/** @type {import('tailwindcss').Config} */
export default {
    content: [
      "./index.html",
      "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
      extend: {
        fontFamily: {
          'cairo': ['Cairo', 'sans-serif'],
          'poppins': ['Poppins', 'sans-serif'],
        },
        colors: {
          egypt: {
            red: '#E41E2B',
            gold: '#C09E77',
            black: '#000000',
            white: '#FFFFFF',
          },
        },
        boxShadow: {
          'soft': '0 2px 15px -3px rgba(0, 0, 0, 0.07), 0 10px 20px -2px rgba(0, 0, 0, 0.04)',
          'hover': '0 10px 40px -3px rgba(0, 0, 0, 0.1), 0 10px 20px -2px rgba(0, 0, 0, 0.04)',
        },
        animation: {
          'spin-slow': 'spin 3s linear infinite',
          'bounce-slow': 'bounce 2s infinite',
        },
      },
    },
    plugins: [],
  }