# 开发指南

本文档介绍 PromptHub 的开发流程、脚本命令和安全设计。

## 📝 开发脚本

### 常用命令

```bash
# 开发服务器
pnpm dev

# 生产构建
pnpm build

# 启动生产服务器
pnpm start

# 代码检查
pnpm lint

# 运行测试
pnpm test
```

### 数据库管理

```bash
# 生成迁移文件
npx drizzle-kit generate

# 执行迁移
npx drizzle-kit migrate

# 同步 schema（开发环境）
npx drizzle-kit push

# 可视化管理界面
npx drizzle-kit studio
```

### Sitemap 生成

```bash
# 构建后自动执行
pnpm build

# 或手动生成
node scripts/generate-sitemap.js
```

## 🔒 安全设计

### 认证安全

- **Better Auth**: 现代认证框架，支持 JWT 和 OAuth
- **会话管理**: 安全的会话存储和过期处理
- **密码哈希**: 使用 bcrypt 进行密码哈希

### 数据隔离

- **空间隔离**: 用户只能访问自己空间的资源
- **角色权限**: USER 和 ADMIN 不同的操作权限
- **API 验证**: 所有 API 端点都进行身份验证

### 数据库安全

- **SQL 注入防护**: Drizzle ORM 参数化查询
- **输入验证**: Zod 进行数据验证
- **敏感数据**: 密码和令牌使用哈希存储

### MCP 安全

- **独立令牌**: MCP 使用独立的访问令牌机制
- **令牌过期**: 支持令牌过期时间设置
- **最小权限**: 令牌仅能访问所属用户的数据

## 🏗️ 代码规范

### TypeScript

- 使用严格模式 (`strict: true`)
- 避免使用 `any` 类型
- 为所有函数参数和返回值添加类型

### React 组件

```typescript
// 推荐的组件结构
interface Props {
  title: string;
  onSubmit: (data: FormData) => void;
}

export function MyComponent({ title, onSubmit }: Props) {
  // 组件逻辑
  return (
    <div>
      <h1>{title}</h1>
    </div>
  );
}
```

### API 路由

```typescript
// src/app/api/example/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { verifyUserInApiRoute } from '@/lib/auth-helpers';
import { z } from 'zod';

const schema = z.object({
  name: z.string().min(1),
});

export async function POST(request: NextRequest) {
  // 1. 验证用户
  const user = await verifyUserInApiRoute(request);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // 2. 验证输入
  const body = await request.json();
  const result = schema.safeParse(body);
  if (!result.success) {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
  }

  // 3. 业务逻辑
  try {
    const data = await SomeService.create(result.data);
    return NextResponse.json({ data });
  } catch (error) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
```

### 服务层

```typescript
// src/lib/services.ts
export class ExampleService {
  static async create(data: CreateData) {
    const id = generateId();
    const [result] = await db.insert(exampleTable).values({
      id,
      ...data,
      updatedAt: DateService.getCurrentUTCDate(),
    }).returning();
    return result;
  }

  static async findById(id: string) {
    return db.query.exampleTable.findFirst({
      where: eq(exampleTable.id, id),
    });
  }

  static async update(id: string, data: UpdateData) {
    const [result] = await db.update(exampleTable)
      .set({
        ...data,
        updatedAt: DateService.getCurrentUTCDate(),
      })
      .where(eq(exampleTable.id, id))
      .returning();
    return result;
  }

  static async delete(id: string) {
    await db.delete(exampleTable)
      .where(eq(exampleTable.id, id));
  }
}
```

## 🧪 测试

### 单元测试

```bash
# 运行所有测试
pnpm test

# 运行特定测试
pnpm test -- --grep "service"

# 监听模式
pnpm test -- --watch
```

### 测试文件结构

```
src/
├── lib/
│   ├── services.ts
│   └── services.test.ts
├── components/
│   ├── Button.tsx
│   └── Button.test.tsx
```

## 🔧 调试

### VS Code 配置

```json
// .vscode/launch.json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Next.js: debug server-side",
      "type": "node-terminal",
      "request": "launch",
      "command": "pnpm dev"
    },
    {
      "name": "Next.js: debug client-side",
      "type": "chrome",
      "request": "launch",
      "url": "http://localhost:3000"
    }
  ]
}
```

### 日志

```typescript
// 开发环境日志
if (process.env.NODE_ENV === 'development') {
  console.log('Debug info:', data);
}

// 系统日志（记录到数据库）
await SystemLogService.log({
  level: 'INFO',
  category: 'AUTH',
  message: 'User logged in',
  userId: user.id,
});
```

## 📦 依赖管理

### 添加依赖

```bash
# 添加生产依赖
pnpm add package-name

# 添加开发依赖
pnpm add -D package-name

# 添加到特定包（Monorepo）
pnpm add package-name --filter @prompt-manager/core-logic
```

### 更新依赖

```bash
# 检查过时的依赖
pnpm outdated

# 更新所有依赖
pnpm update

# 更新特定依赖
pnpm update package-name
```

## 🌿 Git 工作流

### 分支策略

- `main`: 生产分支
- `develop`: 开发分支
- `feature/*`: 功能分支
- `fix/*`: 修复分支

### 提交规范

```bash
# 功能
git commit -m "feat: add user profile page"

# 修复
git commit -m "fix: resolve login redirect issue"

# 文档
git commit -m "docs: update API documentation"

# 样式
git commit -m "style: format code with prettier"

# 重构
git commit -m "refactor: simplify auth logic"

# 杂项
git commit -m "chore: update dependencies"
```

## 🔍 性能优化

### 图片优化

```tsx
import Image from 'next/image';

// 使用 next/image 自动优化
<Image
  src="/logo.png"
  alt="Logo"
  width={200}
  height={100}
  priority // 首屏图片
/>
```

### 代码分割

```tsx
import dynamic from 'next/dynamic';

// 懒加载组件
const HeavyComponent = dynamic(() => import('./HeavyComponent'), {
  loading: () => <p>Loading...</p>,
});
```

### 缓存策略

```typescript
// API 响应缓存
export async function GET() {
  return NextResponse.json(data, {
    headers: {
      'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
    },
  });
}
```

## 下一步

- 了解 [SEO 配置](./seo.md)
- 阅读 [定制指南](./customization/branding.md)
- 查看 [部署指南](./deployment.md)