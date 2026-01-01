# PromptHub - AI 提示词管理平台

一个现代化、功能完整的 AI 提示词管理平台，基于 Next.js 14 和空间中心化架构设计，支持个人使用和团队协作扩展。

## ✨ 核心特性

### 🎯 提示词管理
- **完整的 CRUD 操作**: 创建、编辑、删除、搜索提示词
- **智能标签系统**: 多标签分类，支持标签筛选和搜索
- **公开分享**: 提示词可设为公开，在广场页面展示
- **使用统计**: 自动记录使用次数和历史
- **批量操作**: 支持导入/导出提示词

### 🌍 提示词广场
- **公开浏览**: 浏览社区分享的优质提示词
- **高级搜索**: 支持关键词搜索、标签筛选
- **多维排序**: 按更新时间、使用次数、创建时间排序
- **一键复制**: 快速复制提示词内容
- **详情预览**: 模态框查看完整提示词信息

### 🔐 认证与权限
- **OAuth 登录**: 支持 Google、GitHub 第三方登录
- **Better Auth**: 基于 Better Auth 的现代认证系统
- **角色管理**: USER 和 ADMIN 角色权限分离
- **空间隔离**: 个人空间数据完全隔离
- **MCP 认证**: 专用的访问令牌机制

### 🤖 MCP 集成
- **协议支持**: 完整实现 Model Context Protocol 2025-03-26
- **工具接口**: 提供 `getPromptById` 和 `listPrompt` 工具
- **分页查询**: 支持大量提示词的分页获取
- **SSE 流式**: 基于 Server-Sent Events 的实时通信
- **安全认证**: 基于访问令牌的身份验证

### 🌐 国际化
- **多语言支持**: 中文、英文、日文完整翻译
- **动态切换**: 运行时语言切换，无需刷新
- **SEO 优化**: 多语言路由和元数据
- **本地化内容**: 标签、界面、提示信息全面本地化

### 💎 订阅系统
- **三级套餐**: FREE、PRO、TEAM 多层级订阅
- **Stripe 集成**: 安全的支付处理
- **AI 点数**: 订阅赠送和消耗管理
- **点数交易**: 完整的流水记录和余额追踪

### 👑 管理后台
- **用户管理**: 查看、编辑用户信息和权限
- **提示词审核**: 管理所有用户的提示词
- **系统日志**: 详细的操作日志和分类查询
- **数据统计**: 用户、提示词、使用量等多维度统计
- **热门排行**: 查看最受欢迎的提示词

### 🎨 用户体验
- **响应式设计**: 完美适配桌面和移动设备
- **暗色主题**: 优雅的深色界面设计
- **动态背景**: 粒子动画背景效果
- **流畅动画**: Framer Motion 驱动的交互动画
- **实时反馈**: Toast 提示和加载状态

## 🛠 技术栈

### 前端技术
- **框架**: Next.js 14 (App Router)
- **UI 库**: React 18
- **样式方案**: Tailwind CSS + CSS Variables
- **组件库**: Radix UI (无障碍组件)
- **动画**: Framer Motion
- **图表**: Recharts
- **状态管理**: Zustand
- **表格**: TanStack Table
- **国际化**: i18next + react-i18next

### 后端技术
- **语言**: TypeScript 5
- **运行时**: Node.js 18+
- **API**: Next.js API Routes
- **认证**: Better Auth 1.3.6
- **数据库**:
  - SQLite (better-sqlite3)
  - libSQL (@libsql/client)
  - PostgreSQL (pg, @neondatabase/serverless)
- **ORM**: Drizzle ORM 0.44.6
- **支付**: Stripe 14.12.0
- **实时通信**: Server-Sent Events (SSE)
- **协议**: MCP (Model Context Protocol)

### 开发工具
- **包管理**: pnpm / npm / yarn / bun
- **代码规范**: ESLint
- **类型检查**: TypeScript
- **数据库工具**: Drizzle Kit
- **测试**: Jest + Supertest
- **SEO**: next-sitemap

### 关键依赖
```json
{
  "next": "14.2.3",
  "react": "18",
  "typescript": "^5",
  "better-auth": "^1.3.6",
  "drizzle-orm": "^0.44.6",
  "@libsql/client": "^0.10.0",
  "better-sqlite3": "^12.2.0",
  "pg": "^8.16.3",
  "@neondatabase/serverless": "^1.0.2",
  "stripe": "^14.12.0",
  "i18next": "^23.11.5",
  "framer-motion": "^12.23.19",
  "zustand": "^4.4.7",
  "zod": "^3.22.4"
}
```

## 🚀 快速开始

### 1. 环境配置

```bash
# 克隆项目
git clone <your-repo>
cd prompt-manager

# 复制环境变量配置
cp .env.example .env
```

#### 依赖安装

```bash
# 方案1: 使用 pnpm (推荐)
npm install -g pnpm
pnpm install

# 方案2: 使用 Bun
npm install -g bun
bun install
bun pm trust --all

# 方案3: 使用 npm (可能遇到编译问题)
npm install

# 方案4: 使用 yarn 替代
npm install -g yarn
yarn install
```

**注意**: 如果使用 npm 遇到 better-sqlite3 安装失败，请切换到 pnpm 或 Bun。

### 2. 配置环境变量

编辑 `.env` 文件，填入必要的配置：

```env
# 数据库配置 (选择其一)
# SQLite 本地开发
DB_FILE_NAME=file:sqlite.db

# PostgreSQL 生产环境
# DATABASE_URL=postgresql://user:password@host:5432/database

# Better Auth 配置 (必需)
BETTER_AUTH_SECRET=your-better-auth-secret-key-min-32-chars
BETTER_AUTH_URL=http://localhost:3000

# OAuth 配置 (可选，至少配置一个)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret

# Stripe 配置 (可选，用于订阅功能)
STRIPE_SECRET_KEY=sk_test_your-stripe-secret-key
STRIPE_PUBLISHABLE_KEY=pk_test_your-stripe-publishable-key
STRIPE_WEBHOOK_SECRET=whsec_your-webhook-secret

# 产品价格 ID
STRIPE_PRO_PRICE_ID=price_pro_monthly
STRIPE_TEAM_PRICE_ID=price_team_monthly

# 前端 URL
FRONTEND_URL=http://localhost:3000

# 开发环境标识
NODE_ENV=development
```

**配置说明：**
- `BETTER_AUTH_SECRET`: 至少 32 字符的随机字符串，用于签名 JWT
- OAuth 配置：至少配置 Google 或 GitHub 其中一个
- Stripe 配置：如不需要订阅功能可暂时不配置
- 数据库：开发环境推荐使用 SQLite，生产环境推荐 PostgreSQL

### 3. 数据库初始化

```bash
# 生成数据库迁移文件
npx drizzle-kit generate

# 执行迁移（创建表结构）
npx drizzle-kit migrate

# 或使用 push 命令直接同步 schema（开发环境）
npx drizzle-kit push
```

**数据库选择：**
- **SQLite**: 适合本地开发和小型部署，零配置
- **PostgreSQL**: 适合生产环境，支持 Neon、Supabase 等云服务

### 4. 启动开发服务器

```bash
# 使用 pnpm (推荐)
pnpm run dev

# 或使用 Bun
bun run dev

# 或使用 npm
npm run dev

# 或使用 yarn
yarn dev
```

访问 `http://localhost:3000` 即可开始使用。

### 5. 创建管理员账户

首次登录后，需要手动将用户设置为管理员：

```bash
# 使用 Drizzle Studio 可视化编辑
npx drizzle-kit studio

# 或直接修改数据库
# 将 user 表中对应用户的 role 字段改为 "ADMIN"
```

## 🔒 安全设计

### 认证流程
1. **用户注册**: OAuth 登录后自动创建用户和个人空间
2. **会话管理**: Better Auth 处理 JWT 签名和验证
3. **中间件保护**: 所有 API 路由通过中间件验证身份
4. **角色检查**: 管理员路由额外验证 ADMIN 角色
5. **MCP 认证**: 使用专用访问令牌，独立于 Web 会话

### 权限控制
- **空间隔离**: 所有提示词属于特定空间，跨空间访问被拒绝
- **所有权验证**: 用户只能操作自己空间的资源
- **角色权限**: USER 和 ADMIN 不同的操作权限
- **公开资源**: 公开提示词可被所有人查看，但不可修改
- **MCP 令牌**: 访问令牌绑定用户，自动关联个人空间

### 数据安全
- **密码加密**: bcryptjs 加密存储（如使用邮箱登录）
- **JWT 签名**: 使用 BETTER_AUTH_SECRET 签名所有令牌
- **SQL 注入防护**: Drizzle ORM 参数化查询
- **XSS 防护**: React 自动转义，CSP 头部配置
- **CSRF 防护**: SameSite Cookie 策略

## 📈 架构设计

### 空间中心化架构
```
用户 (User)
  └── 个人空间 (Personal Space)
       ├── 提示词 (Prompts)
       ├── 使用历史 (Usage History)
       └── 访问令牌 (Access Tokens)
```

**设计优势：**
- 清晰的数据隔离边界
- 为团队协作预留扩展空间
- 支持未来多空间切换功能

### 数据库 Schema

**核心表结构：**
- `user`: 用户信息、角色、订阅状态
- `space`: 空间信息（个人/团队）
- `membership`: 用户-空间关系（为团队版准备）
- `prompt`: 提示词内容、标签、公开状态
- `prompt_usage`: 使用历史记录
- `ai_point_transaction`: AI 点数流水
- `system_logs`: 系统操作日志
- `access_tokens`: MCP 访问令牌

**索引优化：**
- 空间 ID 索引：快速查询用户提示词
- 标签索引：支持标签筛选
- 时间索引：按时间排序和分页
- 用户 ID 索引：用户数据聚合查询

### API 设计规范

**RESTful 风格：**
- `GET /api/prompts/list`: 查询提示词列表
- `POST /api/prompts/create`: 创建提示词
- `POST /api/prompts/update`: 更新提示词
- `POST /api/prompts/delete`: 删除提示词
- `GET /api/prompts/public`: 公开提示词广场

**MCP 协议：**
- `POST /api/mcp`: MCP 协议端点
- 支持 `initialize`、`tools/list`、`tools/call` 方法
- SSE 流式响应，实时返回结果

### 扩展性设计

**团队版准备：**
- 空间类型支持 `PERSONAL` 和 `TEAM`
- 成员关系表支持多用户协作
- 权限系统支持 `ADMIN` 和 `MEMBER` 角色
- 数据结构无需大改即可支持团队功能

**多数据库支持：**
- 统一的 Drizzle Schema 定义
- SQLite 和 PostgreSQL 双 Schema 文件
- 通过环境变量切换数据库类型
- 生产环境可无缝迁移到 PostgreSQL


## 🤖 MCP 集成使用

### 什么是 MCP？

Model Context Protocol (MCP) 是一个标准化协议，允许 AI 模型通过工具调用访问外部数据和服务。本项目实现了 MCP 服务器，让 AI 助手可以直接访问你的提示词库。

### 配置 MCP 客户端

1. **获取访问令牌**：
   - 登录后访问账户设置页面
   - 生成新的访问令牌
   - 保存令牌（仅显示一次）

2. **配置 Claude Desktop** (示例)：

编辑 `claude_desktop_config.json`：

```json
{
  "mcpServers": {
    "prompt-manager": {
      "command": "node",
      "args": ["/path/to/mcp-client.js"],
      "env": {
        "MCP_SERVER_URL": "http://localhost:3000/api/mcp",
        "MCP_ACCESS_TOKEN": "your-access-token-here"
      }
    }
  }
}
```

### 可用工具

**1. listPrompt** - 列出所有提示词
```json
{
  "name": "listPrompt",
  "arguments": {
    "page": 1,
    "pageSize": 30
  }
}
```

**2. getPromptById** - 获取特定提示词
```json
{
  "name": "getPromptById",
  "arguments": {
    "id": "prompt-id-here"
  }
}
```

### 使用场景

- **AI 助手集成**: 让 Claude、GPT 等直接访问你的提示词库
- **自动化工作流**: 在脚本中调用提示词
- **团队协作**: 共享提示词给团队成员的 AI 工具
- **版本管理**: 集中管理和更新提示词

## 📝 环境变量说明

| 变量名 | 说明 | 必需 | 默认值 |
|--------|------|------|--------|
| `DB_FILE_NAME` | SQLite 数据库文件路径 | SQLite 时必需 | - |
| `DATABASE_URL` | PostgreSQL 连接字符串 | PostgreSQL 时必需 | - |
| `BETTER_AUTH_SECRET` | Better Auth 签名密钥（≥32字符） | ✅ | - |
| `BETTER_AUTH_URL` | Better Auth 基础 URL | ✅ | - |
| `GOOGLE_CLIENT_ID` | Google OAuth 客户端 ID | ❌ | - |
| `GOOGLE_CLIENT_SECRET` | Google OAuth 客户端密钥 | ❌ | - |
| `GITHUB_CLIENT_ID` | GitHub OAuth 客户端 ID | ❌ | - |
| `GITHUB_CLIENT_SECRET` | GitHub OAuth 客户端密钥 | ❌ | - |
| `STRIPE_SECRET_KEY` | Stripe 私钥 | ❌ | - |
| `STRIPE_PUBLISHABLE_KEY` | Stripe 公钥 | ❌ | - |
| `STRIPE_WEBHOOK_SECRET` | Stripe Webhook 密钥 | ❌ | - |
| `STRIPE_PRO_PRICE_ID` | Pro 订阅价格 ID | ❌ | - |
| `STRIPE_TEAM_PRICE_ID` | Team 订阅价格 ID | ❌ | - |
| `FRONTEND_URL` | 前端 URL | ❌ | `http://localhost:3000` |
| `NODE_ENV` | 运行环境 | ❌ | `development` |

## 🚀 部署指南

### Vercel 部署（推荐）

1. **准备数据库**：
   - 推荐使用 [Neon](https://neon.tech) 或 [Supabase](https://supabase.com) PostgreSQL
   - 获取数据库连接字符串

2. **部署到 Vercel**：
   ```bash
   # 安装 Vercel CLI
   npm i -g vercel

   # 部署
   vercel
   ```

3. **配置环境变量**：
   - 在 Vercel Dashboard 中添加所有必需的环境变量
   - 特别注意 `BETTER_AUTH_URL` 要设置为生产域名

4. **运行数据库迁移**：
   ```bash
   # 本地连接生产数据库执行迁移
   DATABASE_URL=your-production-db-url npx drizzle-kit push
   ```

### Docker 部署

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

```bash
docker build -t prompt-manager .
docker run -p 3000:3000 --env-file .env prompt-manager
```

## 📚 项目结构

```
prompt-manager/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── [lang]/            # 多语言路由
│   │   │   ├── page.tsx       # 首页
│   │   │   ├── explore/       # 提示词广场
│   │   │   ├── dashboard/     # 用户仪表板
│   │   │   ├── admin/         # 管理后台
│   │   │   └── account/       # 账户设置
│   │   └── api/               # API 路由
│   │       ├── auth/          # 认证相关
│   │       ├── prompts/       # 提示词 CRUD
│   │       ├── admin/         # 管理接口
│   │       ├── user/          # 用户接口
│   │       └── mcp/           # MCP 协议端点
│   ├── components/            # React 组件
│   │   ├── layout/           # 布局组件
│   │   ├── landing/          # 落地页组件
│   │   └── admin/            # 管理组件
│   ├── lib/                   # 工具库
│   │   ├── auth.ts           # Better Auth 配置
│   │   ├── database.ts       # 数据库连接
│   │   ├── services.ts       # 业务逻辑
│   │   └── mcp-auth.ts       # MCP 认证
│   ├── hooks/                 # React Hooks
│   ├── i18n/                  # 国际化配置
│   ├── drizzle-schema.ts      # 数据库 Schema
│   ├── drizzle-sqlite-schema.ts
│   └── drizzle-postgres-schema.ts
├── public/
│   └── locales/              # 翻译文件
│       ├── zh-CN/
│       ├── en/
│       └── ja/
├── drizzle/                   # 数据库迁移文件
├── .env.example              # 环境变量示例
└── package.json
```

## 🔧 开发指南

### 可用脚本

```bash
# 开发服务器
npm run dev

# 生产构建
npm run build

# 启动生产服务器
npm run start

# 代码检查
npm run lint

# 运行测试
npm run test

# 测试覆盖率
npm run test:coverage

# 数据库相关
npx drizzle-kit generate    # 生成迁移
npx drizzle-kit migrate     # 执行迁移
npx drizzle-kit push        # 直接同步 schema
npx drizzle-kit studio      # 可视化数据库管理

# 生成 sitemap
npm run postbuild
```

### 添加新语言

1. 在 `public/locales/` 下创建新语言目录
2. 复制现有翻译文件并翻译
3. 在 `src/i18n/settings.ts` 中添加语言配置
4. 更新 `src/middleware.ts` 支持新语言路由

### 自定义标签

编辑翻译文件中的标签定义：

```json
// public/locales/zh-CN/common.json
{
  "tags": {
    "writing": "写作",
    "coding": "编程",
    "custom": "自定义标签"
  }
}
```

## 🐛 常见问题

### 1. better-sqlite3 安装失败

**问题**: npm install 时 better-sqlite3 编译失败

**解决方案**:
```bash
# 方案 1: 使用 pnpm
npm install -g pnpm
pnpm install

# 方案 2: 使用 bun
npm install -g bun
bun install
bun pm trust --all
```

### 2. OAuth 登录失败

**问题**: 点击 Google/GitHub 登录无响应

**检查清单**:
- ✅ 环境变量 `GOOGLE_CLIENT_ID` 和 `GOOGLE_CLIENT_SECRET` 已配置
- ✅ OAuth 应用回调 URL 设置为 `http://localhost:3000/api/auth/callback/google`
- ✅ `BETTER_AUTH_URL` 与实际访问地址一致

### 3. 数据库迁移错误

**问题**: drizzle-kit migrate 报错

**解决方案**:
```bash
# 删除旧的迁移文件
rm -rf drizzle/

# 重新生成
npx drizzle-kit generate

# 使用 push 直接同步（开发环境）
npx drizzle-kit push
```

### 4. MCP 连接失败

**问题**: AI 工具无法连接 MCP 服务器

**检查清单**:
- ✅ 访问令牌已正确生成和配置
- ✅ MCP 服务器 URL 可访问
- ✅ 令牌未过期
- ✅ 查看服务器日志排查错误

## 📚 相关文档

- [Next.js 文档](https://nextjs.org/docs)
- [Better Auth 文档](https://www.better-auth.com/docs)
- [Drizzle ORM 文档](https://orm.drizzle.team/docs/overview)
- [MCP 协议规范](https://modelcontextprotocol.io/)
- [Radix UI 文档](https://www.radix-ui.com/docs/primitives/overview/introduction)

## 🤝 贡献指南

欢迎贡献代码、报告问题或提出建议！

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

## 📄 许可证

MIT License - 详见 [LICENSE](LICENSE) 文件

## 🎉 致谢

感谢以下开源项目和社区的支持：

- [Next.js](https://nextjs.org/) - React 全栈框架
- [Better Auth](https://www.better-auth.com/) - 现代认证解决方案
- [Drizzle ORM](https://orm.drizzle.team/) - TypeScript ORM
- [Radix UI](https://www.radix-ui.com/) - 无障碍组件库
- [Tailwind CSS](https://tailwindcss.com/) - 实用优先的 CSS 框架
- [Stripe](https://stripe.com/) - 支付处理平台

---

**⭐ 如果这个项目对你有帮助，请给个 Star！**