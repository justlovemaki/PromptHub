import { defineConfig } from 'drizzle-kit';

const config = process.env.SUPABASE_URL
  ? {
      schema: './src/drizzle-postgres-schema.ts',
      out: './drizzle',
      dialect: 'postgresql',
      dbCredentials: {
        url: `${process.env.SUPABASE_URL}`,
      },
    }
  : process.env.TURSO_DATABASE_URL
    ? {
        schema: './src/drizzle-schema.ts',
        out: './drizzle',
        dialect: 'turso',
        dbCredentials: {
          url: process.env.TURSO_DATABASE_URL,
          authToken: process.env.TURSO_AUTH_TOKEN,
        },
      }
    : {
        schema: './src/drizzle-schema.ts',
        out: './drizzle',
        dialect: 'sqlite',
        dbCredentials: {
          url: process.env.DB_FILE_NAME || 'sqlite.db',
        },
      };

export default config;