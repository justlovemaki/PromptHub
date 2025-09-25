# AI Prompt Manager Chrome Extension

这是一个功能强大、体验无缝的 AI 提示词管理平台 Chrome 浏览器插件，允许用户在浏览器中快速访问、使用和管理 AI 提示词。

## 功能特性

- **侧边栏 UI**: 通过 Alt+P 快捷键或点击插件图标打开侧边栏，显示用户的所有提示词
- **快速导入**: 右键菜单选项，可将选中的文本快速导入为提示词
- **变量支持**: 支持包含 `{{variable}}` 变量的提示词，使用时会弹出表单供用户填写
- **国际化**: 支持中文和英文界面
- **用户信息**: 显示订阅状态、AI 点数、提示词总数等统计信息
- **搜索功能**: 支持按标题和内容搜索提示词

## 技术架构

- **核心框架**: React 18, TypeScript
- **构建工具**: Vite
- **UI库**: Tailwind CSS, 自定义组件库
- **状态管理**: React 内置状态管理
- **国际化**: i18next
- **API交互**: 自定义 API 客户端

## 项目结构

```
ext/chrome/
├── manifest.json           # Chrome 扩展配置文件
├── background.js          # 后台服务工作线程
├── content.js             # 内容脚本
├── sidepanel.html         # 侧边栏入口 HTML
├── _locales/              # 国际化资源
│   ├── en/
│   │   └── messages.json
│   └── zh_CN/
│       └── messages.json
├── icons/                 # 插件图标
├── src/                   # 源代码
│   ├── components/        # React 组件
│   ├── pages/            # 页面组件
│   ├── utils/            # 工具函数
│   ├── types/            # TypeScript 类型定义
│   └── assets/           # 静态资源
├── package.json          # 项目依赖
├── vite.config.ts        # Vite 构建配置
├── tsconfig.json         # TypeScript 配置
├── tailwind.config.js    # Tailwind CSS 配置
└── postcss.config.js     # PostCSS 配置
```

## 核心功能实现

### Background Service Worker (background.js)
- 管理用户认证 Token
- 处理右键菜单创建和点击事件
- 处理快捷键命令 (Alt+P)
- 与内容脚本和侧边栏通信

### 侧边栏 UI (SidePanelApp.tsx)
- 显示用户头像和姓名
- 展示订阅状态、AI 点数等统计信息
- 提供搜索和筛选功能
- 列出所有提示词并提供使用、复制、编辑按钮

### 提示词卡片 (PromptCard.tsx)
- 显示提示词标题和内容摘要
- 检测提示词中的变量并提供填充界面
- 提供使用、复制、编辑操作按钮

## API 集成

扩展通过后台服务工作线程与后端 API 通信，实现以下功能：
- 获取用户信息和统计
- 获取提示词列表
- 创建新提示词（快速导入）
- 处理认证和 Token 管理

## 国际化支持

插件支持中文和英文界面，通过 i18next 实现动态语言切换。

## 安装和使用

### 开发模式安装

1. 安装依赖：
```bash
npm install
```

2. 构建项目：
```bash
npm run build
```

3. 在 Chrome 中加载扩展：
   - 打开 `chrome://extensions/`
   - 启用"开发者模式"
   - 点击"加载已解压的扩展程序"
   - 选择 `ext/chrome/dist` 目录（构建后的输出目录）

### 生产模式构建

1. 安装依赖：
```bash
npm install
```

2. 构建项目：
```bash
npm run build
```

构建后的文件将生成在 `dist` 目录中，可以打包为 `.zip` 文件发布到 Chrome 网上应用店。

## 使用说明

### 快捷键操作
- 按 `Alt+P` (或 `Option+P` on Mac) 快速打开/关闭侧边栏

### 右键菜单功能
- 选中网页上的文本，右键点击选择"快速导入为提示词"
- 提示词将自动保存到您的账户中

### 侧边栏功能
1. **用户信息区域**：
   - 点击用户头像可切换语言或登出
   - 查看订阅状态和 AI 点数

2. **提示词管理**：
   - 使用搜索框按标题或内容搜索提示词
   - 点击"使用"按钮复制提示词到剪贴板（如有变量会先弹出填写框）
   - 点击"复制"按钮直接复制原始内容
   - 点击"编辑"按钮在 Web 应用中编辑提示词

### 变量提示词
- 包含 `{{variable}}` 格式变量的提示词在使用时会弹出输入框
- 填写变量值后，完整的提示词将复制到剪贴板

### 注意事项
- 侧边栏功能需要在支持 Chrome Side Panel API 的 Chrome 版本中使用 (Chrome 114+)
- 首次安装后可能需要重启浏览器以完全启用侧边栏功能
- 插件需要登录 Web 应用后才能同步提示词数据

## 安全性

- 所有认证 Token 都安全地存储在浏览器存储中
- API 请求通过后台服务工作线程进行，避免在内容脚本中暴露敏感信息
- 使用 HTTPS 进行所有 API 通信