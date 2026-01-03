/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './packages/ui-components/src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-inter)', 'var(--font-noto-sans-sc)', 'ui-sans-serif', 'system-ui', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', '"Helvetica Neue"', 'Arial', '"Noto Sans"', 'sans-serif'],
      },
      colors: {
        brand: {
          blue: 'var(--primary-100)',      // 蓝紫色
          'blue-start': 'var(--primary-200)', // 渐变起始蓝紫色
          'blue-end': 'var(--primary-100)',   // 渐变结束蓝紫色
        },
        primary: {
          100: 'var(--primary-100)',
          200: 'var(--primary-200)',
          300: 'var(--primary-300)',
        },
        accent: {
          100: 'var(--accent-100)',
          200: 'var(--accent-200)',
        },
        orange: {
          100: 'var(--orange-100)',
          200: 'var(--orange-200)',
        },
        text: {
          100: 'var(--text-100)',
          200: 'var(--text-200)',
          300: 'var(--text-300)',
        },
        bg: {
          100: 'var(--bg-100)',
          200: 'var(--bg-200)',
          300: 'var(--bg-300)',
          400: 'var(--bg-400)',
          500: 'var(--bg-500)',
          600: 'var(--bg-600)',
          700: 'var(--bg-700)',
          800: 'var(--bg-800)',
          900: 'var(--bg-900)',
          1000: 'var(--bg-1000)',
        },
        secondary: {
          400: 'var(--secondary-400)',
          500: 'var(--secondary-500)',
        },
        error: {
          400: 'var(--error-400)',
          500: 'var(--error-500)',
        },
        success: {
          400: 'var(--success-400)',
          500: 'var(--success-500)',
        },
        warning: {
          400: 'var(--warning-400)',
          500: 'var(--warning-500)',
        },
        info: {
          400: 'var(--info-400)',
          500: 'var(--info-500)',
        },
      },
    },
  },
  plugins: [],
}