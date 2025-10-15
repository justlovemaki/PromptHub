import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { createClient } from '@libsql/client';
import { drizzle as sqliteDrizzle } from 'drizzle-orm/libsql';
import * as postgresSchema from '../drizzle-postgres-schema';
import * as sqliteSchema from '../drizzle-sqlite-schema';

// 导出 schema 供 Better Auth 使用
export { postgresSchema, sqliteSchema };

// 用于服务器端的数据库连接
let db: any;

if (typeof window === 'undefined') {
  // 检查环境变量以确定数据库类型
  if (process.env.NEON_DATABASE_URL) {
    // 使用 Neon PostgreSQL
    try {
      const client = postgres(`${process.env.NEON_DATABASE_URL}`, {
        prepare: false,
        // 添加连接超时配置
        connect_timeout: 10, // 10秒连接超时
        idle_timeout: 60, // 60秒空闲超时
        max_lifetime: 60 * 5, // 5分钟最大生命周期
      });
      db = drizzle(client, { schema: postgresSchema, logger: false });
    } catch (error) {
      console.error('Neon PostgreSQL连接失败，回退到SQLite:', error);
      // 连接失败时回退到 SQLite
      const client = createClient({
        url: process.env.TURSO_DATABASE_URL || process.env.DB_FILE_NAME || 'file:sqlite.db',
        authToken: process.env.TURSO_AUTH_TOKEN,
      });
      db = sqliteDrizzle(client, { schema: sqliteSchema, logger: false });
    }
  } else if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    // 使用 Supabase/PostgreSQL
    try {
      const client = postgres(`${process.env.SUPABASE_URL}`, {
        // ssl: 'require', // 确保使用 SSL 连接 Supabase
        prepare: false,
        // 添加连接超时配置
        connect_timeout: 10, // 10秒连接超时
        idle_timeout: 60, // 60秒空闲超时
        max_lifetime: 60 * 5, // 5分钟最大生命周期
      });
      db = drizzle(client, { schema: postgresSchema, logger: false });
    } catch (error) {
      console.error('PostgreSQL连接失败，回退到SQLite:', error);
      // 连接失败时回退到 SQLite
      const client = createClient({
        url: process.env.TURSO_DATABASE_URL || process.env.DB_FILE_NAME || 'file:sqlite.db',
        authToken: process.env.TURSO_AUTH_TOKEN,
      });
      db = sqliteDrizzle(client, { schema: sqliteSchema, logger: false });
    }
  } else {
    // 使用 Turso 或 SQLite
    const client = createClient({
      url: process.env.TURSO_DATABASE_URL || process.env.DB_FILE_NAME || 'file:sqlite.db',
      authToken: process.env.TURSO_AUTH_TOKEN,
    });
    db = sqliteDrizzle(client, { schema: sqliteSchema, logger: false });
  }
}

export default db; // Default export for backward compatibility
export { db }; // Named export for consistency