# Chrome 扩展

PromptHub Chrome 扩展让您可以在浏览器中快速访问和使用您的提示词库。

**源码地址**: [GitHub - PromptHubExt](https://github.com/justlovemaki/PromptHubExt)

## ✨ 功能特性

- 🚀 **快速访问** - 在任何网页上一键打开提示词面板
- 🔍 **搜索提示词** - 快速搜索和筛选您的提示词
- 📋 **一键复制** - 点击即可复制提示词内容到剪贴板
- 🔄 **实时同步** - 与 PromptHub 账户实时同步数据
- 🌐 **多语言支持** - 支持中文、英文、日文界面

## 📥 安装

### 从 Chrome Web Store 安装（推荐）

1. 访问 [Chrome Web Store - PromptHub](https://chromewebstore.google.com/detail/prompthub/agfndihommcfegdgglfgepoeecakllfn)
2. 点击 **添加至 Chrome**
3. 在弹出的确认框中点击 **添加扩展程序**

### 开发者模式安装

如果您需要从源码安装或进行开发：

1. 克隆扩展仓库
2. 打开 Chrome，访问 `chrome://extensions/`
3. 开启右上角的 **开发者模式**
4. 点击 **加载已解压的扩展程序**
5. 选择扩展的 `dist` 或 `build` 目录


## 📖 使用指南

### 基本操作

1. **打开面板** - 点击工具栏中的 PromptHub 图标
2. **搜索提示词** - 在搜索框中输入关键词
3. **复制提示词** - 点击提示词卡片上的复制按钮
4. **查看详情** - 点击提示词标题查看完整内容

### 快捷键

Chrome 扩展支持自定义快捷键，您可以在 Chrome 浏览器中设置：

1. 访问 `chrome://extensions/shortcuts`
2. 找到 PromptHub 扩展
3. 设置您喜欢的快捷键组合

## 🏗️ 技术架构

Chrome 扩展使用以下共享包：

### @promptmanager/core-logic

核心逻辑包提供：

- **API 客户端** - 与 PromptHub 服务器通信
- **状态管理** - 使用 Zustand 管理认证和提示词状态
- **类型定义** - TypeScript 类型和 Zod 验证

```typescript
import { api, useAuthStore } from '@promptmanager/core-logic';

// 获取提示词列表
const response = await api.getPrompts({ page: 1, limit: 20 });

// 使用认证状态
const { user, isAuthenticated, login, logout } = useAuthStore();
```

### @promptmanager/ui-components

共享 UI 组件包提供：

- Button、Card、Input 等基础组件
- Modal、Sheet 等交互组件
- DataTable、SearchToolbar 等业务组件

## 🔐 权限说明

扩展需要以下权限：

| 权限 | 用途 |
|------|------|
| `storage` | 存储登录状态和设置 |
| `activeTab` | 在当前标签页插入提示词 |
| `contextMenus` | 添加右键菜单选项 |

## ❓ 常见问题

### 扩展无法登录

1. 检查网络连接
2. 确认服务器地址正确
3. 清除扩展数据后重试

### 提示词不同步

1. 检查是否已登录
2. 点击刷新按钮手动同步
3. 检查服务器状态

### 快捷键不工作

1. 访问 `chrome://extensions/shortcuts`
2. 找到 PromptHub 扩展
3. 重新设置快捷键

## 🔗 相关链接

- [GitHub 源码](https://github.com/justlovemaki/PromptHubExt)
- [Chrome Web Store](https://chromewebstore.google.com/detail/prompthub/agfndihommcfegdgglfgepoeecakllfn)
- [PromptHub 主站](https://prompthub.example.com)
- [API 文档](./api-reference.md)
- [桌面应用](./desktop-app.md)