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
# 数据库（Vercel 使用 PostgreSQL 或其他云数据库）
DATABASE_URL=postgresql://username:password@host:port/database

# JWT 配置
JWT_SECRET=your-super-secret-jwt-key-production
JWT_EXPIRATION=7d

# Better Auth 配置
BETTER_AUTH_SECRET=your-better-auth-secret-production
BETTER_AUTH_URL=https://your-domain.vercel.app

# OAuth 配置
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=https://your-domain.vercel.app/api/auth/oauth/google/callback

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

由于 Vercel 是无服务器环境，SQLite 不适用。推荐使用：

- **Neon** (PostgreSQL)
- **PlanetScale** (MySQL)
- **Supabase** (PostgreSQL)

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
      - DATABASE_URL=postgresql://postgres:password@db:5432/promptmanager
      - JWT_SECRET=your-jwt-secret
      - BETTER_AUTH_SECRET=your-auth-secret
      - BETTER_AUTH_URL=http://localhost:3000
    depends_on:
      - db
    volumes:
      - ./data:/app/data

  db:
    image: postgres:15
    environment:
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=password
      - POSTGRES_DB=promptmanager
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

volumes:
  postgres_data:
```

### 3. 构建和运行

```bash
# 构建镜像
docker-compose build

# 运行容器
docker-compose up -d

# 查看日志
docker-compose logs -f app
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

# 克隆项目
git clone your-repo.git
cd prompt-manager

# 安装依赖
npm install

# 构建项目
npm run build

# 配置环境变量
cp .env.example .env
# 编辑 .env 文件

# 启动应用
pm2 start npm --name "prompt-manager" -- start
pm2 save
pm2 startup
```

### 2. 使用 AWS Lambda + API Gateway

1. 安装 Serverless Framework：
```bash
npm install -g serverless
```

2. 创建 `serverless.yml`：
```yaml
service: prompt-manager

provider:
  name: aws
  runtime: nodejs18.x
  region: us-east-1
  environment:
    NODE_ENV: production
    DATABASE_URL: ${env:DATABASE_URL}
    JWT_SECRET: ${env:JWT_SECRET}

functions:
  app:
    handler: lambda.handler
    events:
      - http:
          path: /{proxy+}
          method: ANY
          cors: true
      - http:
          path: /
          method: ANY
          cors: true

plugins:
  - serverless-nextjs-plugin
```

## 🔧 生产环境优化

### 1. 性能优化

```typescript
// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
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
    domains: ['your-domain.com'],
    formats: ['image/webp', 'image/avif'],
  },
}

module.exports = nextConfig
```

### 2. 缓存策略

```typescript
// lib/cache.ts
import { Redis } from 'ioredis';

const redis = new Redis(process.env.REDIS_URL);

export class CacheService {
  static async get<T>(key: string): Promise<T | null> {
    const cached = await redis.get(key);
    return cached ? JSON.parse(cached) : null;
  }
  
  static async set(key: string, value: any, ttl = 3600): Promise<void> {
    await redis.setex(key, ttl, JSON.stringify(value));
  }
  
  static async del(key: string): Promise<void> {
    await redis.del(key);
  }
}
```

### 3. 数据库连接池

```typescript
// lib/database.ts
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

const connectionString = process.env.DATABASE_URL!;

const client = postgres(connectionString, {
  max: 10, // 连接池大小
  idle_timeout: 20,
  connect_timeout: 10,
});

export const db = drizzle(client);
```

## 📊 监控和日志

### 1. 添加健康检查端点

```typescript
// app/api/health/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/lib/database';

export async function GET() {
  try {
    // 检查数据库连接
    await db.select().from(user).limit(1);
    
    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version,
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: 'unhealthy',
        error: 'Database connection failed',
        timestamp: new Date().toISOString(),
      },
      { status: 503 }
    );
  }
}
```

### 2. 错误监控

建议集成以下服务：
- **Sentry** - 错误追踪
- **LogRocket** - 用户会话录制
- **DataDog** - 应用性能监控

### 3. 日志记录

```typescript
// lib/logger.ts
import winston from 'winston';

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
  ],
});
```

## 🔐 安全配置

### 1. HTTPS 配置

确保在生产环境中启用 HTTPS：

```typescript
// middleware.ts
export function middleware(request: NextRequest) {
  // 强制 HTTPS
  if (process.env.NODE_ENV === 'production' && 
      request.headers.get('x-forwarded-proto') !== 'https') {
    return NextResponse.redirect(
      `https://${request.headers.get('host')}${request.nextUrl.pathname}`,
      301
    );
  }
  
  // ... 其他中间件逻辑
}
```

### 2. 安全头配置

```typescript
// next.config.js
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

module.exports = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ];
  },
};
```

## 📱 移动端优化

### 1. PWA 配置

```json
// public/manifest.json
{
  "name": "AI 提示词管理平台",
  "short_name": "PromptManager",
  "description": "高效的AI提示词管理平台",
  "start_url": "/",
  "display": "standalone",
  "theme_color": "#000000",
  "background_color": "#ffffff",
  "icons": [
    {
      "src": "/icons/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

### 2. Service Worker

```typescript
// public/sw.js
const CACHE_NAME = 'prompt-manager-v1';
const urlsToCache = [
  '/',
  '/static/css/',
  '/static/js/',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        return response || fetch(event.request);
      })
  );
});
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
  deploy:
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
    
    - name: Run tests
      run: npm test
    
    - name: Build application
      run: npm run build
    
    - name: Deploy to Vercel
      uses: amondnet/vercel-action@v20
      with:
        vercel-token: ${{ secrets.VERCEL_TOKEN }}
        vercel-org-id: ${{ secrets.ORG_ID }}
        vercel-project-id: ${{ secrets.PROJECT_ID }}
        vercel-args: '--prod'
```

通过以上配置，你的 AI 提示词管理平台就可以在生产环境中稳定运行了。记住在部署前充分测试所有功能，并确保所有敏感信息都通过环境变量安全管理。