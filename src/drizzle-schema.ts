/**
 * 动态 Schema 导出
 *
 * 根据环境变量配置自动选择使用 PostgreSQL 或 SQLite schema。
 * 判断逻辑与 drizzle.config.ts 保持一致：
 * 1. NEON_DATABASE_URL → PostgreSQL (Neon)
 * 2. SUPABASE_URL → PostgreSQL (Supabase)
 * 3. TURSO_DATABASE_URL → SQLite (Turso)
 * 4. 默认 → SQLite (本地文件)
 */

import * as pgSchema from './drizzle-postgres-schema';
import * as sqliteSchema from './drizzle-sqlite-schema';

// 判断是否使用 PostgreSQL（与 drizzle.config.ts 保持一致）
const usePostgres = !!(process.env.NEON_DATABASE_URL || process.env.SUPABASE_URL);

// 根据配置选择对应的 schema
const schema = usePostgres ? pgSchema : sqliteSchema;

// 导出数据库类型标识，方便其他模块判断
export const isPostgres = usePostgres;
export const isSQLite = !usePostgres;

// ============================================
// 认证系统表
// ============================================
export const user = schema.user;
export const account = schema.account;
export const session = schema.session;
export const verification = schema.verification;

// ============================================
// 核心业务表
// ============================================
export const space = schema.space;
export const membership = schema.membership;
export const prompt = schema.prompt;
export const promptUsage = schema.promptUsage;
export const promptFavorite = schema.promptFavorite;

// ============================================
// AI点数相关表
// ============================================
export const aiPointTransaction = schema.aiPointTransaction;

// ============================================
// 系统日志表
// ============================================
export const systemLogs = schema.systemLogs;

// ============================================
// 访问令牌表
// ============================================
export const accessTokens = schema.accessTokens;

// ============================================
// 枚举类型导出
// ============================================
export const spaceTypeEnum = schema.spaceTypeEnum;
export const membershipRoleEnum = schema.membershipRoleEnum;
export const logLevelEnum = schema.logLevelEnum;
export const logCategoryEnum = schema.logCategoryEnum;

// ============================================
// 类型导出
// ============================================
export type User = typeof user.$inferSelect;
export type NewUser = typeof user.$inferInsert;
export type Account = typeof account.$inferSelect;
export type NewAccount = typeof account.$inferInsert;
export type Session = typeof session.$inferSelect;
export type NewSession = typeof session.$inferInsert;
export type Space = typeof space.$inferSelect;
export type NewSpace = typeof space.$inferInsert;
export type Membership = typeof membership.$inferSelect;
export type NewMembership = typeof membership.$inferInsert;
export type Prompt = typeof prompt.$inferSelect;
export type NewPrompt = typeof prompt.$inferInsert;
export type PromptUsage = typeof promptUsage.$inferSelect;
export type NewPromptUsage = typeof promptUsage.$inferInsert;
export type SystemLogs = typeof systemLogs.$inferSelect;
export type NewSystemLogs = typeof systemLogs.$inferInsert;
export type AccessToken = typeof accessTokens.$inferSelect;
export type NewAccessToken = typeof accessTokens.$inferInsert;
export type PromptFavorite = typeof promptFavorite.$inferSelect;
export type NewPromptFavorite = typeof promptFavorite.$inferInsert;