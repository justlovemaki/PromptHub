# AI 提示词管理器浏览器扩展

这是一个 Chrome 浏览器扩展，作为 AI 提示词管理平台在浏览器端的延伸。

## 功能特性

### 侧边栏界面
- **提示词浏览**: 以卡片形式展示所有提示词，包括标题、描述和标签
- **智能搜索**: 支持按标题、内容搜索提示词
- **标签过滤**: 通过标签分类筛选提示词
- **变量支持**: 自动识别和处理提示词中的变量（如 `{{variable}}`），支持实时预览
- **用户统计**: 显示订阅状态、AI积分、提示词数量等统计信息
- **无限滚动**: 支持分页加载更多提示词

### 快速操作
- **一键使用**: 点击"使用"按钮，自动将提示词内容填充到当前页面的输入框中
- **便捷复制**: 一键复制提示词到剪贴板
- **快速编辑**: 点击"编辑"按钮跳转到Web应用中编辑提示词
- **变量处理**: 自动识别提示词中的变量并提供输入界面

### 快捷方式
- **右键菜单**: 选中文本后右键选择"快速导入为提示词"
- **快捷键**: 
  - `Alt+O` - 打开/关闭侧边栏
  - `Alt+P` - 快速保存选中文本为提示词

### 认证与同步
- **自动认证**: 从Web应用自动获取认证token
- **状态同步**: 与主应用同步认证状态和用户信息
- **使用统计**: 自动增加提示词使用次数

## 安装与使用

### 开发模式安装

1. **构建项目**:
```bash
cd ext/chrome
npm install
npm run build
```

2. **加载扩展到Chrome**:
   - 打开 Chrome，访问 `chrome://extensions/`
   - 启用"开发者模式"
   - 点击"加载已解压的扩展程序"
   - 选择 `ext/chrome/dist` 目录

3. **配置API端点** (可选):
   - 默认情况下，扩展会尝试连接到 `http://localhost:3000`
   - 如需自定义，请在浏览器中打开Web应用并完成登录以同步认证信息

4. **登录扩展**:
   - 首次使用时，点击扩展图标
   - 点击"Open Web App"按钮登录Web应用
   - 登录成功后，扩展将自动获取认证信息

### 生产模式安装

1. **打包扩展**:
```bash
cd ext/chrome
npm install
npm run build
```

2. **生成zip包**:
```bash
cd ext/chrome/dist
# 将 dist 目录内容压缩为 zip 文件用于发布
```

## 配置

### API 端点配置

扩展使用以下API端点（可在 `src/config.ts` 中修改）：

- `PROMPTS_LIST`: `/api/prompts/list` - 获取提示词列表
- `PROMPTS_CREATE`: `/api/prompts/create` - 创建提示词
- `PROMPTS_UPDATE`: `/api/prompts/update` - 更新提示词
- `PROMPTS_DELETE`: `/api/prompts/delete` - 删除提示词
- `PROMPTS_USE`: `/api/prompts/use` - 增加提示词使用次数
- `PROMPTS_TAGS`: `/api/prompts/tags` - 获取提示词标签
- `USER_STATS`: `/api/dashboard/stats` - 获取用户统计信息
- `USER_INFO`: `/api/auth/me` - 获取用户信息

### Web 应用基础URL

默认配置为 `http://localhost:3000`，您可以通过修改 `src/config.ts` 中的 `WEB_APP_BASE_URL` 来更改此设置。

## 技术架构

### 核心组件
- **Manifest V3**: 使用最新的Chrome扩展规范
- **React 18**: 构建用户界面
- **TypeScript**: 提供类型安全
- **Tailwind CSS**: 样式设计
- **Chrome APIs**: 
  - `chrome.storage` - 存储认证信息
  - `chrome.runtime` - 与后台脚本通信
  - `chrome.contextMenus` - 右键菜单功能
  - `chrome.commands` - 快捷键支持
  - `chrome.sidePanel` - 侧边栏界面
  - `chrome.notifications` - 通知功能
  - `chrome.scripting` - 内容注入功能

### 后台服务工作线程 (background.js)
- 管理认证token
- 处理API请求
- 管理右键菜单和快捷键
- 检测快捷键冲突
- 与内容脚本和侧边栏通信

### 内容脚本 (content.js)
- 与网页交互
- 处理页面元素填充
- 获取选中文本

### 侧边栏应用 (SidePanelApp.tsx)
- 展示提示词列表
- 提供搜索和过滤功能
- 支持变量处理和实时预览
- 显示用户统计信息

## 国际化 (i18n)

扩展支持多语言，当前包含:
- 简体中文 (zh_CN)
- 英语 (en)
- 日语 (ja)

语言文件位于 `public/_locales/` 目录中，系统会根据浏览器语言自动选择合适的语言包。

## 开发指南

### 项目结构

```
ext/chrome/
├── background.js          # 后台服务工作线程
├── content.js             # 内容脚本
├── sidepanel.html         # 侧边栏入口HTML
├── manifest.json          # 扩展配置文件
├── public/                # 静态资源
│   └── _locales/          # 多语言资源
│       ├── en/
│       ├── zh_CN/
│       └── ja/
├── src/                   # 源代码
│   ├── config.ts          # 项目配置
│   ├── types.ts           # TypeScript类型定义
│   ├── main.tsx           # 侧边栏应用入口
│   ├── assets/            # 样式和其他资源
│   ├── components/        # React组件
│   │   ├── SidePanelApp.tsx  # 主应用组件
│   │   ├── PromptCard.tsx # 提示词卡片组件
│   │   ├── ui.ts          # UI组件导出
│   │   └── ...            # 其他UI组件
│   ├── utils/             # 工具函数
│   │   ├── api.ts         # API请求工具
│   │   ├── tags.ts        # 标签处理工具
│   │   ├── helpers.ts     # 通用工具函数
│   │   └── cn.ts          # Tailwind CSS工具
└── ...
```

### 本地开发

1. **安装依赖**:
```bash
npm install
```

2. **启动开发服务器**:
```bash
npm run dev
```

3. **构建生产版本**:
```bash
npm run build
```

## 安全说明

- 认证token仅存储在用户本地，不会发送到任何第三方服务
- 所有API请求都通过后台服务工作线程进行，确保安全性
- 扩展仅请求必要的权限，包括 `<all_urls>` 以支持提示词填充功能

## 故障排除

- **无法获取认证token**: 确保已登录Web应用，并且API服务正在运行
- **提示词无法填充**: 某些网站可能限制扩展访问，尝试手动复制粘贴
- **快捷键冲突**: 在Chrome扩展设置中修改快捷键
- **侧边栏无法打开**: 确保浏览器支持侧边栏功能

如遇到其他问题，请检查浏览器控制台中的错误信息。

## 许可证

本项目遵循与主项目相同的许可证。