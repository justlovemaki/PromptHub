/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          blue: 'var(--brand-blue, #3b82f6)',
          'blue-dark': 'var(--brand-blue-dark, #2563eb)',
        }
      }
    },
  },
  plugins: [],
}