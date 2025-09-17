# 认证流程更新说明

## 概述

已成功更新了项目的认证流程，现在所有登录方法（邮箱密码、GitHub OAuth、Google OAuth）都会在成功登录后自动调用 `/api/auth/login` 生成并设置 JWT token。

## 修改内容

### 1. 更新了 `/api/auth/login` 路由

- **文件**: `src/app/api/auth/login/route.ts`
- **功能**: 接收用户ID和邮箱，验证用户身份后生成JWT token
- **请求格式**:
  ```json
  {
    "userId": "用户ID",
    "email": "用户邮箱"
  }
  ```
- **响应格式**:
  ```json
  {
    "success": true,
    "data": {
      "token": "JWT令牌",
      "user": {
        "id": "用户ID",
        "email": "邮箱",
        "name": "用户名", 
        "role": "角色"
      },
      "personalSpaceId": "个人空间ID"
    },
    "message": "JWT token generated successfully"
  }
  ```

### 2. 更新了 `LoginModal.tsx` 组件

- **文件**: `src/components/LoginModal.tsx`
- **主要修改**:
  - 添加了 `callJWTLogin` 函数用于调用JWT API
  - 更新了 `handleSubmit`、`handleGitHubLogin`、`handleGoogleLogin` 三个方法
  - 邮箱密码登录成功后直接调用JWT API并刷新页面
  - OAuth登录重定向到认证回调页面处理JWT设置

### 3. 创建了认证回调页面

- **文件**: `src/app/[lang]/auth/callback/page.tsx`
- **功能**: 处理OAuth登录后的JWT token设置
- **流程**:
  1. 检查用户是否已通过OAuth认证
  2. 如果已认证，调用JWT API设置token
  3. 重定向回原页面或首页

### 4. 创建了测试文件

- **文件**: `src/app/api/auth/login/login-jwt.test.ts`
- **功能**: 测试JWT登录API的各种场景

## 使用流程

### 邮箱密码登录
1. 用户输入邮箱密码
2. 调用 Better Auth 进行认证
3. 认证成功后立即调用 `/api/auth/login` 生成JWT
4. 关闭登录模态框并刷新页面

### GitHub/Google OAuth 登录
1. 用户点击OAuth登录按钮
2. 重定向到 GitHub/Google 认证页面
3. 认证成功后重定向到 `/auth/callback` 页面
4. 回调页面检查用户会话并调用 `/api/auth/login` 生成JWT
5. 重定向回原页面

## JWT Token 管理

- JWT token 会同时返回在响应中和设置为 httpOnly cookie
- Token 有效期为 7 天
- Cookie 设置了安全属性（production 环境下为 HTTPS only）

## 安全特性

- JWT token 存储在 httpOnly cookie 中，防止 XSS 攻击
- Token 包含用户ID、角色和个人空间ID信息
- 认证失败会返回详细的错误信息便于调试

## 注意事项

1. 确保所有环境变量已正确配置（GitHub、Google OAuth 凭据等）
2. OAuth 回调URL 需要在各平台正确配置
3. 生产环境需要配置正确的域名和 HTTPS

## 测试

可以使用以下命令运行相关测试：

```bash
npm test login-jwt.test.ts
```

这个更新确保了无论用户使用哪种登录方式，都能获得一致的认证体验和JWT token。