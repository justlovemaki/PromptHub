# 项目结构

本文档介绍 PromptHub 项目的目录结构和文件组织。

## 📁 目录结构

```
prompt-manager/
├── src/
│   ├── app/                      # Next.js App Router
│   │   ├── [lang]/              # 多语言路由
│   │   │   ├── page.tsx         # 首页
│   │   │   ├── explore/         # 提示词广场
│   │   │   ├── dashboard/       # 用户仪表板
│   │   │   ├── admin/           # 管理后台
│   │   │   ├── account/         # 账户设置
│   │   │   └── prompt/[id]/     # 提示词详情
│   │   └── api/                 # API 路由
│   │       ├── auth/            # 认证相关
│   │       ├── prompts/         # 提示词 CRUD
│   │       ├── admin/           # 管理接口
│   │       ├── user/            # 用户接口
│   │       └── mcp/             # MCP 协议端点
│   ├── components/              # React 组件
│   │   ├── layout/             # 布局组件
│   │   ├── landing/            # 落地页组件
│   │   └── admin/              # 管理组件
│   ├── lib/                     # 工具库
│   │   ├── auth.ts             # Better Auth 配置
│   │   ├── database.ts         # 数据库连接
│   │   ├── services.ts         # 业务逻辑服务
│   │   ├── mcp-auth.ts         # MCP 认证
│   │   └── constants.ts        # 常量定义
│   ├── hooks/                   # React Hooks
│   ├── i18n/                    # 国际化配置
│   ├── drizzle-schema.ts        # 动态 Schema 导出
│   ├── drizzle-sqlite-schema.ts # SQLite Schema
│   └── drizzle-postgres-schema.ts # PostgreSQL Schema
├── packages/                    # Monorepo 包
│   ├── core-logic/             # 核心业务逻辑
│   └── ui-components/          # UI 组件库
├── public/
│   └── locales/                # 翻译文件
│       ├── zh-CN/
│       ├── en/
│       └── ja/
├── drizzle/                     # SQLite 迁移文件
├── drizzle-postgresql/          # PostgreSQL 迁移文件
├── scripts/
│   └── generate-sitemap.js      # Sitemap 生成脚本
└── docs/                        # 项目文档
```

## 📂 核心目录说明

### `src/app/`

Next.js 15 App Router 目录，包含所有页面和 API 路由。

#### 页面路由 (`src/app/[lang]/`)

| 路径 | 说明 |
|------|------|
| `page.tsx` | 首页/落地页 |
| `explore/` | 提示词广场 |
| `dashboard/` | 用户仪表板 |
| `admin/` | 管理后台 |
| `admin/users/` | 用户管理 |
| `admin/prompts/` | 提示词管理 |
| `admin/logs/` | 系统日志 |
| `account/` | 账户设置 |
| `prompt/[id]/` | 提示词详情 |
| `pricing/` | 定价页面 |
| `contact/` | 联系页面 |
| `privacy/` | 隐私政策 |
| `terms/` | 服务条款 |
| `download/` | 下载页面 |

#### API 路由 (`src/app/api/`)

| 路径 | 说明 |
|------|------|
| `auth/` | Better Auth 认证端点 |
| `prompts/` | 提示词 CRUD 接口 |
| `admin/` | 管理后台接口 |
| `user/` | 用户相关接口 |
| `mcp/` | MCP 协议端点 |
| `dashboard/` | 仪表板数据接口 |
| `health/` | 健康检查 |
| `sse/` | Server-Sent Events |

### `src/components/`

React 组件目录，按功能分类组织。

| 目录 | 说明 |
|------|------|
| `layout/` | 布局组件（导航栏、页脚等） |
| `landing/` | 落地页专用组件 |
| `admin/` | 管理后台组件 |
| 根目录 | 通用组件 |

### `src/lib/`

工具库和服务层。

| 文件 | 说明 |
|------|------|
| `auth.ts` | Better Auth 配置 |
| `auth-client.ts` | 客户端认证工具 |
| `auth-helpers.ts` | 认证辅助函数 |
| `database.ts` | 数据库连接管理 |
| `services.ts` | 业务逻辑服务类 |
| `mcp-auth.ts` | MCP 认证逻辑 |
| `constants.ts` | 常量定义 |
| `utils.ts` | 通用工具函数 |
| `db-helpers.ts` | 数据库辅助函数 |
| `sse-manager.ts` | SSE 连接管理 |
| `server-actions.ts` | Server Actions |

### `src/i18n/`

国际化配置。

| 文件 | 说明 |
|------|------|
| `index.ts` | 服务端 i18n |
| `client.ts` | 客户端 i18n |
| `settings.ts` | 语言配置 |

### `packages/`

Monorepo 包目录。

#### `packages/core-logic/`

核心业务逻辑包，可在多个应用间共享。

```
core-logic/
├── src/
│   ├── api-client.ts    # API 客户端
│   ├── types.ts         # 类型定义
│   ├── utils.ts         # 工具函数
│   └── stores/          # Zustand 状态管理
│       ├── auth-store.ts
│       └── prompt-store.ts
└── package.json
```

#### `packages/ui-components/`

UI 组件库，基于 Radix UI 和 Tailwind CSS。

```
ui-components/
├── src/
│   ├── components/
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── input.tsx
│   │   ├── modal.tsx
│   │   ├── sheet.tsx
│   │   ├── textarea.tsx
│   │   ├── loading.tsx
│   │   ├── data-table.tsx
│   │   └── search-toolbar.tsx
│   └── lib/
│       └── utils.ts
└── package.json
```

### `public/locales/`

多语言翻译文件。

```
locales/
├── zh-CN/           # 简体中文
│   ├── common.json
│   ├── home.json
│   ├── landing.json
│   ├── dashboard.json
│   ├── explore.json
│   ├── prompt.json
│   ├── admin.json
│   ├── account.json
│   └── ...
├── en/              # 英文
└── ja/              # 日文
```

### 数据库相关

| 文件/目录 | 说明 |
|-----------|------|
| `src/drizzle-schema.ts` | 动态 Schema 导出 |
| `src/drizzle-sqlite-schema.ts` | SQLite Schema 定义 |
| `src/drizzle-postgres-schema.ts` | PostgreSQL Schema 定义 |
| `drizzle/` | SQLite 迁移文件 |
| `drizzle-postgresql/` | PostgreSQL 迁移文件 |
| `drizzle.config.ts` | Drizzle 配置 |

## 🔧 配置文件

| 文件 | 说明 |
|------|------|
| `next.config.js` | Next.js 配置 |
| `tailwind.config.js` | Tailwind CSS 配置 |
| `postcss.config.js` | PostCSS 配置 |
| `tsconfig.json` | TypeScript 配置 |
| `drizzle.config.ts` | Drizzle ORM 配置 |
| `next-sitemap.config.js` | Sitemap 配置 |
| `.env.example` | 环境变量示例 |

## 下一步

- 查看 [数据库架构](./database.md)
- 阅读 [API 接口文档](./api-reference.md)
- 了解 [功能扩展](./customization/extending.md)