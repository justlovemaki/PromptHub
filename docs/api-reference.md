# API 接口文档

本文档介绍 PromptHub 的 REST API 接口。

## 📋 通用响应格式

所有接口返回统一的响应格式：

**成功响应:**

```json
{
  "success": true,
  "data": { ... },
  "message": "操作成功"
}
```

**错误响应:**

```json
{
  "success": false,
  "error": {
    "message": "错误信息"
  }
}
```

## � 认证相关

### Better Auth 端点

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/auth/[...all]` | Better Auth 处理所有认证请求 |
| GET | `/api/auth/me` | 获取当前登录用户信息 |
| POST | `/api/auth/newuser` | 新用户创建回调 |

### 获取当前用户

```http
GET /api/auth/me
```

**响应示例:**

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user_xxx",
      "email": "user@example.com",
      "name": "用户名",
      "role": "USER",
      "emailVerified": true
    }
  }
}
```

## 📝 提示词管理

### 获取提示词列表

```http
GET /api/prompts/list
```

**查询参数:**

| 参数 | 类型 | 说明 |
|------|------|------|
| `page` | number | 页码，默认 1 |
| `limit` | number | 每页数量，默认 10，最大 100 |
| `search` | string | 搜索关键词 |
| `id` | string | 按 ID 筛选 |
| `tag` | string | 标签筛选（单个标签） |
| `isPublic` | string | 公开状态筛选：`true` 或 `false` |
| `spaceId` | string | 空间 ID，默认为用户个人空间 |
| `sortBy` | string | 排序字段：`updatedAt`、`useCount`、`createdAt`、`title` |
| `sortOrder` | string | 排序方向：`asc`、`desc`，默认 `desc` |

**响应示例:**

```json
{
  "success": true,
  "data": {
    "prompts": [
      {
        "id": "prompt_xxx",
        "title": "提示词标题",
        "content": "提示词内容",
        "description": "描述",
        "tags": ["标签1", "标签2"],
        "isPublic": false,
        "useCount": 10,
        "createdAt": "2024-01-01T00:00:00Z",
        "updatedAt": "2024-01-01T00:00:00Z"
      }
    ],
    "total": 100,
    "page": 1,
    "limit": 10,
    "totalPages": 10
  },
  "message": "提示词获取成功"
}
```

### 获取单个提示词详情

```http
GET /api/prompts/{id}
```

> 注意：仅返回公开的提示词

**响应示例:**

```json
{
  "success": true,
  "data": {
    "id": "prompt_xxx",
    "title": "提示词标题",
    "content": "提示词内容",
    "description": "描述",
    "tags": ["标签1", "标签2"],
    "imageUrls": [],
    "isPublic": true,
    "useCount": 10,
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "message": "提示词获取成功"
}
```

### 创建提示词

```http
POST /api/prompts/create
Content-Type: application/json
```

**请求体:**

```json
{
  "title": "提示词标题",
  "content": "提示词内容",
  "description": "描述（可选）",
  "tags": ["标签1", "标签2"],
  "imageUrls": ["https://example.com/image.png"],
  "isPublic": false
}
```

**响应示例:**

```json
{
  "success": true,
  "data": {
    "id": "prompt_xxx",
    "title": "提示词标题",
    "content": "提示词内容",
    "description": "描述",
    "tags": ["标签1", "标签2"],
    "imageUrls": [],
    "isPublic": false,
    "useCount": 0,
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "message": "提示词创建成功"
}
```

### 更新提示词

```http
POST /api/prompts/update
Content-Type: application/json
```

**请求体:**

```json
{
  "id": "prompt_xxx",
  "title": "新标题",
  "content": "新内容",
  "description": "新描述",
  "tags": ["新标签"],
  "imageUrls": [],
  "isPublic": true
}
```

> 注意：所有字段（除 `id` 外）都是可选的，只更新提供的字段

**响应示例:**

```json
{
  "success": true,
  "data": {
    "id": "prompt_xxx",
    "title": "新标题",
    "content": "新内容",
    "description": "新描述",
    "tags": ["新标签"],
    "isPublic": true,
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "message": "提示词更新成功"
}
```

### 删除提示词

```http
POST /api/prompts/delete
Content-Type: application/json
```

**请求体:**

```json
{
  "id": "prompt_xxx"
}
```

**响应示例:**

```json
{
  "success": true,
  "data": null,
  "message": "提示词删除成功"
}
```

### 获取公开提示词（广场）

```http
GET /api/prompts/public
```

**查询参数:**

| 参数 | 类型 | 说明 |
|------|------|------|
| `page` | number | 页码，默认 1 |
| `limit` | number | 每页数量，默认 12，最大 100 |
| `search` | string | 搜索关键词 |
| `tag` | string | 标签筛选（单个标签） |
| `sortBy` | string | 排序字段：`updatedAt`、`useCount`、`createdAt`、`title` |
| `sortOrder` | string | 排序方向：`asc`、`desc`，默认 `desc` |

**响应示例:**

```json
{
  "success": true,
  "data": {
    "prompts": [...],
    "total": 100,
    "page": 1,
    "limit": 12,
    "totalPages": 9
  },
  "message": "提示词获取成功"
}
```

### 获取标签列表

```http
GET /api/prompts/tags
```

**查询参数:**

| 参数 | 类型 | 说明 |
|------|------|------|
| `search` | string | 搜索关键词（可选） |
| `spaceId` | string | 空间 ID，默认为用户个人空间 |

**响应示例:**

```json
{
  "success": true,
  "data": [
    { "name": "写作", "count": 15 },
    { "name": "编程", "count": 10 },
    { "name": "翻译", "count": 8 }
  ],
  "message": "标签获取成功"
}
```

### 获取提示词统计

```http
GET /api/prompts/stats
```

**查询参数:**

| 参数 | 类型 | 说明 |
|------|------|------|
| `spaceId` | string | 空间 ID，默认为用户个人空间 |

**响应示例:**

```json
{
  "success": true,
  "data": {
    "totalPrompts": 50,
    "publicPrompts": 10,
    "totalUsage": 500
  },
  "message": "统计数据获取成功"
}
```

### 记录使用

```http
POST /api/prompts/use
Content-Type: application/json
```

**请求体:**

```json
{
  "promptId": "prompt_xxx"
}
```

**响应示例:**

```json
{
  "success": true,
  "data": {
    "id": "prompt_xxx",
    "useCount": 11
  },
  "message": "使用次数已更新"
}
```

### 导出提示词

```http
GET /api/prompts/export
```

**查询参数:**

| 参数 | 类型 | 说明 |
|------|------|------|
| `spaceId` | string | 空间 ID，默认为用户个人空间 |

**响应:** JSON 文件下载，包含空间内所有提示词

```json
[
  {
    "title": "标题",
    "content": "内容",
    "description": "描述",
    "tags": ["标签"],
    "isPublic": false,
    "useCount": 10
  }
]
```

### 导入提示词

```http
POST /api/prompts/import
Content-Type: application/json
```

**请求体:**

```json
{
  "prompts": [
    {
      "title": "标题",
      "content": "内容",
      "isPublic": false,
      "tags": ["标签"],
      "description": "描述（可选）",
      "useCount": 0
    }
  ],
  "spaceId": "space_xxx"
}
```

> 注意：`title`、`content`、`isPublic` 为必填字段

**响应示例:**

```json
{
  "success": true,
  "data": {
    "importedCount": 5
  },
  "message": "提示词导入成功"
}
```

### 清空提示词

```http
POST /api/prompts/clear
```

**查询参数:**

| 参数 | 类型 | 说明 |
|------|------|------|
| `spaceId` | string | 空间 ID，默认为用户个人空间 |

> ⚠️ 危险操作：清空指定空间的所有提示词

**响应示例:**

```json
{
  "success": true,
  "data": {
    "clearedCount": 50
  },
  "message": "提示词已清空"
}
```

## 👤 用户接口

### 更新用户信息

```http
POST /api/user/update
Content-Type: application/json
```

**请求体:**

```json
{
  "name": "新用户名"
}
```

**响应示例:**

```json
{
  "success": true,
  "data": {
    "id": "user_xxx",
    "email": "user@example.com",
    "name": "新用户名",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "message": "用户信息更新成功"
}
```

### 获取访问令牌

```http
GET /api/user/access-token
```

**响应示例:**

```json
{
  "success": true,
  "data": {
    "token": "lsp_xxx",
    "refreshToken": "lspg_xxx",
    "expiresAt": "2024-01-01T00:00:00Z",
    "refreshTokenExpiresAt": "2024-02-01T00:00:00Z",
    "scope": null
  }
}
```

### 创建/刷新访问令牌

```http
POST /api/user/access-token
Content-Type: application/json
```

**请求体（首次创建）:**

```json
{
  "expiresIn": 3600,
  "refreshExpiresIn": 2592000
}
```

**请求体（刷新令牌）:**

```json
{
  "refreshToken": "lspg_xxx",
  "expiresIn": 3600,
  "refreshExpiresIn": 2592000
}
```

> 注意：`expiresIn` 和 `refreshExpiresIn` 单位为秒

**响应示例:**

```json
{
  "success": true,
  "data": {
    "token": "lsp_new_xxx",
    "refreshToken": "lspg_new_xxx",
    "expiresAt": "2024-01-01T01:00:00Z",
    "refreshTokenExpiresAt": "2024-02-01T00:00:00Z",
    "scope": null
  }
}
```

### 删除访问令牌

```http
DELETE /api/user/access-token
```

**响应示例:**

```json
{
  "success": true,
  "message": "访问令牌已删除"
}
```

### 管理订阅

```http
POST /api/user/subscription
Content-Type: application/json
```

**请求体:**

```json
{
  "action": "upgrade"
}
```

| action 值 | 说明 |
|-----------|------|
| `upgrade` | 升级到专业版 |
| `downgrade` | 降级到免费版 |
| `cancel` | 取消订阅 |

**响应示例:**

```json
{
  "success": true,
  "data": {
    "userId": "user_xxx",
    "subscriptionStatus": "PRO"
  },
  "message": "订阅状态更新成功"
}
```

### 获取 AI 积分使用情况

```http
GET /api/user/ai-points
```

**查询参数:**

| 参数 | 类型 | 说明 |
|------|------|------|
| `startDate` | string | 开始日期（可选） |
| `endDate` | string | 结束日期（可选） |
| `type` | string | 类型筛选，默认 `USE` |

**响应示例:**

```json
{
  "success": true,
  "data": {
    "totalPoints": 5000,
    "usedPoints": 1500,
    "remainingPoints": 3500,
    "usageHistory": [...]
  },
  "message": "AI积分获取成功"
}
```

### 购买 AI 积分

```http
POST /api/user/purchase-ai-points
Content-Type: application/json
```

## 👑 管理后台接口

> 以下接口需要 ADMIN 角色权限

### 获取用户列表

```http
GET /api/admin/users/list
```

**查询参数:**

| 参数 | 类型 | 说明 |
|------|------|------|
| `page` | number | 页码，默认 1 |
| `limit` | number | 每页数量，默认 10 |
| `search` | string | 搜索关键词（邮箱或用户名） |
| `sort` | string | 排序字段：`id`、`email`、`name`、`role`、`subscriptionStatus`、`createdAt`、`updatedAt` |
| `order` | string | 排序方向：`asc`、`desc`，默认 `desc` |
| `role` | string | 角色筛选：`USER`、`ADMIN` |
| `subscriptionStatus` | string | 订阅状态筛选：`FREE`、`PRO`、`TEAM` |

**响应示例:**

```json
{
  "success": true,
  "data": {
    "users": [
      {
        "id": "user_xxx",
        "email": "user@example.com",
        "name": "用户名",
        "role": "USER",
        "subscriptionStatus": "FREE",
        "createdAt": "2024-01-01T00:00:00Z",
        "updatedAt": "2024-01-01T00:00:00Z"
      }
    ],
    "total": 100,
    "page": 1,
    "limit": 10,
    "totalPages": 10
  },
  "message": "用户列表获取成功"
}
```

### 更新用户

```http
POST /api/admin/users/update
Content-Type: application/json
```

**请求体:**

```json
{
  "userId": "user_xxx",
  "role": "ADMIN",
  "subscriptionStatus": "PRO",
  "subscriptionEndDate": "2024-12-31T00:00:00Z",
  "name": "新用户名"
}
```

> 注意：所有字段（除 `userId` 外）都是可选的

**响应示例:**

```json
{
  "success": true,
  "data": {
    "id": "user_xxx",
    "email": "user@example.com",
    "name": "新用户名",
    "role": "ADMIN",
    "subscriptionStatus": "PRO",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "message": "操作完成"
}
```

### 获取所有提示词

```http
GET /api/admin/prompts/list
```

**查询参数:**

| 参数 | 类型 | 说明 |
|------|------|------|
| `page` | number | 页码，默认 1 |
| `limit` | number | 每页数量，默认 10，最大 100 |
| `search` | string | 搜索关键词 |
| `sortBy` | string | 排序字段：`title`、`createdAt`、`updatedAt`、`useCount` |
| `sortOrder` | string | 排序方向：`asc`、`desc`，默认 `desc` |
| `isPublic` | string | 公开状态筛选：`true` 或 `false` |

**响应示例:**

```json
{
  "success": true,
  "data": {
    "prompts": [...],
    "total": 500,
    "page": 1,
    "limit": 10,
    "totalPages": 50
  },
  "message": "提示词获取成功"
}
```

### 获取热门提示词

```http
GET /api/admin/prompts/popular
```

**查询参数:**

| 参数 | 类型 | 说明 |
|------|------|------|
| `limit` | number | 返回数量，默认 10 |

**响应示例:**

```json
{
  "success": true,
  "data": [
    {
      "id": "prompt_xxx",
      "title": "热门提示词",
      "description": "描述",
      "tags": ["标签"],
      "useCount": 1000,
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ],
  "message": "提示词获取成功"
}
```

### 获取平台统计

```http
GET /api/admin/stats/get
```

**响应示例:**

```json
{
  "success": true,
  "data": {
    "totalUsers": 100,
    "totalPrompts": 500,
    "totalSpaces": 120,
    "activeUsers": 100,
    "newUsersThisMonth": 20,
    "subscriptionStats": {
      "free": 80,
      "pro": 15,
      "team": 5
    }
  },
  "message": "统计数据获取成功"
}
```

### 获取系统日志

```http
GET /api/admin/logs/list
```

**查询参数:**

| 参数 | 类型 | 说明 |
|------|------|------|
| `page` | number | 页码，默认 1 |
| `limit` | number | 每页数量，默认 20，最大 100 |
| `sort` | string | 排序字段：`timestamp`、`level`、`category` |
| `order` | string | 排序方向：`asc`、`desc`，默认 `desc` |
| `level` | string | 日志级别筛选：`INFO`、`WARN`、`ERROR` |
| `category` | string | 日志类别筛选：`API`、`AUTH`、`SYSTEM` 等 |
| `search` | string | 搜索关键词（消息或详情） |

**响应示例:**

```json
{
  "success": true,
  "data": {
    "logs": [
      {
        "id": "log_xxx",
        "level": "INFO",
        "category": "API",
        "message": "提示词创建成功",
        "details": {...},
        "userId": "user_xxx",
        "userEmail": "user@example.com",
        "ip": "127.0.0.1",
        "userAgent": "Mozilla/5.0...",
        "timestamp": "2024-01-01T00:00:00Z"
      }
    ],
    "total": 1000,
    "page": 1,
    "limit": 20,
    "totalPages": 50
  },
  "message": "日志获取成功"
}
```

## 📊 仪表板接口

### 获取用户统计

```http
GET /api/dashboard/stats
```

**响应示例:**

```json
{
  "success": true,
  "data": {
    "totalPrompts": 50,
    "publicPrompts": 10,
    "totalUsage": 500,
    "recentPrompts": [...]
  },
  "message": "仪表盘统计数据获取成功"
}
```

## 🤖 MCP 协议端点

```http
POST /api/mcp
```

详细说明请参考 [MCP 集成文档](./mcp-integration.md)。

## 🔧 其他接口

### 健康检查

```http
GET /api/health
```

**响应示例:**

```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00Z",
  "version": "0.1.0",
  "environment": "production"
}
```

### SSE 连接

```http
GET /api/sse
```

用于实时事件推送。需要用户认证。

**事件类型:**

| 类型 | 说明 |
|------|------|
| `connected` | 连接成功 |
| `heartbeat` | 心跳检测（每30秒） |
| `prompt_created` | 提示词创建 |
| `prompt_updated` | 提示词更新 |
| `prompt_deleted` | 提示词删除 |

**连接成功响应:**

```json
{
  "type": "connected",
  "data": {
    "connectionId": "user_xxx_1704067200000",
    "message": "连接成功"
  }
}
```

## 💳 支付接口

### 创建结账会话

```http
POST /api/billing/create-checkout-session
Content-Type: application/json
```

### Webhook 回调

```http
POST /api/billing/webhook
```

> 用于接收 Stripe 支付回调

## 错误响应

所有接口在发生错误时返回统一格式：

```json
{
  "success": false,
  "error": {
    "message": "错误信息"
  }
}
```

常见 HTTP 状态码：

| 状态码 | 说明 |
|--------|------|
| 400 | 请求参数错误 |
| 401 | 未认证 |
| 403 | 权限不足 |
| 404 | 资源不存在 |
| 500 | 服务器内部错误 |

## 下一步

- 了解 [MCP 集成](./mcp-integration.md)
- 查看 [数据库架构](./database.md)