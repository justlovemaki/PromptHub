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
      colors: {
        brand: {
          blue: '#3F51B5',      // 蓝紫色
          navy: '#1A2C4A',      // 深海军蓝
          'navy-light': '#334155', // 深海军蓝-浅色变体
        },
      },
    },
  },
  plugins: [],
}