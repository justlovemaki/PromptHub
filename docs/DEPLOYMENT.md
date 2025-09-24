# 部署指南

本文档详细说明如何在不同环境中部署 AI 提示词管理平台。

## 🚀 Vercel 部署（推荐）

### 1. 准备工作

确保你的项目已推送到 GitHub/GitLab。

### 2. 在 Vercel 上创建项目

1. 访问 [Vercel Dashboard](https://vercel.com/dashboard)
2. 点击 "New Project"
3. 导入你的 GitHub 仓库
4. 配置项目设置：
   - **Framework Preset**: Next.js
   - **Root Directory**: `./`
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`

### 3. 环境变量配置

在 Vercel 项目设置中添加以下环境变量：

```env
# 数据库配置（使用 SQLite 文件或 libSQL）
DB_FILE_NAME=file:sqlite.db

# Better Auth 配置
BETTER_AUTH_SECRET=your-better-auth-secret-production
BETTER_AUTH_URL=https://your-domain.vercel.app

# OAuth 配置
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret

# Stripe 配置
STRIPE_SECRET_KEY=sk_live_your-stripe-secret-key
STRIPE_PUBLISHABLE_KEY=pk_live_your-stripe-publishable-key
STRIPE_WEBHOOK_SECRET=whsec_your-webhook-secret

# 产品价格 ID
STRIPE_PRO_PRICE_ID=price_live_pro_monthly
STRIPE_TEAM_PRICE_ID=price_live_team_monthly

# 前端 URL
FRONTEND_URL=https://your-domain.vercel.app

# 生产环境
NODE_ENV=production
```

### 4. 数据库迁移

项目使用 SQLite 数据库，适合小型到中型应用。对于 Vercel 部署，推荐使用：

- **libSQL** (推荐) - 由 Turso 提供的 SQLite 兼容数据库，支持同步
- **PlanetScale** (MySQL) - 适用于需要 MySQL 的场景
- **SQLite 文件** - 适用于简单的只读场景

如果使用 libSQL，请将环境变量更新为：
```env
DB_FILE_NAME=libsql://your-db-name.turso.io
TURSO_AUTH_TOKEN=your-turso-auth-token
```

## 🐳 Docker 部署

### 1. 创建 Dockerfile

```dockerfile
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install dependencies based on the preferred package manager
COPY package.json package-lock.json* ./
RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Drizzle migrations
RUN npm run db:generate

# Build the application
RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

# Set the correct permission for prerender cache
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Automatically leverage output traces to reduce image size
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]
```

### 2. 创建 docker-compose.yml

```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DB_FILE_NAME=file:/data/sqlite.db
      - BETTER_AUTH_SECRET=your-better-auth-secret
      - BETTER_AUTH_URL=http://localhost:3000
      - FRONTEND_URL=http://localhost:3000
      - STRIPE_SECRET_KEY=sk_test_your-stripe-secret-key
      - STRIPE_WEBHOOK_SECRET=whsec_your-webhook-secret
      - STRIPE_PRO_PRICE_ID=price_pro_monthly
      - STRIPE_TEAM_PRICE_ID=price_team_monthly
    volumes:
      - ./data:/data  # SQLite 数据库文件存储位置
    depends_on:
      - db
    restart: unless-stopped

  # 如果需要 libSQL 数据库，可以取消注释以下部分
  # db:
  #   image: ghcr.io/tursodatabase/libsql-server:latest
  #   environment:
  #     - LIBSQL_ROOT_PASSWORD=your-db-password
  #   ports:
  #     - "8080:8080"
  #   volumes:
  #     - libsql_data:/var/lib/libsql
  #   restart: unless-stopped

volumes:
  libsql_data:
```

### 3. 构建和运行

```bash
# 构建镜像
docker-compose build

# 运行容器
docker-compose up -d

# 查看日志
docker-compose logs -f app

# 停止容器
docker-compose down
```

## ☁️ AWS 部署

### 1. EC2 部署

```bash
# 连接到 EC2 实例
ssh -i your-key.pem ubuntu@your-ec2-ip

# 安装 Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 安装 PM2
sudo npm install -g pm2

# 安装 Git
sudo apt-get update && sudo apt-get install -y git

# 克隆项目
git clone your-repo.git
cd prompt-manager

# 安装依赖
npm install

# 构建项目
npm run build

# 配置环境变量
cp .env.example .env
# 编辑 .env 文件，设置正确的环境变量

# 启动应用
pm2 start npm --name "prompt-manager" -- start

# 保存 PM2 配置
pm2 save

# 设置 PM2 开机自启
pm2 startup

# 查看应用状态
pm2 status
```

### 2. 使用 AWS Lambda + API Gateway (Serverless)

1. 安装 Serverless Framework：
```bash
npm install -g serverless
```

2. 安装 Next.js 插件：
```bash
npm install --save-dev serverless-next.js
```

3. 创建 `serverless.yml`：
```yaml
service: prompt-manager

provider:
  name: aws
  runtime: nodejs18.x
  region: us-east-1
  environment:
    NODE_ENV: production
    DB_FILE_NAME: ${env:DB_FILE_NAME}
    BETTER_AUTH_SECRET: ${env:BETTER_AUTH_SECRET}
    BETTER_AUTH_URL: ${env:BETTER_AUTH_URL}
    STRIPE_SECRET_KEY: ${env:STRIPE_SECRET_KEY}
    STRIPE_WEBHOOK_SECRET: ${env:STRIPE_WEBHOOK_SECRET}
    STRIPE_PRO_PRICE_ID: ${env:STRIPE_PRO_PRICE_ID}
    STRIPE_TEAM_PRICE_ID: ${env:STRIPE_TEAM_PRICE_ID}

plugins:
  - serverless-next.js

custom:
  next:
    build:
      env:
        NODE_ENV: production
        DB_FILE_NAME: ${env:DB_FILE_NAME}
        BETTER_AUTH_SECRET: ${env:BETTER_AUTH_SECRET}
        BETTER_AUTH_URL: ${env:BETTER_AUTH_URL}
        STRIPE_SECRET_KEY: ${env:STRIPE_SECRET_KEY}
        STRIPE_WEBHOOK_SECRET: ${env:STRIPE_WEBHOOK_SECRET}
        STRIPE_PRO_PRICE_ID: ${env:STRIPE_PRO_PRICE_ID}
        STRIPE_TEAM_PRICE_ID: ${env:STRIPE_TEAM_PRICE_ID}
```

## 🔧 生产环境优化

### 1. 性能优化

```typescript
// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone', // 生成独立的构建
  experimental: {
    appDir: true,
  },
  compress: true,
  poweredByHeader: false,
  generateEtags: false,
  httpAgentOptions: {
    keepAlive: true,
  },
  // 启用 SWC 压缩
  swcMinify: true,
  // 优化图片
  images: {
    domains: ['localhost', 'your-domain.com'],
    formats: ['image/webp', 'image/avif'],
  },
  // 添加安全头
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ];
  },
}

const securityHeaders = [
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'on'
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload'
  },
  {
    key: 'X-XSS-Protection',
    value: '1; mode=block'
  },
  {
    key: 'X-Frame-Options',
    value: 'DENY'
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff'
  },
  {
    key: 'Referrer-Policy',
    value: 'origin-when-cross-origin'
  }
];

module.exports = nextConfig
```

### 2. 数据库优化

```typescript
// lib/database.ts
import 'dotenv/config';
import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';
import * as schema from '../drizzle-schema';

// 使用环境变量中的数据库配置
const dbUrl = process.env.DB_FILE_NAME || 'file:sqlite.db';

const client = createClient({ url: dbUrl });
export const db = drizzle(client, { schema, logger: false });
```

### 3. 缓存策略

```typescript
// lib/cache.ts
// 由于使用 SQLite，可以利用数据库的内置缓存机制
// 对于更高级的缓存需求，可以使用以下配置
export class CacheService {
  // 使用内存缓存或 Redis（如果需要分布式缓存）
  private static cache = new Map();
  private static ttl = new Map();

  static async get<T>(key: string): Promise<T | null> {
    const now = Date.now();
    if (this.ttl.has(key) && this.ttl.get(key) < now) {
      // TTL 过期，删除缓存
      this.cache.delete(key);
      this.ttl.delete(key);
      return null;
    }
    return this.cache.get(key) || null;
  }

  static async set(key: string, value: any, ttlSeconds = 3600): Promise<void> {
    this.cache.set(key, value);
    this.ttl.set(key, Date.now() + (ttlSeconds * 1000));
  }

  static async del(key: string): Promise<void> {
    this.cache.delete(key);
    this.ttl.delete(key);
  }

  static async clear(): Promise<void> {
    this.cache.clear();
    this.ttl.clear();
  }
}
```

### 4. 安全头配置

```typescript
// next.config.js (已在上面的配置中包含)
const securityHeaders = [
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'on'
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload'
  },
  {
    key: 'X-XSS-Protection',
    value: '1; mode=block'
  },
  {
    key: 'X-Frame-Options',
    value: 'DENY'
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff'
  },
  {
    key: 'Referrer-Policy',
    value: 'origin-when-cross-origin'
  },
  {
    key: 'Permissions-Policy',
    value: 'geolocation=(), microphone=(), camera=()'
  }
];
```

## 🏗️ Windows 部署注意事项

由于项目使用 SQLite，Windows 部署可能会遇到一些问题。请遵循以下步骤：

### 1. 安装依赖

在 Windows 上推荐使用 Bun 或 Yarn 来避免 better-sqlite3 的编译问题：

```bash
# 使用 Bun (推荐)
npm install -g bun
bun install
bun pm trust --all

# 或使用 Yarn
npm install -g yarn
yarn install

# 如果必须使用 npm，配置镜像源
npm config set registry https://registry.npmmirror.com
$env:BETTER_SQLITE3_BINARY_HOST="https://npmmirror.com/mirrors/better-sqlite3"
npm install
```

### 2. 数据库配置

在 Windows 环境下，SQLite 文件路径应使用绝对路径：

```env
# Windows 环境下的数据库配置
DB_FILE_NAME=file:C:\path\to\your\project\sqlite.db
```

### 3. 构建配置

Windows 用户可能需要在构建时设置额外的环境变量：

```bash
# 设置环境变量后构建
set NODE_ENV=production && npm run build
```

## 🚀 自动化部署

### GitHub Actions

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        node-version: [18.x]
    steps:
    - uses: actions/checkout@v3
    - name: Setup Node.js ${{ matrix.node-version }}
      uses: actions/setup-node@v3
      with:
        node-version: ${{ matrix.node-version }}
        cache: 'npm'
    - name: Install dependencies
      run: npm ci
    - name: Run tests
      run: npm test
    - name: Run build
      run: npm run build
      env:
        NODE_ENV: production
        DB_FILE_NAME: file:sqlite.db
        BETTER_AUTH_SECRET: ${{ secrets.BETTER_AUTH_SECRET }}
        BETTER_AUTH_URL: ${{ secrets.BETTER_AUTH_URL }}
        STRIPE_SECRET_KEY: ${{ secrets.STRIPE_SECRET_KEY }}
        STRIPE_WEBHOOK_SECRET: ${{ secrets.STRIPE_WEBHOOK_SECRET }}
        STRIPE_PRO_PRICE_ID: ${{ secrets.STRIPE_PRO_PRICE_ID }}
        STRIPE_TEAM_PRICE_ID: ${{ secrets.STRIPE_TEAM_PRICE_ID }}

  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
    - name: Install dependencies
      run: npm ci
    - name: Build application
      run: npm run build
      env:
        NODE_ENV: production
        DB_FILE_NAME: file:sqlite.db
        BETTER_AUTH_SECRET: ${{ secrets.BETTER_AUTH_SECRET }}
        BETTER_AUTH_URL: ${{ secrets.BETTER_AUTH_URL }}
        STRIPE_SECRET_KEY: ${{ secrets.STRIPE_SECRET_KEY }}
        STRIPE_WEBHOOK_SECRET: ${{ secrets.STRIPE_WEBHOOK_SECRET }}
        STRIPE_PRO_PRICE_ID: ${{ secrets.STRIPE_PRO_PRICE_ID }}
        STRIPE_TEAM_PRICE_ID: ${{ secrets.STRIPE_TEAM_PRICE_ID }}
    - name: Deploy to Vercel
      uses: amondnet/vercel-action@v25
      with:
        vercel-token: ${{ secrets.VERCEL_TOKEN }}
        vercel-org-id: ${{ secrets.ORG_ID }}
        vercel-project-id: ${{ secrets.PROJECT_ID }}
        vercel-args: '--prod'
        github-comment: false
```

## 📁 项目结构说明

```
prompt-manager/
├── src/
│   ├── app/                 # Next.js App Router 页面
│   ├── components/         # React 组件
│   ├── lib/               # 工具函数和配置
│   │   ├── auth.ts        # 认证配置
│   │   ├── database.ts    # 数据库连接
│   │   └── server-actions.ts # 服务端操作
│   ├── drizzle-schema.ts  # 数据库模型定义
│   └── middleware.ts      # 中间件配置
├── drizzle/              # 数据库迁移文件
├── packages/             # Monorepo 包
│   ├── core-logic/       # 核心逻辑
│   └── ui-components/    # UI 组件
├── public/               # 静态资源
├── docs/                 # 文档
├── .env.example          # 环境变量示例
├── package.json
├── next.config.js        # Next.js 配置
├── drizzle.config.ts     # Drizzle ORM 配置
└── Dockerfile            # Docker 配置
```

通过以上配置，你的 AI 提示词管理平台就可以在生产环境中稳定运行了。记住在部署前充分测试所有功能，并确保所有敏感信息都通过环境变量安全管理。