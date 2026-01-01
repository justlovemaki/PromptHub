# 桌面应用

PromptHub 桌面应用提供原生的跨平台体验，让您可以在 Windows、macOS 和 Linux 上高效管理提示词。

**源码地址**: [GitHub - PromptHubExt](https://github.com/justlovemaki/PromptHubExt)

## ✨ 功能特性

- 🖥️ **原生体验** - 基于 Electron 构建，提供流畅的桌面体验
- 🔄 **离线支持** - 本地缓存，无网络时也能访问提示词
- ⌨️ **全局快捷键** - 随时随地快速调用
- 🔔 **系统通知** - 重要更新即时提醒
- 🌐 **多语言支持** - 支持中文、英文、日文界面
- 🔐 **安全存储** - 本地加密存储敏感数据

## 📥 下载安装

### Windows

**系统要求**: Windows 10 或更高版本

1. 下载 `.exe` 安装包
2. 双击运行安装程序
3. 按照安装向导完成安装
4. 从开始菜单或桌面快捷方式启动应用

**下载链接**: [PromptHub.Desktop.Setup.exe](https://prompt.hubtoday.app/download)

### macOS

**系统要求**: macOS 10.15 (Catalina) 或更高版本

1. 下载 `.dmg` 安装包
2. 双击打开 DMG 文件
3. 将 PromptHub 拖入 Applications 文件夹
4. 从 Launchpad 或 Applications 启动应用

**首次运行**: 如果提示"无法验证开发者"，请在系统偏好设置 > 安全性与隐私中允许运行。

**下载链接**: [PromptHub.Desktop.dmg](https://source.hubtoday.app/prompt-app/)

### Linux

**系统要求**: 支持主流 Linux 发行版 (Ubuntu 18.04+, Fedora 32+, Debian 10+)

1. 下载 `.AppImage` 文件
2. 添加执行权限: `chmod +x PromptHub.Desktop.AppImage`
3. 双击运行或从终端执行

**下载链接**: [PromptHub.Desktop.AppImage](https://source.hubtoday.app/prompt-app/)

## 🔧 配置

### 首次设置

1. 启动应用后，点击 **登录** 按钮
2. 输入您的 PromptHub 账户凭据
3. 登录成功后，提示词将自动同步到本地

### 自定义服务器

如果您使用自托管的 PromptHub 实例：

1. 打开 **设置** > **服务器配置**
2. 输入您的服务器地址
3. 点击 **保存** 并重新登录

### 快捷键设置

1. 打开 **设置** > **快捷键**
2. 点击要修改的快捷键
3. 按下新的组合键
4. 点击 **保存**

## 📖 使用指南

### 主界面

| 区域 | 功能 |
|------|------|
| 侧边栏 | 导航、标签筛选、空间切换 |
| 主内容区 | 提示词列表、搜索、排序 |
| 详情面板 | 查看和编辑提示词详情 |

### 快捷键

桌面应用支持自定义快捷键，您可以在设置中查看和修改：

1. 打开 **设置** > **快捷键**
2. 查看当前快捷键配置
3. 点击要修改的快捷键，按下新的组合键
4. 点击 **保存**

常用功能包括：
- 新建提示词
- 搜索提示词
- 复制提示词
- 全局唤醒（可自定义）

### 提示词管理

#### 创建提示词

1. 点击 **+** 按钮或使用快捷键
2. 填写标题、内容、描述
3. 添加标签（可选）
4. 选择是否公开
5. 点击 **保存**

#### 编辑提示词

1. 双击提示词卡片或点击编辑图标
2. 修改内容
3. 点击 **保存**

#### 使用变量

提示词支持变量语法 `{{变量名}}`：

```
请帮我写一篇关于 {{主题}} 的文章，
字数约 {{字数}} 字，
风格要求：{{风格}}
```

使用时会弹出变量填写对话框。

### 导入导出

#### 导出提示词

1. 打开 **文件** > **导出**
2. 选择导出格式 (JSON)
3. 选择保存位置
4. 点击 **导出**

#### 导入提示词

1. 打开 **文件** > **导入**
2. 选择要导入的文件
3. 确认导入选项
4. 点击 **导入**

## 🏗️ 技术架构

桌面应用基于 Electron 构建，使用以下共享包：

### @promptmanager/core-logic

核心逻辑包提供：

- **API 客户端** - 与 PromptHub 服务器通信
- **状态管理** - 使用 Zustand 管理应用状态
- **类型定义** - TypeScript 类型和验证
- **工具函数** - 提示词解析、变量替换等

```typescript
import { 
  api, 
  useAuthStore, 
  parsePromptVariables,
  replacePromptVariables 
} from '@promptmanager/core-logic';

// 解析提示词变量
const variables = parsePromptVariables(prompt.content);
// ['主题', '字数', '风格']

// 替换变量
const result = replacePromptVariables(prompt.content, {
  '主题': 'AI',
  '字数': '1000',
  '风格': '专业'
});
```

### @promptmanager/ui-components

共享 UI 组件包提供跨平台一致的界面组件：

- **基础组件** - Button、Card、Input、Textarea
- **交互组件** - Modal、Sheet、Loading
- **业务组件** - DataTable、SearchToolbar

## 🔐 安全性

### 数据存储

- 用户凭据使用系统密钥链加密存储
- 本地缓存数据加密保存
- 敏感信息不会明文存储

### 网络通信

- 所有 API 请求使用 HTTPS
- 支持 Token 自动刷新
- 会话超时自动登出

## 🔄 自动更新

桌面应用支持自动更新：

1. 应用启动时检查更新
2. 发现新版本时提示下载
3. 下载完成后提示重启安装

### 手动检查更新

1. 打开 **帮助** > **检查更新**
2. 如有新版本，点击 **下载**
3. 下载完成后点击 **安装并重启**

## ❓ 常见问题

### 应用无法启动

**Windows**:
1. 确保已安装 Visual C++ Redistributable
2. 尝试以管理员身份运行
3. 检查防火墙设置

**macOS**:
1. 在系统偏好设置中允许运行
2. 尝试从终端启动查看错误信息

**Linux**:
1. 确保有执行权限
2. 安装必要的依赖库

### 同步失败

1. 检查网络连接
2. 确认服务器地址正确
3. 尝试重新登录
4. 查看日志文件排查问题

### 快捷键冲突

1. 打开设置修改快捷键
2. 避免与系统或其他应用冲突
3. 重启应用使更改生效

### 数据丢失

1. 检查本地缓存目录
2. 尝试从服务器重新同步
3. 联系支持获取帮助

## 📁 数据目录

| 平台 | 路径 |
|------|------|
| Windows | `%APPDATA%\PromptHub` |
| macOS | `~/Library/Application Support/PromptHub` |
| Linux | `~/.config/PromptHub` |

## 🔗 相关链接

- [GitHub 源码](https://github.com/justlovemaki/PromptHubExt)
- [下载页面](https://prompthub.example.com/download)
- [Chrome 扩展](./chrome-extension.md)
- [API 文档](./api-reference.md)
- [MCP 集成](./mcp-integration.md)