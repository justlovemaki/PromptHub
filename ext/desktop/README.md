# PromptHub Desktop

AI 提示词管理平台桌面端应用，基于 Electron + React + TypeScript 构建。

## 技术栈

- **Electron**: 31.x - 跨平台桌面应用框架
- **React**: 18.x - UI 框架
- **TypeScript**: 5.x - 类型安全的 JavaScript
- **Electron-Vite**: 2.x - 快速的 Electron 构建工具
- **Vite**: 5.x - 下一代前端构建工具

## 项目结构

```
ext/desktop/
├── src/
│   ├── main/              # 主进程代码
│   │   ├── index.ts       # 主进程入口
│   │   ├── config.ts      # 配置管理
│   │   └── i18n.ts        # 国际化支持
│   ├── preload/           # 预加载脚本
│   │   └── index.ts       # 安全的 IPC 桥接
│   └── renderer/          # 渲染进程代码
│       ├── index.html     # HTML 入口
│       ├── public/        # 静态资源
│       └── src/
│           ├── main.tsx   # React 入口
│           ├── App.tsx    # 主应用组件
│           ├── components/ # React 组件
│           ├── types/     # TypeScript 类型
│           └── utils/     # 工具函数
├── resources/             # 打包资源使用简体中文输出
│   ├── icon.png          # 应用图标
│   ├── _locales/         # 多语言文件
│   └── build/            # 构建配置
└── out/                   # 构建输出
```

## 快速开始

### 安装依赖

```bash
npm install
```

### 开发模式

```bash
npm run dev
```

这将启动开发服务器，支持热模块替换（HMR），无需重启应用即可看到代码更改。

### 构建应用

```bash
# 构建所有平台
npm run build

# 构建 Windows 安装包
npm run build:win

# 构建 macOS 安装包
npm run build:mac

# 构建 Linux 安装包
npm run build:linux
```

## 功能特性

### 核心功能
- ✅ 全局快捷键（Ctrl/Cmd + Shift + P）唤醒命令面板
- ✅ 提示词搜索和筛选
- ✅ 标签分类管理
- ✅ 一键复制提示词到活动窗口
- ✅ 支持提示词变量替换
- ✅ 多语言支持（中文、英文、日文）

### UI/UX
- ✅ 无边框窗口设计
- ✅ 可拖动标题栏
- ✅ 窗口置顶功能
- ✅ 失焦自动隐藏
- ✅ 系统托盘图标

### 安全性
- ✅ Context Isolation（上下文隔离）
- ✅ 禁用 Node Integration
- ✅ 安全的 IPC 通信
- ✅ Token 加密存储

## 配置说明

### 环境变量

**开发环境** (`.env.development`):
```env
NODE_ENV=development
ELECTRON_ENV=development
DEV_API_BASE_URL=http://localhost:3000
```

**生产环境** (`.env.production`):
```env
NODE_ENV=production
ELECTRON_ENV=production
PROD_API_BASE_URL=https://prompt.hubtoday.app
```

### 构建配置

主要配置文件：
- `electron.vite.config.ts` - Electron-Vite 构建配置
- `electron-builder.config.js` - 应用打包配置
- `tsconfig.json` - TypeScript 主配置
- `tsconfig.node.json` - Node 环境配置
- `tsconfig.web.json` - Web 环境配置

## API 通信

### CORS 问题解决方案

在 Electron 渲染进程中直接使用 `fetch` 调用外部 API 会遇到 CORS 错误。本项目通过主进程代理所有 API 请求来解决这个问题：

```typescript
import { fetchProxy } from './utils/api';

// 使用 fetchProxy 替代 fetch
const response = await fetchProxy('https://api.example.com/data', {
  method: 'GET',
  headers: {
    'Authorization': 'Token xxx',
    'Content-Type': 'application/json'
  }
});

const data = await response.json();
```

### IPC 通信示例

**渲染进程发送消息到主进程:**
```typescript
const { ipcRenderer } = (window as any).electron;
ipcRenderer.send('hide-window');
```

**渲染进程调用主进程方法:**
```typescript
const token = await ipcRenderer.invoke('get-auth-token');
await ipcRenderer.invoke('set-auth-token', newToken);
```

**打开外部链接:**
```typescript
const { shell } = (window as any).electron;
await shell.openExternal('https://example.com');
```

**API 请求代理:**
```typescript
const { api } = (window as any).electron;
const result = await api.request({
  url: 'https://api.example.com/data',
  method: 'GET',
  headers: { 'Authorization': 'Token xxx' }
});
```

## 开发指南

### 添加新的 IPC 通道

1. **在主进程中注册处理器** (`src/main/index.ts`):
```typescript
ipcMain.handle('my-channel', async (event, arg) => {
  // 处理逻辑
  return result;
});
```

2. **在 preload 中暴露方法** (`src/preload/index.ts`):
```typescript
contextBridge.exposeInMainWorld('electron', {
  myMethod: (arg) => ipcRenderer.invoke('my-channel', arg)
});
```

3. **在渲染进程中使用**:
```typescript
const result = await (window as any).electron.myMethod(arg);
```

### 添加新组件

在 `src/renderer/src/components/` 目录下创建新组件，然后在 `components/ui.ts` 中导出。

### 添加新的工具函数

在 `src/renderer/src/utils/` 目录下创建新的工具文件。

## 常见问题

### Q: 为什么要迁移到 electron-vite?
A: electron-vite 提供了更快的开发体验（HMR）、更好的构建性能，以及更现代化的开发工作流。

### Q: 旧的文件可以删除吗?
A: 在充分测试新系统后，可以安全删除根目录下的旧文件（main.ts, renderer.js, Palette.tsx 等）。

### Q: 如何添加新的依赖?
A: 使用 `npm install <package-name>` 安装。注意区分主进程依赖和渲染进程依赖。

## 许可证

MIT

## 支持

如有问题，请查看 [MIGRATION.md](./MIGRATION.md) 了解迁移详情。