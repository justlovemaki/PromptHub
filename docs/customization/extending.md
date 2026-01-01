# 功能扩展

本文档介绍如何扩展 PromptHub 的功能。

## 🏗️ 添加新的业务服务

### 服务层结构

业务逻辑服务位于 [`src/lib/services.ts`](../../src/lib/services.ts)。

### 创建新服务

```typescript
// src/lib/services.ts

import { db } from './database';
import { yourTable } from '@/drizzle-schema';
import { eq } from 'drizzle-orm';
import { generateId, DateService } from './utils';

export interface CreateYourDataInput {
  name: string;
  description?: string;
  userId: string;
}

export interface UpdateYourDataInput {
  name?: string;
  description?: string;
}

export class YourService {
  /**
   * 创建记录
   */
  static async create(data: CreateYourDataInput) {
    const id = generateId();
    const [result] = await db.insert(yourTable).values({
      id,
      name: data.name,
      description: data.description,
      userId: data.userId,
      createdAt: DateService.getCurrentUTCDate(),
      updatedAt: DateService.getCurrentUTCDate(),
    }).returning();
    return result;
  }

  /**
   * 根据 ID 查找
   */
  static async findById(id: string) {
    return db.query.yourTable.findFirst({
      where: eq(yourTable.id, id),
    });
  }

  /**
   * 根据用户 ID 查找所有
   */
  static async findByUserId(userId: string) {
    return db.query.yourTable.findMany({
      where: eq(yourTable.userId, userId),
      orderBy: (table, { desc }) => [desc(table.createdAt)],
    });
  }

  /**
   * 更新记录
   */
  static async update(id: string, data: UpdateYourDataInput) {
    const [result] = await db.update(yourTable)
      .set({
        ...data,
        updatedAt: DateService.getCurrentUTCDate(),
      })
      .where(eq(yourTable.id, id))
      .returning();
    return result;
  }

  /**
   * 删除记录
   */
  static async delete(id: string) {
    await db.delete(yourTable)
      .where(eq(yourTable.id, id));
  }

  /**
   * 分页查询
   */
  static async findPaginated(options: {
    userId: string;
    page: number;
    pageSize: number;
    search?: string;
  }) {
    const { userId, page, pageSize, search } = options;
    const offset = (page - 1) * pageSize;

    let query = db.select().from(yourTable)
      .where(eq(yourTable.userId, userId));

    if (search) {
      query = query.where(
        like(yourTable.name, `%${search}%`)
      );
    }

    const [items, countResult] = await Promise.all([
      query.limit(pageSize).offset(offset),
      db.select({ count: count() }).from(yourTable)
        .where(eq(yourTable.userId, userId)),
    ]);

    return {
      items,
      total: countResult[0].count,
      page,
      pageSize,
    };
  }
}
```

## 🗄️ 添加新的数据表

### 1. 定义 SQLite Schema

编辑 [`src/drizzle-sqlite-schema.ts`](../../src/drizzle-sqlite-schema.ts)：

```typescript
import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const yourTable = sqliteTable('your_table', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  userId: text('user_id').notNull().references(() => user.id),
  status: text('status').default('active'),
  metadata: text('metadata'), // JSON 字符串
  createdAt: text('created_at'),
  updatedAt: text('updated_at'),
});
```

### 2. 定义 PostgreSQL Schema

编辑 [`src/drizzle-postgres-schema.ts`](../../src/drizzle-postgres-schema.ts)：

```typescript
import { pgTable, text, timestamp, jsonb } from 'drizzle-orm/pg-core';

export const yourTable = pgTable('your_table', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  userId: text('user_id').notNull().references(() => user.id),
  status: text('status').default('active'),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at'),
  updatedAt: timestamp('updated_at'),
});
```

### 3. 导出 Schema

编辑 [`src/drizzle-schema.ts`](../../src/drizzle-schema.ts)：

```typescript
// 添加导出
export { yourTable } from './drizzle-sqlite-schema';
// 或
export { yourTable } from './drizzle-postgres-schema';
```

### 4. 生成并执行迁移

```bash
# 生成迁移文件
npx drizzle-kit generate

# 执行迁移
npx drizzle-kit migrate
```

## 🔌 添加新的 API 路由

### 创建 API 路由

在 `src/app/api/` 下创建路由文件：

```typescript
// src/app/api/your-feature/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { verifyUserInApiRoute } from '@/lib/auth-helpers';
import { YourService } from '@/lib/services';
import { z } from 'zod';

// 输入验证 Schema
const createSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
});

const updateSchema = z.object({
  id: z.string(),
  name: z.string().min(1).max(100).optional(),
  description: z.string().optional(),
});

// GET - 获取列表
export async function GET(request: NextRequest) {
  try {
    const user = await verifyUserInApiRoute(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');
    const search = searchParams.get('search') || undefined;

    const result = await YourService.findPaginated({
      userId: user.id,
      page,
      pageSize,
      search,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching data:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// POST - 创建
export async function POST(request: NextRequest) {
  try {
    const user = await verifyUserInApiRoute(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const result = createSchema.safeParse(body);
    
    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: result.error.errors },
        { status: 400 }
      );
    }

    const data = await YourService.create({
      ...result.data,
      userId: user.id,
    });

    return NextResponse.json({ data });
  } catch (error) {
    console.error('Error creating data:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// PUT - 更新
export async function PUT(request: NextRequest) {
  try {
    const user = await verifyUserInApiRoute(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const result = updateSchema.safeParse(body);
    
    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: result.error.errors },
        { status: 400 }
      );
    }

    // 验证所有权
    const existing = await YourService.findById(result.data.id);
    if (!existing || existing.userId !== user.id) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const data = await YourService.update(result.data.id, result.data);

    return NextResponse.json({ data });
  } catch (error) {
    console.error('Error updating data:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// DELETE - 删除
export async function DELETE(request: NextRequest) {
  try {
    const user = await verifyUserInApiRoute(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: 'ID required' }, { status: 400 });
    }

    // 验证所有权
    const existing = await YourService.findById(id);
    if (!existing || existing.userId !== user.id) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    await YourService.delete(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting data:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
```

## 📄 添加新的页面

### 创建页面组件

在 `src/app/[lang]/` 下创建页面：

```typescript
// src/app/[lang]/your-page/page.tsx
import { Metadata } from 'next';
import { useTranslation } from '@/i18n';
import { YourPageClient } from './YourPageClient';

export async function generateMetadata({
  params: { lang }
}: {
  params: { lang: string }
}): Promise<Metadata> {
  return {
    title: 'Your Page Title',
    description: 'Your page description',
  };
}

export default async function YourPage({
  params: { lang }
}: {
  params: { lang: string }
}) {
  const { t } = await useTranslation(lang, 'your-namespace');

  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">{t('title')}</h1>
      <YourPageClient lang={lang} />
    </main>
  );
}
```

### 创建客户端组件

```typescript
// src/app/[lang]/your-page/YourPageClient.tsx
'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from '@/i18n/client';

interface Props {
  lang: string;
}

export function YourPageClient({ lang }: Props) {
  const { t } = useTranslation(lang, 'your-namespace');
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      const response = await fetch('/api/your-feature');
      const result = await response.json();
      setData(result.items || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      {data.map((item: any) => (
        <div key={item.id} className="p-4 border rounded mb-4">
          <h2 className="font-semibold">{item.name}</h2>
          <p className="text-gray-600">{item.description}</p>
        </div>
      ))}
    </div>
  );
}
```

## 🪝 添加新的 Hook

### 创建自定义 Hook

```typescript
// src/hooks/useYourFeature.ts
import { useState, useEffect, useCallback } from 'react';

interface YourData {
  id: string;
  name: string;
  description?: string;
}

interface UseYourFeatureOptions {
  initialPage?: number;
  pageSize?: number;
}

export function useYourFeature(options: UseYourFeatureOptions = {}) {
  const { initialPage = 1, pageSize = 20 } = options;
  
  const [data, setData] = useState<YourData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(initialPage);
  const [total, setTotal] = useState(0);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(
        `/api/your-feature?page=${page}&pageSize=${pageSize}`
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch data');
      }
      
      const result = await response.json();
      setData(result.items);
      setTotal(result.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [page, pageSize]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const create = async (input: Omit<YourData, 'id'>) => {
    const response = await fetch('/api/your-feature', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
    
    if (!response.ok) {
      throw new Error('Failed to create');
    }
    
    await fetchData();
    return response.json();
  };

  const update = async (id: string, input: Partial<YourData>) => {
    const response = await fetch('/api/your-feature', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...input }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to update');
    }
    
    await fetchData();
    return response.json();
  };

  const remove = async (id: string) => {
    const response = await fetch(`/api/your-feature?id=${id}`, {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      throw new Error('Failed to delete');
    }
    
    await fetchData();
  };

  return {
    data,
    loading,
    error,
    page,
    total,
    pageSize,
    setPage,
    refetch: fetchData,
    create,
    update,
    remove,
  };
}
```

## 📦 常量配置

### 添加新常量

编辑 [`src/lib/constants.ts`](../../src/lib/constants.ts)：

```typescript
// 用户角色
export const USER_ROLES = {
  USER: 'USER',
  ADMIN: 'ADMIN',
  MODERATOR: 'MODERATOR', // 新增
} as const;

// 状态
export const STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  PENDING: 'pending',
} as const;

// 类型
export type UserRole = typeof USER_ROLES[keyof typeof USER_ROLES];
export type Status = typeof STATUS[keyof typeof STATUS];
```

## ✅ 功能扩展检查清单

- [ ] 设计数据模型
- [ ] 创建数据库 Schema（SQLite + PostgreSQL）
- [ ] 生成并执行迁移
- [ ] 创建服务层
- [ ] 创建 API 路由
- [ ] 添加输入验证
- [ ] 创建页面组件
- [ ] 添加翻译文案
- [ ] 编写测试

## 下一步

- 了解 [国际化扩展](./i18n.md)
- 阅读 [移除提示词功能](./removing-prompts.md)
- 查看 [数据库架构](../database.md)