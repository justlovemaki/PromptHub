import 'dotenv/config';
import { config as dotenvConfig } from 'dotenv';

// 加载 .env.local 文件（优先级高于 .env）
dotenvConfig({ path: '.env' });


const config = process.env.NEON_DATABASE_URL
  ? {
      schema: './src/drizzle-postgres-schema.ts',
      out: './drizzle-postgresql',
      dialect: 'postgresql',
      dbCredentials: {
        url: `${process.env.NEON_DATABASE_URL}`,
      },
    }
  : process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
    ? {
        schema: './src/drizzle-postgres-schema.ts',
        out: './drizzle-postgresql',
        dialect: 'postgresql',
        dbCredentials: {
          url: `${process.env.SUPABASE_URL}`,
        },
      }
    : process.env.TURSO_DATABASE_URL
      ? {
          schema: './src/drizzle-sqlite-schema.ts',
          out: './drizzle',
          dialect: 'turso',
          dbCredentials: {
            url: process.env.TURSO_DATABASE_URL,
            authToken: process.env.TURSO_AUTH_TOKEN,
          },
        }
      : {
          schema: './src/drizzle-sqlite-schema.ts',
          out: './drizzle',
          dialect: 'sqlite',
          dbCredentials: {
            url: process.env.DB_FILE_NAME || 'sqlite.db',
          },
        };

console.log('DATABASE_URL:', process.env.NEON_DATABASE_URL || process.env.SUPABASE_URL || process.env.TURSO_DATABASE_URL || process.env.DB_FILE_NAME || 'file:sqlite.db');
console.log('DIALECT:', config.dialect);
export default config;