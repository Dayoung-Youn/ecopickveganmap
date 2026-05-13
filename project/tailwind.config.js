/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        olive: {
          50: '#f6f7f0',
          100: '#e8ebd8',
          200: '#d2d7b3',
          300: '#b5be85',
          400: '#9da66a',
          500: '#7c8c5a',
          600: '#616e45',
          700: '#4d5738',
          800: '#414730',
          900: '#383d2b',
        },
        cream: {
          50: '#fdfdf8',
          100: '#f7f5ee',
          200: '#eee9db',
          300: '#e0d8c4',
          400: '#d1c5a5',
        },
        charcoal: {
          50: '#f5f5f4',
          100: '#e7e5e4',
          200: '#d1d0cf',
          300: '#b0afad',
          400: '#8c8a87',
          500: '#6d6b68',
          600: '#575553',
          700: '#474543',
          800: '#3a3836',
          900: '#2c2a28',
        },
      },
      animation: {
        'slide-in': 'slideIn 0.3s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
      },
      keyframes: {
        slideIn: {
          '0%': { transform: 'translateX(-100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(100%)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
};
