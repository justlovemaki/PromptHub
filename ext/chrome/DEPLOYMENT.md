# Chrome扩展部署说明

本文档介绍如何将Chrome扩展自动部署到Chrome Web Store。

## 部署流程

1. 当 `ext/chrome/manifest.json` 文件被推送时，GitHub Actions工作流将自动触发
2. 工作流会构建扩展并生成ZIP包
3. 创建GitHub Release并上传扩展包
4. 如果配置了相关密钥，将自动发布到Chrome Web Store

## 配置Chrome Web Store发布

要启用自动发布到Chrome Web Store，需要配置以下环境变量：

### 在GitHub仓库中设置Secrets

在仓库设置页面，转到 `Settings` -> `Secrets and variables` -> `Actions`，添加以下Secrets：

- `CWS_EXTENSION_ID` - Chrome扩展的ID
- `CWS_CLIENT_ID` - Chrome Web Store API客户端ID
- `CWS_CLIENT_SECRET` - Chrome Web Store API客户端密钥
- `CWS_REFRESH_TOKEN` - Chrome Web Store API刷新令牌

### 如何获取Chrome Web Store API凭证

1. 访问 [Google Cloud Console](https://console.cloud.google.com/)
2. 创建一个新项目或选择现有项目
3. 启用Chrome Web Store API
4. 创建凭据（OAuth 2.0客户端ID）
5. 在Chrome开发者仪表板中获取扩展ID

### 手动发布到Chrome Web Store

如果不想使用自动发布功能，可以按照以下步骤手动发布：

1. 运行构建命令：
   ```bash
   cd ext/chrome
   npm install
   npm run build
   ```

2. 将 `ext/chrome/dist` 目录下的内容压缩成ZIP文件

3. 访问 [Chrome开发者仪表板](https://chrome.google.com/webstore/developer/dashboard)

4. 上传ZIP文件并按照提示完成发布

## 工作流文件说明

`.github/workflows/build-chrome-extension.yml` 包含三个主要任务：

1. **build** - 构建Chrome扩展并生成ZIP包
2. **release** - 创建GitHub Release并上传扩展包
3. **publish-to-cws** - 发布到Chrome Web Store（需要配置密钥）

## 版本控制

- 扩展会根据 `manifest.json` 文件中的版本号自动标记
- GitHub Release的标签格式为 `chrome-v{version}`

## 故障排除

### 发布失败

如果自动发布失败，请检查：

1. 确认所有必需的Secrets都已正确配置
2. 检查扩展ZIP包是否符合Chrome Web Store的要求
3. 验证API凭据是否有效且未过期

### 权限问题

确保GitHub Actions有足够的权限来创建Releases：

1. 在仓库设置中，确保Actions有写入权限
2. 在工作流文件中已配置 `permissions: contents: write`