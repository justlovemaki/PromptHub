# Drizzle ORM 版本兼容性修复说明

## 问题描述

项目中使用的 Drizzle ORM 版本是 `0.29.4`，这是一个较旧的版本，不支持 `$onUpdate()` 方法。该方法是在更新记录时自动设置字段值的功能，通常用于自动更新 `updatedAt` 时间戳字段。

## 错误信息

```
类型"NotNull<SQLiteTimestampBuilderInitial<"updated_at">>"上不存在属性"$onUpdate"。 ts(2339)
```

## 修复方案

由于升级 Drizzle ORM 会引入依赖冲突，我们采用了代码兼容性修复方案：

### 1. 数据库模式修复

将所有表中的 `updatedAt` 字段从：
```typescript
updatedAt: integer("updated_at", { mode: 'timestamp_ms' }).notNull().$onUpdate(() => new Date()),
```

修改为：
```typescript
updatedAt: integer("updated_at", { mode: 'timestamp_ms' }).notNull().$defaultFn(() => new Date()),
```

### 2. 服务层自动更新时间

在所有更新操作中手动添加 `updatedAt: new Date()`：

```typescript
// 示例：更新提示词
static async updatePrompt(promptId: string, updates: UpdateData) {
  const updateData = {
    ...updates,
    updatedAt: new Date(), // 手动设置更新时间
  };
  
  return await db.update(prompt)
    .set(updateData)
    .where(eq(prompt.id, promptId))
    .returning();
}
```

### 3. 辅助工具函数

创建了 `src/lib/db-helpers.ts` 文件，提供：

1. **更新辅助函数**：为每个表提供自动设置 `updatedAt` 的更新方法
2. **通用工具函数**：`withUpdatedAt()` 函数可以为任何数据对象添加更新时间

## 使用建议

### 在更新操作中

```typescript
// 方式1：使用辅助函数
import { updateHelpers } from '@/lib/db-helpers';
await updateHelpers.updatePrompt(promptId, updateData);

// 方式2：手动添加更新时间
await db.update(prompt).set({
  ...updateData,
  updatedAt: new Date(),
}).where(eq(prompt.id, promptId));

// 方式3：使用工具函数
import { withUpdatedAt } from '@/lib/db-helpers';
await db.update(prompt).set(
  withUpdatedAt(updateData)
).where(eq(prompt.id, promptId));
```

### 未来升级准备

当升级到支持 `$onUpdate()` 的 Drizzle ORM 版本时：

1. 将 `$defaultFn(() => new Date())` 改回 `$onUpdate(() => new Date())`
2. 移除手动设置 `updatedAt` 的代码
3. 可以继续使用辅助函数来保持代码一致性

## 已修复的文件

- ✅ `src/drizzle-schema.ts` - 移除了 `$onUpdate()` 调用
- ✅ `src/lib/services.ts` - 在 `updatePrompt` 方法中添加了自动更新时间
- ✅ `src/app/api/admin/users/update/route.ts` - 已正确处理更新时间
- ✅ 创建了 `src/lib/db-helpers.ts` - 提供更新辅助工具

## 检查清单

如果在其他地方添加新的更新操作，请确保：

- [ ] 在所有 `db.update()` 操作中手动添加 `updatedAt: new Date()`
- [ ] 或者使用 `db-helpers.ts` 中的辅助函数
- [ ] 在服务层方法中自动处理更新时间

这样可以确保在当前版本下所有的更新操作都能正确设置更新时间。