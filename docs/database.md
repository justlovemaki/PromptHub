# 数据库架构

本文档介绍 PromptHub 的数据库设计和表结构。

## 🗄️ 数据库支持

项目支持多种数据库，通过环境变量自动切换：

| 数据库 | 环境变量 | 适用场景 |
|--------|----------|----------|
| SQLite | `DB_FILE_NAME` | 本地开发 |
| Turso | `TURSO_DATABASE_URL` | SQLite 云服务 |
| PostgreSQL | 本地连接字符串 | 传统部署 |
| Neon | `NEON_DATABASE_URL` | Serverless |
| Supabase | `SUPABASE_URL` | 云服务 |

## 📊 核心表结构

### user - 用户表

存储用户基本信息。

```sql
CREATE TABLE user (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  name TEXT,
  role TEXT DEFAULT 'USER',      -- USER | ADMIN
  emailVerified INTEGER,
  image TEXT,
  createdAt TEXT,
  updatedAt TEXT
);
```

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | TEXT | 主键，UUID |
| `email` | TEXT | 邮箱，唯一 |
| `name` | TEXT | 用户名 |
| `role` | TEXT | 角色：USER 或 ADMIN |
| `emailVerified` | INTEGER | 邮箱是否验证 |
| `image` | TEXT | 头像 URL |
| `createdAt` | TEXT | 创建时间 |
| `updatedAt` | TEXT | 更新时间 |

### space - 空间表

用户的个人空间，用于数据隔离。

```sql
CREATE TABLE space (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT DEFAULT 'PERSONAL',  -- PERSONAL | TEAM
  ownerId TEXT NOT NULL,
  createdAt TEXT,
  updatedAt TEXT,
  FOREIGN KEY (ownerId) REFERENCES user(id)
);
```

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | TEXT | 主键，UUID |
| `name` | TEXT | 空间名称 |
| `type` | TEXT | 类型：PERSONAL 或 TEAM |
| `ownerId` | TEXT | 所有者 ID |
| `createdAt` | TEXT | 创建时间 |
| `updatedAt` | TEXT | 更新时间 |

### prompt - 提示词表

存储提示词内容。

```sql
CREATE TABLE prompt (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  description TEXT,
  tags TEXT,                     -- JSON 数组
  isPublic INTEGER DEFAULT 0,
  useCount INTEGER DEFAULT 0,
  spaceId TEXT NOT NULL,
  createdBy TEXT NOT NULL,
  createdAt TEXT,
  updatedAt TEXT,
  FOREIGN KEY (spaceId) REFERENCES space(id),
  FOREIGN KEY (createdBy) REFERENCES user(id)
);
```

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | TEXT | 主键，UUID |
| `title` | TEXT | 标题 |
| `content` | TEXT | 提示词内容 |
| `description` | TEXT | 描述 |
| `tags` | TEXT | 标签（JSON 数组） |
| `isPublic` | INTEGER | 是否公开 |
| `useCount` | INTEGER | 使用次数 |
| `spaceId` | TEXT | 所属空间 ID |
| `createdBy` | TEXT | 创建者 ID |
| `createdAt` | TEXT | 创建时间 |
| `updatedAt` | TEXT | 更新时间 |

### accessTokens - 访问令牌表

MCP 访问令牌。

```sql
CREATE TABLE accessTokens (
  id TEXT PRIMARY KEY,
  token TEXT NOT NULL UNIQUE,
  name TEXT,
  userId TEXT NOT NULL,
  expiresAt TEXT,
  createdAt TEXT,
  lastUsedAt TEXT,
  FOREIGN KEY (userId) REFERENCES user(id)
);
```

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | TEXT | 主键，UUID |
| `token` | TEXT | 令牌值（哈希） |
| `name` | TEXT | 令牌名称 |
| `userId` | TEXT | 所属用户 ID |
| `expiresAt` | TEXT | 过期时间 |
| `createdAt` | TEXT | 创建时间 |
| `lastUsedAt` | TEXT | 最后使用时间 |

### systemLogs - 系统日志表

记录系统操作日志。

```sql
CREATE TABLE systemLogs (
  id TEXT PRIMARY KEY,
  level TEXT NOT NULL,           -- INFO | WARN | ERROR
  category TEXT NOT NULL,        -- AUTH | PROMPT | ADMIN | SYSTEM
  message TEXT NOT NULL,
  details TEXT,                  -- JSON
  userId TEXT,
  ip TEXT,
  userAgent TEXT,
  timestamp TEXT NOT NULL,
  FOREIGN KEY (userId) REFERENCES user(id)
);
```

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | TEXT | 主键，UUID |
| `level` | TEXT | 日志级别 |
| `category` | TEXT | 分类 |
| `message` | TEXT | 日志消息 |
| `details` | TEXT | 详细信息（JSON） |
| `userId` | TEXT | 相关用户 ID |
| `ip` | TEXT | IP 地址 |
| `userAgent` | TEXT | 用户代理 |
| `timestamp` | TEXT | 时间戳 |

## 🔗 Better Auth 表

Better Auth 自动创建以下表：

### session - 会话表

```sql
CREATE TABLE session (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  token TEXT NOT NULL UNIQUE,
  expiresAt TEXT NOT NULL,
  ipAddress TEXT,
  userAgent TEXT,
  createdAt TEXT,
  updatedAt TEXT,
  FOREIGN KEY (userId) REFERENCES user(id)
);
```

### account - 账户表

存储 OAuth 账户关联。

```sql
CREATE TABLE account (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  accountId TEXT NOT NULL,
  providerId TEXT NOT NULL,
  accessToken TEXT,
  refreshToken TEXT,
  accessTokenExpiresAt TEXT,
  refreshTokenExpiresAt TEXT,
  scope TEXT,
  idToken TEXT,
  password TEXT,
  createdAt TEXT,
  updatedAt TEXT,
  FOREIGN KEY (userId) REFERENCES user(id)
);
```

### verification - 验证表

邮箱验证等。

```sql
CREATE TABLE verification (
  id TEXT PRIMARY KEY,
  identifier TEXT NOT NULL,
  value TEXT NOT NULL,
  expiresAt TEXT NOT NULL,
  createdAt TEXT,
  updatedAt TEXT
);
```

## 📐 ER 图

```
┌─────────────┐       ┌─────────────┐
│    user     │       │   session   │
├─────────────┤       ├─────────────┤
│ id (PK)     │◄──────│ userId (FK) │
│ email       │       │ token       │
│ name        │       │ expiresAt   │
│ role        │       └─────────────┘
│ ...         │
└──────┬──────┘
       │
       │ 1:N
       ▼
┌─────────────┐       ┌─────────────┐
│    space    │       │   account   │
├─────────────┤       ├─────────────┤
│ id (PK)     │       │ userId (FK) │
│ ownerId(FK) │       │ providerId  │
│ name        │       │ accountId   │
│ type        │       └─────────────┘
└──────┬──────┘
       │
       │ 1:N
       ▼
┌─────────────┐       ┌──────────────┐
│   prompt    │       │ accessTokens │
├─────────────┤       ├──────────────┤
│ id (PK)     │       │ userId (FK)  │
│ spaceId(FK) │       │ token        │
│ createdBy   │       │ expiresAt    │
│ title       │       └──────────────┘
│ content     │
│ tags        │       ┌─────────────┐
│ isPublic    │       │ systemLogs  │
│ useCount    │       ├─────────────┤
└─────────────┘       │ userId (FK) │
                      │ level       │
                      │ category    │
                      │ message     │
                      └─────────────┘
```

## 🔧 数据库操作

### 生成迁移

```bash
npx drizzle-kit generate
```

### 执行迁移

```bash
npx drizzle-kit migrate
```

### 同步 Schema（开发环境）

```bash
npx drizzle-kit push
```

### 可视化管理

```bash
npx drizzle-kit studio
```

## 📁 Schema 文件

项目维护两套 Schema 以支持不同数据库：

| 文件 | 说明 |
|------|------|
| [`src/drizzle-sqlite-schema.ts`](../src/drizzle-sqlite-schema.ts) | SQLite Schema |
| [`src/drizzle-postgres-schema.ts`](../src/drizzle-postgres-schema.ts) | PostgreSQL Schema |
| [`src/drizzle-schema.ts`](../src/drizzle-schema.ts) | 动态导出 |

> ⚠️ 修改表结构时，需要同时更新两个 Schema 文件。

## 下一步

- 查看 [API 接口文档](./api-reference.md)
- 阅读 [部署指南](./deployment.md)
- 了解 [功能扩展](./customization/extending.md)