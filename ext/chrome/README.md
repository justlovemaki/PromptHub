# AI 提示词管理器浏览器扩展

这是一个 Chrome 浏览器扩展，作为 AI 提示词管理平台在浏览器端的延伸。

## 配置

此扩展支持通过环境变量进行配置。您可以通过以下方式设置：

### 环境变量配置

- `API_BASE_URL`: API 服务的基础 URL (默认: `http://localhost:3000/api`)
- `WEB_APP_BASE_URL`: Web 应用的基础 URL (默认: `http://localhost:3000`)

### 开发环境配置

1. 在项目根目录创建 `.env` 文件，或在 `ext/chrome` 目录创建 `.env` 文件
2. 添加以下内容：
```
API_BASE_URL=http://localhost:3000/api
WEB_APP_BASE_URL=http://localhost:3000
```

### 构建

```bash
cd ext/chrome
npm install
npm run build
```

### 开发模式

```bash
cd ext/chrome
npm install
npm run dev
```

## 功能

- 快速导入网页选中的文本作为提示词
- 通过右键菜单访问
- 通过快捷键访问
- 侧边栏界面管理提示词
- 与主应用同步认证状态