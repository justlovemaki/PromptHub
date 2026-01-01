# 部署指南

本文档介绍如何将 PromptHub 部署到生产环境。

## 🚀 Vercel 部署

Vercel 是推荐的部署平台，与 Next.js 完美集成。

### 1. 准备工作

- GitHub/GitLab/Bitbucket 账号
- Vercel 账号
- 生产数据库（推荐 Neon 或 Supabase）

### 2. 连接仓库

1. 登录 [Vercel](https://vercel.com)
2. 点击 **New Project**
3. 导入你的 Git 仓库
4. 选择 **Next.js** 框架预设

### 3. 配置环境变量

在 Vercel 项目设置中添加以下环境变量：

```env
# 数据库（选择其一）
NEON_DATABASE_URL=postgresql://...
# 或
SUPABASE_URL=your-supabase-url
SUPABASE_SERVICE_ROLE_KEY=your-key

# Better Auth（必需）
BETTER_AUTH_SECRET=your-secret-key-min-32-chars
BETTER_AUTH_URL=https://your-domain.vercel.app

# OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret

# 前端 URL
FRONTEND_URL=https://your-domain.vercel.app

# SEO（可选）
NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION=your-verification
NEXT_PUBLIC_UMAMI_WEBSITE_ID=your-umami-id
```

### 4. 部署

点击 **Deploy** 开始部署。Vercel 会自动：

1. 安装依赖
2. 构建项目
3. 部署到边缘网络

### 5. 配置自定义域名

1. 在项目设置中点击 **Domains**
2. 添加你的域名
3. 配置 DNS 记录

## 🐳 Docker 部署

### Dockerfile

```dockerfile
FROM node:18-alpine AS base

# 安装依赖
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json pnpm-lock.yaml ./
RUN corepack enable pnpm && pnpm install --frozen-lockfile

# 构建
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED 1

RUN corepack enable pnpm && pnpm build

# 生产镜像
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]
```

### docker-compose.yml

```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DB_FILE_NAME=file:/data/sqlite.db
      - BETTER_AUTH_SECRET=${BETTER_AUTH_SECRET}
      - BETTER_AUTH_URL=${BETTER_AUTH_URL}
      - GOOGLE_CLIENT_ID=${GOOGLE_CLIENT_ID}
      - GOOGLE_CLIENT_SECRET=${GOOGLE_CLIENT_SECRET}
      - GITHUB_CLIENT_ID=${GITHUB_CLIENT_ID}
      - GITHUB_CLIENT_SECRET=${GITHUB_CLIENT_SECRET}
      - FRONTEND_URL=${FRONTEND_URL}
    volumes:
      - ./data:/data
    restart: unless-stopped

  # 可选：使用 PostgreSQL
  # postgres:
  #   image: postgres:15-alpine
  #   environment:
  #     POSTGRES_USER: prompthub
  #     POSTGRES_PASSWORD: your-password
  #     POSTGRES_DB: prompthub
  #   volumes:
  #     - postgres_data:/var/lib/postgresql/data
  #   restart: unless-stopped

# volumes:
#   postgres_data:
```

### 构建和运行

```bash
# 构建镜像
docker build -t prompt-manager .

# 运行容器
docker run -p 3000:3000 --env-file .env prompt-manager

# 或使用 docker-compose
docker-compose up -d
```

## ☁️ 云平台部署

### Railway

1. 连接 GitHub 仓库
2. 添加环境变量
3. Railway 自动检测 Next.js 并部署

### Render

1. 创建 Web Service
2. 连接仓库
3. 设置构建命令：`pnpm build`
4. 设置启动命令：`pnpm start`
5. 添加环境变量

### Fly.io

```bash
# 安装 flyctl
curl -L https://fly.io/install.sh | sh

# 登录
fly auth login

# 初始化
fly launch

# 设置环境变量
fly secrets set BETTER_AUTH_SECRET=your-secret
fly secrets set BETTER_AUTH_URL=https://your-app.fly.dev
# ... 其他变量

# 部署
fly deploy
```

## 🗄️ 数据库配置

### Neon (推荐)

1. 创建 [Neon](https://neon.tech) 账号
2. 创建新项目
3. 复制连接字符串到 `NEON_DATABASE_URL`

### Supabase

1. 创建 [Supabase](https://supabase.com) 项目
2. 在设置中获取 URL 和 Service Role Key
3. 配置环境变量

### Turso

1. 安装 Turso CLI
2. 创建数据库
3. 获取连接 URL 和 Token

```bash
turso db create prompthub
turso db show prompthub --url
turso db tokens create prompthub
```

## 🔧 生产环境检查清单

### 安全

- [ ] 使用强密码的 `BETTER_AUTH_SECRET`（至少 32 字符）
- [ ] 启用 HTTPS
- [ ] 配置正确的 CORS
- [ ] 定期轮换访问令牌

### 性能

- [ ] 启用 CDN
- [ ] 配置缓存策略
- [ ] 优化图片（使用 next/image）
- [ ] 启用 gzip 压缩

### 监控

- [ ] 配置错误追踪（如 Sentry）
- [ ] 设置性能监控
- [ ] 配置日志收集
- [ ] 设置告警

### 备份

- [ ] 配置数据库自动备份
- [ ] 测试恢复流程
- [ ] 记录恢复步骤

## 🔄 CI/CD

### GitHub Actions

```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          
      - name: Install pnpm
        uses: pnpm/action-setup@v2
        with:
          version: 8
          
      - name: Install dependencies
        run: pnpm install
        
      - name: Build
        run: pnpm build
        
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
```

## 下一步

- 阅读 [开发指南](./development.md)
- 了解 [SEO 配置](./seo.md)
- 查看 [定制指南](./customization/branding.md)