# PromptHub - AI 提示词管理平台

一个现代化、功能完整的 AI 提示词管理平台，基于 Next.js 15 构建。本项目可作为 **MVP 模板项目**快速启动，具备完整的用户认证、数据管理、国际化等基础功能。

## ✨ 核心特性

- 🎯 **提示词管理** - 完整的 CRUD、标签系统、公开分享
- 🌍 **提示词广场** - 浏览社区分享的优质提示词
- 🔐 **认证系统** - Better Auth + OAuth + 邮箱登录
- 🤖 **MCP 集成** - Model Context Protocol 支持
- 🌐 **国际化** - 中文、英文、日文
- 👑 **管理后台** - 用户管理、系统日志
- 🔍 **SEO 优化** - 多语言 SEO、Sitemap
- 🖥️ **桌面应用** - 支持 Windows、macOS、Linux 的原生客户端
- 🧩 **Chrome 扩展** - 浏览器中快速访问和使用提示词

## 🛠 技术栈

- **前端**: Next.js 15 + React 19 + TypeScript + Tailwind CSS
- **后端**: Better Auth + Drizzle ORM
- **数据库**: SQLite / PostgreSQL (Neon/Supabase)
- **UI**: Radix UI + Framer Motion

## 📚 文档

### 入门指南
- [快速开始](./docs/getting-started.md) - 安装、配置、启动
- [核心特性](./docs/features.md) - 功能介绍

### 技术文档
- [技术栈](./docs/tech-stack.md) - 技术选型
- [项目结构](./docs/project-structure.md) - 目录组织
- [数据库架构](./docs/database.md) - 表设计
- [API 接口](./docs/api-reference.md) - REST API

### 客户端应用
- [Chrome 扩展](./docs/chrome-extension.md) - 浏览器扩展安装与使用
- [桌面应用](./docs/desktop-app.md) - Windows、macOS、Linux 客户端

### 集成与部署
- [MCP 集成](./docs/mcp-integration.md) - AI 工具集成
- [部署指南](./docs/deployment.md) - Vercel、Docker
- [开发指南](./docs/development.md) - 开发脚本
- [SEO 配置](./docs/seo.md) - 搜索引擎优化

### 定制指南
- [品牌定制](./docs/customization/branding.md) - Logo、文案
- [主题定制](./docs/customization/theme.md) - 颜色、样式
- [功能扩展](./docs/customization/extending.md) - 添加新功能
- [国际化扩展](./docs/customization/i18n.md) - 添加语言
- [移除提示词功能](./docs/customization/removing-prompts.md) - 改造模板

## 📁 项目结构

```
prompt-manager/
├── src/
│   ├── app/                 # Next.js App Router
│   │   ├── [lang]/         # 多语言页面
│   │   └── api/            # API 路由
│   ├── components/         # React 组件
│   ├── lib/                # 工具库和服务
│   └── i18n/               # 国际化配置
├── packages/               # Monorepo 共享包
│   ├── core-logic/         # 核心逻辑（API客户端、状态管理、类型定义）
│   └── ui-components/      # 共享UI组件
├── public/locales/         # 翻译文件
├── docs/                   # 项目文档
└── drizzle/                # 数据库迁移
```

## 📱 客户端应用

PromptHub 提供多平台客户端，共享核心逻辑和 UI 组件。

**客户端源码**: [GitHub - PromptHubExt](https://github.com/justlovemaki/PromptHubExt)

### 桌面应用

基于 Electron 构建的跨平台桌面客户端：

- **Windows** - 支持 Windows 10 及以上版本
- **macOS** - 支持 macOS 10.15 及以上版本
- **Linux** - 支持主流发行版 (AppImage 格式)

主要功能：
- 离线缓存，无网络时也能访问提示词
- 全局快捷键，随时快速调用
- 系统托盘，后台运行
- 自动更新

### Chrome 扩展

浏览器扩展让您在任何网页上快速使用提示词：

- 一键打开提示词面板
- 快速搜索和筛选
- 右键菜单插入提示词
- 与账户实时同步

**安装地址**: [Chrome Web Store](https://chromewebstore.google.com/detail/prompthub/agfndihommcfegdgglfgepoeecakllfn)

### 共享包架构

客户端应用使用 Monorepo 架构，共享以下包：

```typescript
// @promptmanager/core-logic - 核心逻辑包
import {
  api,                      // API 客户端
  useAuthStore,             // 认证状态管理
  parsePromptVariables,     // 变量解析
  replacePromptVariables    // 变量替换
} from '@promptmanager/core-logic';

// @promptmanager/ui-components - UI 组件包
import {
  Button, Card, Input,      // 基础组件
  Modal, Sheet,             // 交互组件
  DataTable, SearchToolbar  // 业务组件
} from '@promptmanager/ui-components';
```

## 🔗 相关资源

- [客户端源码 (Chrome 扩展 & 桌面应用)](https://github.com/justlovemaki/PromptHubExt)
- [Next.js 文档](https://nextjs.org/docs)
- [Better Auth 文档](https://www.better-auth.com/docs)
- [Drizzle ORM 文档](https://orm.drizzle.team/docs/overview)
- [MCP 协议规范](https://modelcontextprotocol.io/)

## 📄 许可证

MIT License

---

**⭐ 如果这个项目对你有帮助，请给个 Star！**