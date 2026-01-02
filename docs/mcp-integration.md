# MCP 集成

本文档介绍如何集成 Model Context Protocol (MCP)，使 AI 工具能够访问你的提示词。

## 🤖 什么是 MCP

Model Context Protocol (MCP) 是一个开放协议，允许 AI 应用（如 Claude Desktop）与外部工具和数据源进行交互。PromptHub 实现了 MCP 2025-03-26 版本规范。

## 🔑 获取访问令牌

在使用 MCP 之前，你需要获取访问令牌：

1. 登录 PromptHub
2. 访问 **账户设置** 页面
3. 在 **访问令牌** 部分点击 **生成新令牌**
4. 复制并安全保存令牌（仅显示一次）

> ⚠️ 访问令牌具有完整的账户访问权限，请妥善保管。

## 🔧 配置 Claude Desktop

### 1. 找到配置文件

Claude Desktop 配置文件位置：

- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

### 2. 编辑配置

```json
{
  "mcpServers": {
    "prompt-manager": {
      "command": "node",
      "args": ["/path/to/mcp-client.js"],
      "env": {
        "MCP_SERVER_URL": "http://localhost:3000/api/mcp",
        "MCP_ACCESS_TOKEN": "your-access-token"
      }
    }
  }
}
```

### 3. 重启 Claude Desktop

配置完成后，重启 Claude Desktop 以加载新的 MCP 服务器。

## 🛠️ 可用工具

### listPrompt

列出所有提示词，支持分页。

**参数:**

| 参数 | 类型 | 必需 | 说明 |
|------|------|------|------|
| `page` | number | 否 | 页码，默认 1 |
| `pageSize` | number | 否 | 每页数量，默认 30，最大 100 |

**请求示例:**

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "listPrompt",
    "arguments": {
      "page": 1,
      "pageSize": 30
    }
  }
}
```

**响应示例:**

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "content": [
      {
        "type": "text",
        "text": "{\"prompts\":[...],\"total\":100,\"page\":1,\"pageSize\":30}"
      }
    ]
  }
}
```

### getPromptById

获取特定提示词的详细信息。

**参数:**

| 参数 | 类型 | 必需 | 说明 |
|------|------|------|------|
| `id` | string | 是 | 提示词 ID |

**请求示例:**

```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "method": "tools/call",
  "params": {
    "name": "getPromptById",
    "arguments": {
      "id": "prompt_xxx"
    }
  }
}
```

**响应示例:**

```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "result": {
    "content": [
      {
        "type": "text",
        "text": "{\"id\":\"prompt_xxx\",\"title\":\"...\",\"content\":\"...\"}"
      }
    ]
  }
}
```

## 📡 协议详情

### 端点

```
POST /api/mcp
```

### 认证

在请求头中包含访问令牌：

```http
Authorization: Bearer your-access-token
```

### 支持的方法

| 方法 | 说明 |
|------|------|
| `initialize` | 初始化连接 |
| `tools/list` | 列出可用工具 |
| `tools/call` | 调用工具 |

### 初始化请求

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "initialize",
  "params": {
    "protocolVersion": "2025-03-26",
    "capabilities": {},
    "clientInfo": {
      "name": "your-client",
      "version": "1.0.0"
    }
  }
}
```

### 初始化响应

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "protocolVersion": "2025-03-26",
    "capabilities": {
      "tools": {}
    },
    "serverInfo": {
      "name": "prompt-manager-mcp",
      "version": "1.0.0"
    }
  }
}
```

## 🔒 安全考虑

1. **令牌安全**: 访问令牌应当保密，不要提交到版本控制
2. **HTTPS**: 生产环境应使用 HTTPS
3. **令牌过期**: 定期轮换访问令牌
4. **最小权限**: 令牌仅能访问所属用户的提示词

## 🐛 故障排除

### 连接失败

1. 检查 MCP_SERVER_URL 是否正确
2. 确认服务器正在运行
3. 验证访问令牌是否有效

### 认证错误

1. 检查令牌是否过期
2. 确认令牌格式正确（Bearer token）
3. 重新生成访问令牌

### 工具调用失败

1. 检查参数格式是否正确
2. 确认提示词 ID 存在
3. 查看服务器日志获取详细错误信息

## 📚 相关资源

- [MCP 协议规范](https://modelcontextprotocol.io/)
- [Claude Desktop 文档](https://claude.ai/docs)
- [API 接口文档](./api-reference.md)

## 下一步

- 查看 [数据库架构](./database.md)
- 阅读 [部署指南](./deployment.md)