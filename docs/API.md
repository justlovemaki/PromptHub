# API 接口文档

本文档详细描述了 AI 提示词管理平台的所有 API 接口。

## 🔐 认证说明

### JWT Token 格式

所有需要认证的接口都需要在请求头中携带 JWT Token：

```http
Authorization: Bearer <jwt_token>
```

### JWT Payload 结构

```typescript
interface JWTPayload {
  userId: string;          // 用户ID
  role: 'USER' | 'ADMIN';  // 用户角色
  personalSpaceId: string; // 个人空间ID
  iat: number;            // 签发时间
  exp: number;            // 过期时间
}
```

## 📝 响应格式

### 成功响应

```typescript
interface ApiResponse<T> {
  success: true;
  data: T;
  message?: string;
}
```

### 错误响应

```typescript
interface ApiResponse {
  success: false;
  error: string;
}
```

### HTTP 状态码

- `200` - 成功
- `201` - 创建成功
- `400` - 请求参数错误
- `401` - 未认证
- `403` - 权限不足
- `404` - 资源不存在
- `409` - 资源冲突
- `500` - 服务器内部错误

## 🚪 认证接口

### 用户注册

**POST** `/api/auth/register`

注册新用户并自动创建个人空间。

#### 请求体

```typescript
{
  email: string;     // 邮箱地址，必需
  password: string;  // 密码，至少6位，必需
  name?: string;     // 用户名，可选
}
```

#### 响应

```typescript
{
  success: true;
  data: {
    token: string;           // JWT Token
    user: {
      id: string;
      email: string;
      name: string;
      role: 'USER' | 'ADMIN';
    };
    personalSpaceId: string; // 个人空间ID
  };
  message: "User registered successfully";
}
```

#### 示例

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123",
    "name": "John Doe"
  }'
```

### 用户登录

**POST** `/api/auth/login`

用户邮箱密码登录。

#### 请求体

```typescript
{
  email: string;    // 邮箱地址
  password: string; // 密码
}
```

#### 响应

```typescript
{
  success: true;
  data: {
    token: string;
    user: {
      id: string;
      email: string;
      name: string;
      role: 'USER' | 'ADMIN';
    };
    personalSpaceId: string;
  };
  message: "Login successful";
}
```

### Google OAuth

**GET** `/api/auth/oauth/google`

重定向到 Google 授权页面。

#### 响应

重定向到 Google OAuth 授权页面。

### Google OAuth 回调

**GET** `/api/auth/oauth/google/callback`

处理 Google OAuth 回调，登录或注册用户。

#### 查询参数

- `code` - Google 授权码
- `state` - 状态参数

#### 响应

重定向到前端页面，并在 URL 中包含 token 参数。

### GitHub OAuth

**GET** `/api/auth/oauth/github`

重定向到 GitHub 授权页面。

**GET** `/api/auth/oauth/github/callback`

处理 GitHub OAuth 回调。

## 📄 提示词管理接口

### 创建提示词

**POST** `/api/prompts/create`

🔐 **需要认证**

在用户的个人空间中创建新的提示词。

#### 请求体

```typescript
{
  title: string;        // 提示词标题，必需
  content: string;      // 提示词内容，必需
  description?: string; // 描述，可选
  tags?: string[];      // 标签数组，可选
}
```

#### 响应

```typescript
{
  success: true;
  data: {
    id: string;
    title: string;
    content: string;
    description: string;
    tags: string[];
    spaceId: string;
    createdBy: string;
    createdAt: string;
    updatedAt: string;
  };
  message: "Prompt created successfully";
}
```

#### 示例

```bash
curl -X POST http://localhost:3000/api/prompts/create \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <jwt_token>" \
  -d '{
    "title": "代码审查提示词",
    "content": "请审查以下代码并提供改进建议：{code}",
    "description": "用于代码审查的提示词模板",
    "tags": ["代码", "审查", "开发"]
  }'
```

### 获取提示词列表

**GET** `/api/prompts/list`

🔐 **需要认证**

获取用户个人空间中的所有提示词。

#### 查询参数

- `page?` - 页码，默认 1
- `limit?` - 每页数量，默认 10
- `search?` - 搜索关键词
- `tags?` - 标签过滤，多个标签用逗号分隔

#### 响应

```typescript
{
  success: true;
  data: {
    prompts: Array<{
      id: string;
      title: string;
      content: string;
      description: string;
      tags: string[];
      useCount: number;
      createdAt: string;
      updatedAt: string;
    }>;
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  message: "Prompts retrieved successfully";
}
```

#### 示例

```bash
curl -X GET "http://localhost:3000/api/prompts/list?page=1&limit=10&search=代码" \
  -H "Authorization: Bearer <jwt_token>"
```

### 更新提示词

**POST** `/api/prompts/update`

🔐 **需要认证**

更新指定的提示词。只能更新自己空间中的提示词。

#### 请求体

```typescript
{
  id: string;                    // 提示词ID，必需
  data: {
    title?: string;              // 新标题
    content?: string;            // 新内容
    description?: string;        // 新描述
    tags?: string[];            // 新标签
  };
}
```

#### 响应

```typescript
{
  success: true;
  data: {
    id: string;
    title: string;
    content: string;
    description: string;
    tags: string[];
    updatedAt: string;
  };
  message: "Prompt updated successfully";
}
```

#### 示例

```bash
curl -X POST http://localhost:3000/api/prompts/update \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <jwt_token>" \
  -d '{
    "id": "prompt_123",
    "data": {
      "title": "更新的标题",
      "content": "更新的内容：{variable}"
    }
  }'
```

### 删除提示词

**POST** `/api/prompts/delete`

🔐 **需要认证**

删除指定的提示词。只能删除自己空间中的提示词。

#### 请求体

```typescript
{
  id: string; // 提示词ID
}
```

#### 响应

```typescript
{
  success: true;
  data: null;
  message: "Prompt deleted successfully";
}
```

#### 示例

```bash
curl -X POST http://localhost:3000/api/prompts/delete \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <jwt_token>" \
  -d '{
    "id": "prompt_123"
  }'
```

## ⚡ 实时通信接口

### 建立 SSE 连接

**GET** `/api/sse`

🔐 **需要认证**

建立 Server-Sent Events 长连接，接收实时更新。

#### 响应格式

```
Content-Type: text/event-stream
Cache-Control: no-cache
Connection: keep-alive
```

#### 事件类型

```typescript
// 连接成功
{
  type: 'connected';
  data: {
    connectionId: string;
    message: string;
  };
}

// 心跳检测
{
  type: 'heartbeat';
  timestamp: number;
}

// 提示词创建
{
  type: 'prompt_created';
  data: {
    prompt: PromptData;
    spaceId: string;
  };
}

// 提示词更新
{
  type: 'prompt_updated';
  data: {
    prompt: PromptData;
    spaceId: string;
  };
}

// 提示词删除
{
  type: 'prompt_deleted';
  data: {
    promptId: string;
    spaceId: string;
  };
}
```

#### 示例

```javascript
// 前端 JavaScript 示例
const eventSource = new EventSource('/api/sse', {
  headers: {
    'Authorization': 'Bearer ' + token
  }
});

eventSource.onmessage = function(event) {
  const data = JSON.parse(event.data);
  console.log('Received:', data);
  
  switch(data.type) {
    case 'prompt_created':
      // 处理新提示词创建
      break;
    case 'prompt_updated':
      // 处理提示词更新
      break;
    case 'prompt_deleted':
      // 处理提示词删除
      break;
  }
};

eventSource.onerror = function(event) {
  console.error('SSE error:', event);
};
```

## 💳 计费接口

### 创建支付会话

**POST** `/api/billing/create-checkout-session`

🔐 **需要认证**

创建 Stripe 支付会话，用于订阅升级。

#### 请求体

```typescript
{
  priceId: string;      // Stripe 价格ID，必需
  successUrl?: string;  // 支付成功回调URL
  cancelUrl?: string;   // 支付取消回调URL
}
```

#### 响应

```typescript
{
  success: true;
  data: {
    sessionId: string;  // Stripe 会话ID
    url: string;        // 支付页面URL
  };
  message: "Checkout session created successfully";
}
```

#### 示例

```bash
curl -X POST http://localhost:3000/api/billing/create-checkout-session \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <jwt_token>" \
  -d '{
    "priceId": "price_1234567890",
    "successUrl": "https://yourdomain.com/success",
    "cancelUrl": "https://yourdomain.com/cancel"
  }'
```

### Stripe Webhook

**POST** `/api/billing/webhook`

🔐 **Stripe 签名验证**

处理 Stripe Webhook 事件，更新用户订阅状态。

#### 请求头

```
stripe-signature: t=1234567890,v1=signature...
```

#### 处理的事件类型

- `checkout.session.completed` - 支付完成
- `customer.subscription.created` - 订阅创建
- `customer.subscription.updated` - 订阅更新
- `customer.subscription.deleted` - 订阅取消
- `invoice.payment_succeeded` - 发票支付成功
- `invoice.payment_failed` - 发票支付失败

#### 响应

```typescript
{
  received: true;
}
```

## 👑 管理后台接口

### 获取用户列表

**GET** `/api/admin/users/list`

🔐 **需要 ADMIN 权限**

获取平台所有用户列表。

#### 查询参数

- `page?` - 页码，默认 1
- `limit?` - 每页数量，默认 10
- `search?` - 搜索关键词（邮箱、姓名）
- `role?` - 角色过滤（USER, ADMIN）
- `subscriptionStatus?` - 订阅状态过滤（FREE, PRO, TEAM）

#### 响应

```typescript
{
  success: true;
  data: {
    users: Array<{
      id: string;
      email: string;
      name: string;
      role: 'USER' | 'ADMIN';
      subscriptionStatus: 'FREE' | 'PRO' | 'TEAM';
      createdAt: string;
      updatedAt: string;
    }>;
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  message: "Users retrieved successfully";
}
```

#### 示例

```bash
curl -X GET "http://localhost:3000/api/admin/users/list?page=1&limit=20&role=USER" \
  -H "Authorization: Bearer <admin_jwt_token>"
```

### 更新用户信息

**POST** `/api/admin/users/update`

🔐 **需要 ADMIN 权限**

更新指定用户的信息。

#### 请求体

```typescript
{
  id: string;                    // 用户ID，必需
  data: {
    role?: 'USER' | 'ADMIN';     // 用户角色
    subscriptionStatus?: 'FREE' | 'PRO' | 'TEAM'; // 订阅状态
    name?: string;               // 用户名
  };
}
```

#### 响应

```typescript
{
  success: true;
  data: {
    id: string;
    email: string;
    name: string;
    role: 'USER' | 'ADMIN';
    subscriptionStatus: 'FREE' | 'PRO' | 'TEAM';
    updatedAt: string;
  };
  message: "User updated successfully";
}
```

#### 示例

```bash
curl -X POST http://localhost:3000/api/admin/users/update \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <admin_jwt_token>" \
  -d '{
    "id": "user_123",
    "data": {
      "role": "ADMIN",
      "subscriptionStatus": "PRO"
    }
  }'
```

### 获取平台统计

**GET** `/api/admin/stats/get`

🔐 **需要 ADMIN 权限**

获取平台核心统计数据。

#### 响应

```typescript
{
  success: true;
  data: {
    totalUsers: number;          // 总用户数
    totalPrompts: number;        // 总提示词数
    totalSpaces: number;         // 总空间数
    activeUsers: number;         // 活跃用户数
    newUsersThisMonth: number;   // 本月新用户数
    subscriptionStats: {
      free: number;              // 免费用户数
      pro: number;               // Pro 用户数
      team: number;              // Team 用户数
    };
  };
  message: "Platform statistics retrieved successfully";
}
```

#### 示例

```bash
curl -X GET http://localhost:3000/api/admin/stats/get \
  -H "Authorization: Bearer <admin_jwt_token>"
```

## 🔍 健康检查接口

### 应用健康检查

**GET** `/api/health`

检查应用和数据库连接状态。

#### 响应

```typescript
// 健康状态
{
  status: 'healthy';
  timestamp: string;
  version: string;
}

// 不健康状态（HTTP 503）
{
  status: 'unhealthy';
  error: string;
  timestamp: string;
}
```

#### 示例

```bash
curl -X GET http://localhost:3000/api/health
```

## 🚨 错误处理

### 常见错误响应

#### 401 未认证

```typescript
{
  success: false;
  error: "Unauthorized: Missing or invalid authorization header";
}
```

#### 403 权限不足

```typescript
{
  success: false;
  error: "Forbidden: Admin access required";
}
```

#### 400 请求参数错误

```typescript
{
  success: false;
  error: "Invalid input: Email is required, Password must be at least 6 characters";
}
```

#### 404 资源不存在

```typescript
{
  success: false;
  error: "Prompt not found or access denied";
}
```

#### 409 资源冲突

```typescript
{
  success: false;
  error: "User with this email already exists";
}
```

#### 500 服务器错误

```typescript
{
  success: false;
  error: "Internal server error";
}
```

## 📡 客户端 SDK 示例

### TypeScript SDK

```typescript
class PromptManagerAPI {
  constructor(private baseUrl: string, private token?: string) {}
  
  setToken(token: string) {
    this.token = token;
  }
  
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      ...(this.token && { Authorization: `Bearer ${this.token}` }),
      ...options.headers,
    };
    
    const response = await fetch(url, { ...options, headers });
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error);
    }
    
    return data.data;
  }
  
  // 认证方法
  async register(email: string, password: string, name?: string) {
    return this.request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, name }),
    });
  }
  
  async login(email: string, password: string) {
    return this.request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }
  
  // 提示词方法
  async createPrompt(data: { title: string; content: string; description?: string; tags?: string[] }) {
    return this.request('/api/prompts/create', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }
  
  async getPrompts(params?: { page?: number; limit?: number; search?: string; tags?: string }) {
    const query = new URLSearchParams(params as any).toString();
    return this.request(`/api/prompts/list${query ? `?${query}` : ''}`);
  }
  
  async updatePrompt(id: string, data: any) {
    return this.request('/api/prompts/update', {
      method: 'POST',
      body: JSON.stringify({ id, data }),
    });
  }
  
  async deletePrompt(id: string) {
    return this.request('/api/prompts/delete', {
      method: 'POST',
      body: JSON.stringify({ id }),
    });
  }
  
  // SSE 连接
  createSSEConnection(onMessage: (data: any) => void, onError?: (error: any) => void) {
    const eventSource = new EventSource(`${this.baseUrl}/api/sse`, {
      headers: { Authorization: `Bearer ${this.token}` }
    });
    
    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      onMessage(data);
    };
    
    eventSource.onerror = (error) => {
      if (onError) onError(error);
    };
    
    return eventSource;
  }
}

// 使用示例
const api = new PromptManagerAPI('http://localhost:3000');

// 登录
const { token } = await api.login('user@example.com', 'password');
api.setToken(token);

// 创建提示词
const prompt = await api.createPrompt({
  title: '测试提示词',
  content: '这是一个测试提示词：{variable}',
  tags: ['测试', 'API']
});

// 建立 SSE 连接
const eventSource = api.createSSEConnection(
  (data) => console.log('Received:', data),
  (error) => console.error('SSE Error:', error)
);
```

这份 API 文档涵盖了平台的所有核心接口，包括详细的请求格式、响应格式和使用示例。开发者可以根据这份文档快速集成和使用平台的各项功能。