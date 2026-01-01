# 移除提示词功能

本文档介绍如何将 PromptHub 改造为其他用途的应用，移除提示词相关功能。

## 🎯 改造目标

将项目从"提示词管理平台"改造为通用的 SaaS 模板，保留：

- ✅ 用户认证系统
- ✅ 用户管理
- ✅ 管理后台
- ✅ 国际化支持
- ✅ SEO 优化
- ✅ 数据库支持
- ✅ MCP 协议基础

## 📁 需要删除的文件

### 页面文件

```bash
# 删除提示词相关页面
rm -rf src/app/[lang]/explore/
rm -rf src/app/[lang]/prompt/
rm -rf src/app/[lang]/dashboard/  # 如不需要仪表板
```

### API 路由

```bash
# 删除提示词 API
rm -rf src/app/api/prompts/
```

### 组件

```bash
# 删除提示词相关组件
rm src/components/PromptModal.tsx
rm src/components/PromptUseButton.tsx
rm src/components/PromptUseDialog.tsx
rm src/components/TagSelector.tsx
```

### 翻译文件

删除或清空以下翻译文件中的内容：

```
public/locales/*/prompt.json
public/locales/*/explore.json
public/locales/*/dashboard.json  # 如不需要
```

## 🗄️ 修改数据库 Schema

### SQLite Schema

编辑 [`src/drizzle-sqlite-schema.ts`](../../src/drizzle-sqlite-schema.ts)：

```typescript
// 删除以下表定义
// export const prompt = sqliteTable('prompt', { ... });
// export const promptUsage = sqliteTable('prompt_usage', { ... });

// 保留以下表
export const user = sqliteTable('user', { ... });
export const session = sqliteTable('session', { ... });
export const account = sqliteTable('account', { ... });
export const verification = sqliteTable('verification', { ... });
export const space = sqliteTable('space', { ... });
export const membership = sqliteTable('membership', { ... });
export const accessTokens = sqliteTable('access_tokens', { ... });
export const systemLogs = sqliteTable('system_logs', { ... });
```

### PostgreSQL Schema

编辑 [`src/drizzle-postgres-schema.ts`](../../src/drizzle-postgres-schema.ts)，进行相同的修改。

### 动态 Schema 导出

编辑 [`src/drizzle-schema.ts`](../../src/drizzle-schema.ts)：

```typescript
// 移除 prompt 相关导出
// export { prompt, promptUsage } from './drizzle-sqlite-schema';
```

### 生成新迁移

```bash
# 生成迁移（会创建删除表的迁移）
npx drizzle-kit generate

# 执行迁移
npx drizzle-kit migrate
```

> ⚠️ 注意：这会删除现有的提示词数据。请先备份。

## 📝 修改服务层

编辑 [`src/lib/services.ts`](../../src/lib/services.ts)：

### 删除 PromptService

```typescript
// 删除整个 PromptService 类
// export class PromptService { ... }
```

### 修改 DashboardService

```typescript
export class DashboardService {
  static async getStats(userId: string) {
    // 移除提示词相关统计
    // 添加你的业务统计
    return {
      // 你的统计数据
    };
  }
}
```

### 修改 AdminService

```typescript
export class AdminService {
  static async getStats() {
    const [userCount] = await db
      .select({ count: count() })
      .from(user);

    // 移除提示词统计
    // 添加你的业务统计

    return {
      totalUsers: userCount.count,
      // 你的统计数据
    };
  }
}
```

## 🧭 修改导航

### 顶部导航

编辑 [`src/components/layout/TopNavbar.tsx`](../../src/components/layout/TopNavbar.tsx)：

```typescript
const navLinks = [
  // 移除
  // { href: '/explore', label: t('explore') },
  // { href: '/dashboard', label: t('dashboard') },
  
  // 添加你的链接
  { href: '/your-feature', label: t('yourFeature') },
];
```

### 管理后台导航

编辑 [`src/components/layout/AdminLayout.tsx`](../../src/components/layout/AdminLayout.tsx)：

```typescript
const adminLinks = [
  { href: '/admin', label: t('overview') },
  { href: '/admin/users', label: t('users') },
  // 移除
  // { href: '/admin/prompts', label: t('prompts') },
  { href: '/admin/logs', label: t('logs') },
  // 添加你的链接
];
```

## 🏠 修改首页

编辑 [`src/app/[lang]/page.tsx`](../../src/app/[lang]/page.tsx)：

```typescript
export default async function HomePage({
  params: { lang }
}: {
  params: { lang: string }
}) {
  const { t } = await useTranslation(lang, 'landing');

  return (
    <main>
      {/* 修改落地页内容 */}
      <HeroSection />
      <FeaturesSection />
      {/* 移除提示词相关展示 */}
      <CTASection />
    </main>
  );
}
```

## 🔄 修改 MCP 集成

如果需要保留 MCP 但修改工具：

编辑 [`src/app/api/mcp/route.ts`](../../src/app/api/mcp/route.ts)：

```typescript
// 修改可用工具列表
const tools = [
  {
    name: 'yourTool',
    description: 'Your tool description',
    inputSchema: {
      type: 'object',
      properties: {
        // 你的参数
      },
    },
  },
];

// 修改工具处理逻辑
async function handleToolCall(name: string, args: any, userId: string) {
  switch (name) {
    case 'yourTool':
      return await YourService.yourMethod(args);
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}
```

## 📋 保留的基础功能

改造后项目仍保留以下开箱即用的功能：

| 功能 | 说明 | 相关文件 |
|------|------|----------|
| 用户认证 | Better Auth + OAuth + 邮箱登录 | `src/lib/auth.ts` |
| 用户管理 | 角色权限、个人空间 | `src/lib/services.ts` |
| 管理后台 | 用户列表、系统日志 | `src/app/[lang]/admin/` |
| 国际化 | 多语言支持框架 | `src/i18n/` |
| SEO | 元数据、Sitemap、robots.txt | `src/lib/services/settings/` |
| 数据库 | SQLite/PostgreSQL 双支持 | `src/lib/database.ts` |
| MCP 协议 | AI 工具集成基础 | `src/app/api/mcp/` |

## ✅ 改造检查清单

### 删除文件

- [ ] 删除提示词页面 (`explore/`, `prompt/`)
- [ ] 删除提示词 API (`api/prompts/`)
- [ ] 删除提示词组件
- [ ] 清理翻译文件

### 修改数据库

- [ ] 删除 prompt 表定义
- [ ] 删除 promptUsage 表定义
- [ ] 更新 Schema 导出
- [ ] 生成并执行迁移

### 修改代码

- [ ] 删除 PromptService
- [ ] 修改 DashboardService
- [ ] 修改 AdminService
- [ ] 更新导航链接
- [ ] 修改首页内容

### 添加新功能

- [ ] 设计新的数据模型
- [ ] 创建新的服务层
- [ ] 创建新的 API
- [ ] 创建新的页面
- [ ] 添加翻译文案

### 测试

- [ ] 测试用户认证
- [ ] 测试管理后台
- [ ] 测试语言切换
- [ ] 测试数据库操作

## 🚀 快速改造脚本

创建一个脚本来自动化部分改造工作：

```bash
#!/bin/bash
# scripts/remove-prompts.sh

echo "Removing prompt-related files..."

# 删除页面
rm -rf src/app/[lang]/explore/
rm -rf src/app/[lang]/prompt/

# 删除 API
rm -rf src/app/api/prompts/

# 删除组件
rm -f src/components/PromptModal.tsx
rm -f src/components/PromptUseButton.tsx
rm -f src/components/PromptUseDialog.tsx
rm -f src/components/TagSelector.tsx

echo "Done! Please manually update:"
echo "1. Database schemas"
echo "2. Services"
echo "3. Navigation"
echo "4. Translations"
```

## 下一步

- 了解 [功能扩展](./extending.md) 添加新功能
- 阅读 [数据库架构](../database.md) 设计新表
- 查看 [API 接口文档](../api-reference.md) 创建新 API