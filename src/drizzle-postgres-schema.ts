import { pgTable, text, integer, timestamp, pgEnum, uniqueIndex, index, boolean } from "drizzle-orm/pg-core";

// ============== 认证相关表 ==============

// 用户表 - 添加角色字段
export const user = pgTable("user", {
	id: text("id").primaryKey().notNull(), // cuid生成
	name: text("name"),
	email: text("email").notNull(),
	emailVerified: boolean("email_verified").default(false).notNull(),
	image: text("image"),
	createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
	username: text("username"),
	displayUsername: text("display_username"),
	// 新增字段
	role: text("role").default("USER"),
	// 订阅相关字段
	subscriptionStatus: text("subscription_status").default("FREE"),
	stripeCustomerId: text("stripe_customer_id"),
	subscriptionId: text("subscription_id"),
	subscriptionEndDate: timestamp("subscription_end_date", { withTimezone: true }),
	// AI点数相关字段
	subscriptionAiPoints: integer("subscription_ai_points").default(0),
}, (table) => ({
	emailUnique: uniqueIndex("user_email_unique").on(table.email),
	usernameUnique: uniqueIndex("user_username_unique").on(table.username),
}));

// 账户表（OAuth等）
export const account = pgTable("account", {
	id: text("id").primaryKey().notNull(),
	accountId: text("account_id").notNull(),
	providerId: text("provider_id").notNull(), // "google", "github"
	userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
	accessToken: text("access_token"),
	refreshToken: text("refresh_token"),
	idToken: text("id_token"),
	accessTokenExpiresAt: timestamp("access_token_expires_at", { withTimezone: true }),
	refreshTokenExpiresAt: timestamp("refresh_token_expires_at", { withTimezone: true }),
	scope: text("scope"),
	password: text("password"),
	createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// 会话表
export const session = pgTable("session", {
	id: text("id").primaryKey().notNull(),
	expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
	token: text("token").notNull(),
	createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
	ipAddress: text("ip_address"),
	userAgent: text("user_agent"),
	userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
});

// 验证表
export const verification = pgTable("verification", {
	id: text("id").primaryKey().notNull(),
	identifier: text("identifier").notNull(),
	value: text("value").notNull(),
	expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true }),
	updatedAt: timestamp("updated_at", { withTimezone: true }),
});

// ============== 核心业务表 ==============

// 空间类型枚举
export const spaceTypeEnum = pgEnum("space_type", ["PERSONAL", "TEAM"]);

// 空间表 - 所有资源的容器
export const space = pgTable("space", {
	id: text("id").primaryKey().notNull(),
	name: text("name").notNull(),
	type: spaceTypeEnum("type").notNull(),
	ownerId: text("owner_id").references(() => user.id, { onDelete: 'set null' }),
	createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// 成员关系表（为未来团队版准备）
export const membershipRoleEnum = pgEnum("membership_role", ["ADMIN", "MEMBER"]);

export const membership = pgTable("membership", {
	id: text("id").primaryKey().notNull(),
	role: membershipRoleEnum("role").notNull().default("MEMBER"),
	userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
	spaceId: text("space_id").notNull().references(() => space.id, { onDelete: "cascade" }),
	createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
	userSpaceUnique: uniqueIndex("membership_user_space_unique").on(table.userId, table.spaceId),
}));

// 提示词表 - 核心业务对象
export const prompt = pgTable("prompt", {
	id: text("id").primaryKey().notNull(),
	title: text("title").notNull().default(""),
	content: text("content").notNull().default(""), // 支持变量语法
	description: text("description").default(""),
	tags: text("tags").default("[]"), // 使用string存储标签数组
	imageUrls: text("image_urls").default("[]"), // JSON字符串存储图片链接数组
	isPublic: boolean("is_public").default(false),
	useCount: integer("use_count").default(0),
	spaceId: text("space_id").notNull().references(() => space.id, { onDelete: "cascade" }),
	createdBy: text("created_by").notNull().references(() => user.id, { onDelete: "cascade" }),
	createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
	spaceIdIndex: index("prompt_space_id_idx").on(table.spaceId),
	createdByIndex: index("prompt_created_by_idx").on(table.createdBy),
}));

// 提示词使用历史表（为统计和分析准备）
export const promptUsage = pgTable("prompt_usage", {
	id: text("id").primaryKey().notNull(),
	promptId: text("prompt_id").notNull().references(() => prompt.id, { onDelete: "cascade" }),
	userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
	usedAt: timestamp("used_at", { withTimezone: true }).notNull().defaultNow(),
	metadata: text("metadata"), // JSON字符串存储额外信息
}, (table) => ({
	promptIdIndex: index("prompt_usage_prompt_id_idx").on(table.promptId),
	userIdIndex: index("prompt_usage_user_id_idx").on(table.userId),
}));

// ============== AI点数相关表 ==============

// AI点数流水表
export const aiPointTransaction = pgTable("ai_point_transaction", {
	id: text("id").primaryKey().notNull(),
	userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
	amount: integer("amount").notNull(), // 变化点数，正数表示增加，负数表示减少
	balance: integer("balance").notNull(), // 变化后的余额
	type: text("type").notNull(), // 点数变化类型
	description: text("description"), // 描述
	relatedId: text("related_id"), // 关联ID，如提示词使用ID等
	createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
	userIdIndex: index("ai_point_transaction_user_id_idx").on(table.userId),
}));

// ============== 系统日志表 ==============

// 日志级别枚举
export const logLevelEnum = pgEnum("log_level", ["INFO", "WARN", "ERROR", "DEBUG"]);

// 日志分类枚举
export const logCategoryEnum = pgEnum("log_category", ["AUTH", "API", "USER", "SYSTEM", "SECURITY", "PERFORMANCE"]);

// 系统日志表
export const systemLogs = pgTable("system_logs", {
	id: text("id").primaryKey().notNull(),
	level: logLevelEnum("level").notNull(),
	category: logCategoryEnum("category").notNull(),
	message: text("message").notNull(),
	details: text("details"), // JSON字符串存储额外详情
	userId: text("user_id").references(() => user.id, { onDelete: "set null" }),
	userEmail: text("user_email"),
	ip: text("ip"),
	userAgent: text("user_agent"),
	timestamp: timestamp("timestamp", { withTimezone: true }).notNull().defaultNow(),
	statusCode: integer("status_code"),
}, (table) => ({
	timestampIndex: index("system_logs_timestamp_idx").on(table.timestamp),
	levelIndex: index("system_logs_level_idx").on(table.level),
	categoryIndex: index("system_logs_category_idx").on(table.category),
	userIdIndex: index("system_logs_user_id_idx").on(table.userId),
}));

// 访问令牌表（专门存储MCP等外部工具的访问令牌）
export const accessTokens = pgTable("access_tokens", {
	id: text("id").primaryKey().notNull(),
	userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
	accessToken: text("access_token").notNull(),
	refreshToken: text("refresh_token"), // 可选的刷新令牌
	accessTokenExpiresAt: timestamp("access_token_expires_at", { withTimezone: true }),
	refreshTokenExpiresAt: timestamp("refresh_token_expires_at", { withTimezone: true }),
	scope: text("scope"),
	createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
	accessTokenIndex: index("access_token_idx").on(table.accessToken),
	userIdIndex: index("access_token_user_id_idx").on(table.userId),
	createdAtIndex: index("access_token_created_at_idx").on(table.createdAt),
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
export type SystemLogs = typeof systemLogs.$inferSelect;
export type NewSystemLogs = typeof systemLogs.$inferInsert;
export type AccessToken = typeof accessTokens.$inferSelect;
export type NewAccessToken = typeof accessTokens.$inferInsert;