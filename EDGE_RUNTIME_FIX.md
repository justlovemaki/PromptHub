# Edge Runtime 兼容性修复

## 问题描述

在 Next.js 中间件中使用 dotenv 会导致 Edge Runtime 错误：
```
Cannot read properties of undefined (reading 'reduce')
```

这是因为 Edge Runtime 不支持某些 Node.js 功能，包括 dotenv 库。

## 解决方案

### 1. 创建 Edge Runtime 兼容的数据库连接

创建了 `src/lib/database-edge.ts`，这个文件不使用 dotenv，直接读取 `process.env`：

```typescript
// Edge Runtime 兼容的数据库连接
import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';
import * as schema from '../drizzle-schema';

const client = createClient({ 
  url: process.env.DB_FILE_NAME || 'file:sqlite.db' 
});

export const db = drizzle(client, { schema, logger: false });
```

### 2. 简化中间件逻辑

将复杂的数据库操作从中间件中移除，只保留基本的路由保护：
- 公开路由直接放行
- 需要认证的路由进行基本 token 检查
- 将详细的用户验证逻辑移到各个 API 路由中

### 3. 创建认证助手函数

创建了 `src/lib/auth-helpers.ts`，包含：
- `verifyUserInApiRoute()` - 在 API 路由中验证普通用户
- `verifyAdminInApiRoute()` - 在 API 路由中验证管理员用户
- 各种工具函数用于提取请求头信息

### 4. 更新 API 路由

更新所有 API 路由使用新的认证助手，例如：

```typescript
import { verifyUserInApiRoute } from '@/lib/auth-helpers';

export async function GET(request: NextRequest) {
  const user = await verifyUserInApiRoute(request);
  if (!user) {
    return NextResponse.json(
      errorResponse('Unauthorized'),
      { status: HTTP_STATUS.UNAUTHORIZED }
    );
  }
  // ... 业务逻辑
}
```

## 环境变量配置

创建 `.env` 文件（基于 `.env.example`）：
```bash
cp .env.example .env
```

编辑 `.env` 文件，设置必要的环境变量。

## 测试修复

启动开发服务器验证修复：
```bash
npm run dev
```

## 技术说明

- **Edge Runtime 限制**：Next.js 中间件运行在 Edge Runtime 中，不支持所有 Node.js API
- **dotenv 问题**：dotenv 使用了 Edge Runtime 不支持的 Node.js 功能
- **架构改进**：将认证逻辑分层，中间件做基础检查，API 路由做详细验证

这个解决方案既解决了 Edge Runtime 兼容性问题，又提高了代码的可维护性和安全性。