import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './src/drizzle-schema.ts',
  out: './drizzle',
  dialect: 'sqlite',
  dbCredentials: {
    url: process.env.DB_FILE_NAME || 'sqlite.db',
  },
});