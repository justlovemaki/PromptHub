# API 接口文档

本文档介绍 PromptHub 的 REST API 接口。

## 🔐 认证相关

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
  "user": {
    "id": "user_xxx",
    "email": "user@example.com",
    "name": "用户名",
    "role": "USER",
    "emailVerified": true
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
| `pageSize` | number | 每页数量，默认 20 |
| `search` | string | 搜索关键词 |
| `tags` | string | 标签筛选（逗号分隔） |

**响应示例:**

```json
{
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
  "pageSize": 20
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
  "isPublic": false
}
```

**响应示例:**

```json
{
  "prompt": {
    "id": "prompt_xxx",
    "title": "提示词标题",
    "content": "提示词内容",
    "description": "描述",
    "tags": ["标签1", "标签2"],
    "isPublic": false,
    "useCount": 0,
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  }
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
  "isPublic": true
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

### 获取公开提示词（广场）

```http
GET /api/prompts/public
```

**查询参数:**

| 参数 | 类型 | 说明 |
|------|------|------|
| `page` | number | 页码，默认 1 |
| `pageSize` | number | 每页数量，默认 20 |
| `search` | string | 搜索关键词 |
| `tags` | string | 标签筛选（逗号分隔） |
| `sortBy` | string | 排序字段：`updatedAt`、`useCount`、`createdAt` |
| `sortOrder` | string | 排序方向：`asc`、`desc` |

### 获取标签列表

```http
GET /api/prompts/tags
```

**响应示例:**

```json
{
  "tags": [
    { "name": "写作", "count": 15 },
    { "name": "编程", "count": 10 },
    { "name": "翻译", "count": 8 }
  ]
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
  "id": "prompt_xxx"
}
```

### 导出提示词

```http
POST /api/prompts/export
Content-Type: application/json
```

**请求体:**

```json
{
  "ids": ["prompt_xxx", "prompt_yyy"]
}
```

**响应:** JSON 文件下载

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
      "tags": ["标签"]
    }
  ]
}
```

### 清空提示词

```http
POST /api/prompts/clear
```

> ⚠️ 危险操作：清空当前用户的所有提示词

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

### 获取/管理访问令牌

```http
GET /api/user/access-token
POST /api/user/access-token
DELETE /api/user/access-token
```

### 获取订阅信息

```http
GET /api/user/subscription
```

### 获取 AI 积分

```http
GET /api/user/ai-points
```

### 购买 AI 积分

```http
POST /api/user/purchase-ai-points
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
| `page` | number | 页码 |
| `pageSize` | number | 每页数量 |
| `search` | string | 搜索关键词 |
| `role` | string | 角色筛选 |

### 更新用户

```http
POST /api/admin/users/update
Content-Type: application/json
```

**请求体:**

```json
{
  "id": "user_xxx",
  "role": "ADMIN",
  "name": "新用户名"
}
```

### 获取所有提示词

```http
GET /api/admin/prompts/list
```

### 获取热门提示词

```http
GET /api/admin/prompts/popular
```

### 获取平台统计

```http
GET /api/admin/stats/get
```

**响应示例:**

```json
{
  "stats": {
    "totalUsers": 100,
    "totalPrompts": 500,
    "totalUsage": 10000,
    "publicPrompts": 200,
    "newUsersToday": 5,
    "newPromptsToday": 20
  }
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
  "stats": {
    "totalPrompts": 50,
    "publicPrompts": 10,
    "totalUsage": 500,
    "recentPrompts": [...]
  }
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

**响应:**

```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00Z"
}
```

### SSE 连接

```http
GET /api/sse
```

用于实时事件推送。

## 错误响应

所有接口在发生错误时返回统一格式：

```json
{
  "error": "错误信息",
  "code": "ERROR_CODE"
}
```

常见错误码：

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
- 阅读 [开发指南](./development.md)