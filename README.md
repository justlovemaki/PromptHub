# Podcast Template

A simple template for podcast applications with Next.js, TypeScript, Tailwind CSS, and i18n support.

## Features

- Next.js 14 with App Router
- TypeScript
- Tailwind CSS
- Multi-language support (English, Chinese, Japanese)
- Authentication with Better Auth and SQLite
- Responsive design
- SEO-friendly

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Run the development server:
   ```bash
   npm run dev
   ```

3. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Authentication

This template includes a basic authentication system using Better Auth with SQLite as the database.

To test the authentication:
1. Navigate to [http://localhost:3000/test-auth](http://localhost:3000/test-auth)
2. Click the "Sign in with test account" button
3. You should be signed in with the test account (test@example.com)

To create a new account:
1. Navigate to [http://localhost:3000/signup](http://localhost:3000/signup)
2. Fill in the registration form
3. After registration, you'll be redirected to the login page

## Project Structure

- `src/app`: Main application pages
- `src/app/[lang]`: Multi-language pages
- `src/components`: Reusable components
- `src/i18n`: Internationalization setup
- `src/lib`: Library and utility functions
- `public/locales`: Language translation files

## Customization

1. Update the translation files in `public/locales` to match your content
2. Modify the pages in `src/app` to add your own content
3. Customize the styling in `src/app/globals.css` and Tailwind configuration

## Learn More

To learn more about the technologies used in this template:

- [Next.js Documentation](https://nextjs.org/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)
- [i18next Documentation](https://www.i18next.com/)
- [Better Auth Documentation](https://www.better-auth.com/)

## Deploy

The easiest way to deploy your Next.js app is to use [Vercel](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme), the creators of Next.js.