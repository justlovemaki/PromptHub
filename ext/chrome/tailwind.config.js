/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          100: 'var(--primary-100, #3F51B5)',
          200: 'var(--primary-200, #757de8)',
          300: 'var(--primary-300, #dedeff)',
        },
        accent: {
          100: 'var(--accent-100, #2196F3)',
          200: 'var(--accent-200, #003f8f)',
        },
        text: {
          100: 'var(--text-100, #333333)',
          200: 'var(--text-200, #5c5c5c)',
        },
        bg: {
          100: 'var(--bg-100, #FFFFFF)',
          200: 'var(--bg-200, #f5f5f5)',
          300: 'var(--bg-300, #cccccc)',
        }
      }
    },
  },
  plugins: [],
}