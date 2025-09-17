import { sqliteTable, text, integer, uniqueIndex, index } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

// ============== 认证相关表 ==============

// 用户表 - 添加角色字段
export const user = sqliteTable("user", {
	id: text("id").primaryKey().notNull(), // cuid生成
	name: text("name"),
	email: text("email").notNull(),
	emailVerified: integer("email_verified", { mode: 'boolean' }).default(false),
	image: text("image"),
	createdAt: integer("created_at", { mode: 'timestamp_ms' }).notNull().$defaultFn(() => new Date()),
	updatedAt: integer("updated_at", { mode: 'timestamp_ms' }).notNull().$defaultFn(() => new Date()),
	username: text("username"),
	displayUsername: text("display_username"),
	// 新增字段
	role: text("role", { enum: ["USER", "ADMIN"] }).notNull().default("USER"),
	// 订阅相关字段
	subscriptionStatus: text("subscription_status", { enum: ["FREE", "PRO", "TEAM"] }).notNull().default("FREE"),
	stripeCustomerId: text("stripe_customer_id"),
	subscriptionId: text("subscription_id"),
	subscriptionEndDate: integer("subscription_end_date", { mode: 'timestamp_ms' }),
}, (table) => ({
	emailUnique: uniqueIndex("user_email_unique").on(table.email),
	usernameUnique: uniqueIndex("user_username_unique").on(table.username),
}));

// 账户表（OAuth等）
export const account = sqliteTable("account", {
	id: text("id").primaryKey().notNull(),
	accountId: text("account_id").notNull(),
	providerId: text("provider_id").notNull(), // "google", "github"
	userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
	accessToken: text("access_token"),
	refreshToken: text("refresh_token"),
	idToken: text("id_token"),
	accessTokenExpiresAt: integer("access_token_expires_at"),
	refreshTokenExpiresAt: integer("refresh_token_expires_at"),
	scope: text("scope"),
	password: text("password"),
	createdAt: integer("created_at", { mode: 'timestamp_ms' }).notNull().$defaultFn(() => new Date()),
	updatedAt: integer("updated_at", { mode: 'timestamp_ms' }).notNull().$defaultFn(() => new Date()),
});

// 会话表
export const session = sqliteTable("session", {
	id: text("id").primaryKey().notNull(),
	expiresAt: integer("expires_at", { mode: 'timestamp_ms' }).notNull(),
	token: text("token").notNull(),
	createdAt: integer("created_at", { mode: 'timestamp_ms' }).notNull().$defaultFn(() => new Date()),
	updatedAt: integer("updated_at", { mode: 'timestamp_ms' }).notNull().$defaultFn(() => new Date()),
	ipAddress: text("ip_address"),
	userAgent: text("user_agent"),
	userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" } ),
});

// 验证表
export const verification = sqliteTable("verification", {
	id: text().primaryKey().notNull(),
	identifier: text().notNull(),
	value: text().notNull(),
	expiresAt: integer("expires_at").notNull(),
	createdAt: integer("created_at"),
	updatedAt: integer("updated_at"),
});

// ============== 核心业务表 ==============

// 空间类型枚举
export const spaceTypeEnum = ["PERSONAL", "TEAM"] as const;

// 空间表 - 所有资源的容器
export const space = sqliteTable("space", {
	id: text("id").primaryKey().notNull(),
	name: text("name").notNull(),
	type: text("type", { enum: spaceTypeEnum }).notNull(),
	ownerId: text("owner_id").references(() => user.id, { onDelete: 'set null' }),
	createdAt: integer("created_at", { mode: 'timestamp_ms' }).notNull().$defaultFn(() => new Date()),
	updatedAt: integer("updated_at", { mode: 'timestamp_ms' }).notNull().$defaultFn(() => new Date()),
});

// 成员关系表（为未来团队版准备）
export const membershipRoleEnum = ["ADMIN", "MEMBER"] as const;

export const membership = sqliteTable("membership", {
	id: text("id").primaryKey().notNull(),
	role: text("role", { enum: membershipRoleEnum }).notNull().default("MEMBER"),
	userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
	spaceId: text("space_id").notNull().references(() => space.id, { onDelete: "cascade" }),
	createdAt: integer("created_at", { mode: 'timestamp_ms' }).notNull().$defaultFn(() => new Date()),
}, (table) => ({
	userSpaceUnique: uniqueIndex("membership_user_space_unique").on(table.userId, table.spaceId),
}));

// 提示词表 - 核心业务对象
export const prompt = sqliteTable("prompt", {
	id: text("id").primaryKey().notNull(),
	title: text("title").notNull().default(""),
	content: text("content").notNull().default(""), // 支持变量语法
	description: text("description").default(""),
	tags: text("tags").default(""), // JSON字符串存储标签数组
	isPublic: integer("is_public", { mode: 'boolean' }).default(false),
	useCount: integer("use_count").default(0),
	spaceId: text("space_id").notNull().references(() => space.id, { onDelete: "cascade" }),
	createdBy: text("created_by").notNull().references(() => user.id, { onDelete: "cascade" }),
	createdAt: integer("created_at", { mode: 'timestamp_ms' }).notNull().$defaultFn(() => new Date()),
	updatedAt: integer("updated_at", { mode: 'timestamp_ms' }).notNull().$defaultFn(() => new Date()),
}, (table) => ({
	spaceIdIndex: index("prompt_space_id_idx").on(table.spaceId),
	createdByIndex: index("prompt_created_by_idx").on(table.createdBy),
}));

// 提示词使用历史表（为统计和分析准备）
export const promptUsage = sqliteTable("prompt_usage", {
	id: text("id").primaryKey().notNull(),
	promptId: text("prompt_id").notNull().references(() => prompt.id, { onDelete: "cascade" }),
	userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
	usedAt: integer("used_at", { mode: 'timestamp_ms' }).notNull().$defaultFn(() => new Date()),
	metadata: text("metadata"), // JSON字符串存储额外信息
}, (table) => ({
	promptIdIndex: index("prompt_usage_prompt_id_idx").on(table.promptId),
	userIdIndex: index("prompt_usage_user_id_idx").on(table.userId),
}));

// ============== 类型导出 ==============

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