# 快速开始

本指南将帮助你快速启动 PromptHub 项目。

## 🚀 快速开始

### 1. 克隆项目

```bash
git clone <your-repo>
cd prompt-manager
```

### 2. 安装依赖

```bash
# 推荐使用 pnpm
pnpm install

# 或使用 bun（解决 better-sqlite3 编译问题）
bun install
bun pm trust --all

# 或使用 npm
npm install

# 或使用 yarn
yarn install
```

> **注意**: Windows 环境下如果 npm 安装 better-sqlite3 失败，请使用 pnpm 或 bun。

### 3. 配置环境变量

```bash
cp .env.example .env
```

编辑 `.env` 文件：

```env
# 数据库配置（选择其一）
# SQLite 本地开发
DB_FILE_NAME=file:sqlite.db

# Turso 云数据库
# TURSO_DATABASE_URL=libsql://your-database.turso.io
# TURSO_AUTH_TOKEN=your-token

# Neon PostgreSQL
# NEON_DATABASE_URL=postgresql://...

# Supabase PostgreSQL
# SUPABASE_URL=your-supabase-url
# SUPABASE_SERVICE_ROLE_KEY=your-key

# Better Auth 配置（必需）
BETTER_AUTH_SECRET=your-secret-key-min-32-chars
BETTER_AUTH_URL=http://localhost:3000

# OAuth 配置（至少配置一个）
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret

# 前端 URL
FRONTEND_URL=http://localhost:3000

# SEO 相关（可选）
NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION=your-google-verification
NEXT_PUBLIC_UMAMI_WEBSITE_ID=your-umami-website-id
```

### 4. 初始化数据库

```bash
# 生成迁移文件
npx drizzle-kit generate

# 执行迁移
npx drizzle-kit migrate

# 或直接同步 schema（开发环境）
npx drizzle-kit push
```

### 5. 启动开发服务器

```bash
pnpm dev
# 或
npm run dev
```

访问 `http://localhost:3000` 开始使用。

## 📦 数据库选择

项目支持多种数据库，根据你的需求选择：

| 数据库 | 适用场景 | 配置方式 |
|--------|----------|----------|
| SQLite | 本地开发，零配置 | `DB_FILE_NAME=file:sqlite.db` |
| Turso | SQLite 云服务 | `TURSO_DATABASE_URL` + `TURSO_AUTH_TOKEN` |
| PostgreSQL | 生产环境推荐 | 本地 PostgreSQL 连接字符串 |
| Neon | PostgreSQL Serverless | `NEON_DATABASE_URL` |
| Supabase | PostgreSQL 云服务 | `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` |

## 🔐 OAuth 配置

### Google OAuth

1. 访问 [Google Cloud Console](https://console.cloud.google.com/)
2. 创建新项目或选择现有项目
3. 启用 Google+ API
4. 创建 OAuth 2.0 凭据
5. 设置授权重定向 URI: `http://localhost:3000/api/auth/callback/google`
6. 复制 Client ID 和 Client Secret 到 `.env`

### GitHub OAuth

1. 访问 [GitHub Developer Settings](https://github.com/settings/developers)
2. 创建新的 OAuth App
3. 设置 Authorization callback URL: `http://localhost:3000/api/auth/callback/github`
4. 复制 Client ID 和 Client Secret 到 `.env`

## 下一步

- 了解 [核心特性](./features.md)
- 查看 [技术栈](./tech-stack.md)
- 阅读 [项目结构](./project-structure.md)