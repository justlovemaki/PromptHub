# 身份验证与令牌过期策略

本文档描述了系统中的用户会话（Session）和访问令牌（Access Token）的过期时间及刷新机制。

## 1. 用户会话 (Session)

用户通过浏览器登录系统时创建的会话。

- **过期时间**: 14 天
- **更新机制**: 每次活动时，如果距离上次更新已超过 1 天，会话过期时间将自动顺延。
- **存储方式**: 数据库存储（Session 表）+ 浏览器 Cookie。
- **配置位置**: [`src/lib/auth.ts`](src/lib/auth.ts) 中的 `session.expiresIn`。

## 2. 访问令牌 (Access Token / API Token)

用于外部集成（如 Chrome 扩展程序、MCP 服务或直接 API 调用）的令牌。

### 令牌类型
- **Access Token**: 以 `lsp_` 开头，用于 API 请求的 Bearer 认证。
- **Refresh Token**: 以 `lspg_` 开头，用于获取新的 Access Token。

### 过期策略
Access Token 的过期时间在创建或刷新时通过 API 参数指定：

- **Access Token 过期时间**: 
  - 默认值：无固定默认值（取决于创建时的请求参数 `expiresIn`）。
  - 如果未提供 `expiresIn`，令牌在数据库中标记为永不过期（`accessTokenExpiresAt` 为 `null`）。
- **Refresh Token 过期时间**:
  - 默认值：无固定默认值（取决于创建时的请求参数 `refreshExpiresIn`）。
  - 如果未提供 `refreshExpiresIn`，令牌在数据库中标记为永不过期。

### 刷新机制
当 Access Token 过期时，客户端应调用 `POST /api/user/access-token` 并携带 `refreshToken` 来获取新的令牌对。

### 校验逻辑实现
系统在以下位置对 Token 的过期时间进行校验：

1. **Access Token 校验**:
   - 主要校验逻辑封装在 [`src/lib/mcp-auth.ts`](src/lib/mcp-auth.ts) 的 `authenticateRequest` 函数中。
   - 该函数在以下两个关键位置被调用，用于不同场景的认证：
     - **API 路由认证**: 在 [`src/lib/auth-helpers.ts`](src/lib/auth-helpers.ts) 的 `verifyUserInApiRoute` 函数中被调用。当请求头包含 `Token <token>` 格式时，会触发此校验。
     - **直接认证**: 在某些需要直接验证 MCP 令牌的逻辑中被调用。
   - 校验逻辑：查询数据库获取 `accessTokenExpiresAt`，并与当前系统时间 (`new Date()`) 进行比较。如果当前时间已超过过期时间，则返回 `null`（导致上层 API 返回 401）。
2. **Refresh Token 校验**:
   - 在 [`src/app/api/user/access-token/route.ts`](src/app/api/user/access-token/route.ts) 的 `POST` 处理函数中。
   - 校验逻辑：在刷新令牌时，系统会检查数据库中的 `refreshTokenExpiresAt`。如果已过期，则拒绝刷新请求并返回“refreshToken已过期”的错误。

## 3. 安全说明

- **会话失效**: 用户在浏览器中点击“退出登录”会立即撤销数据库中的 Session。
- **令牌撤销**: 用户可以通过 API 或用户界面手动删除其访问令牌记录，从而使该令牌立即失效。
- **过期检查**: 每次 API 请求都会在服务端进行实时过期检查。
