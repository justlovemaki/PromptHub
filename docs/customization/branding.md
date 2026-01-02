# 品牌定制

本文档介绍如何定制 PromptHub 的品牌元素。

## 🎨 Logo 和图标

### 文件位置

```
public/
├── logo.png          # 主 Logo（建议 512x512）
├── logo.ico          # 网站图标
└── 1.png, 2.png...   # 功能截图（用于落地页）
```

### 替换 Logo

1. 准备你的 Logo 图片（建议 512x512 PNG 格式）
2. 替换 `public/logo.png`
3. 生成 favicon 并替换 `public/logo.ico`

### 推荐工具

- [Favicon Generator](https://favicon.io/) - 生成多尺寸 favicon
- [Real Favicon Generator](https://realfavicongenerator.net/) - 生成完整的 favicon 套件

## 📝 站点信息

### SEO 元数据

SEO 配置通过多语言翻译文件管理，编辑各语言目录下的 [`public/locales/*/layout.json`](../../public/locales/zh-CN/layout.json)：

**中文配置示例** (`public/locales/zh-CN/layout.json`)：

```json
{
  "title": "你的站点标题 - 副标题",
  "description": "你的站点描述...",
  "seo": {
    "siteName": "你的站点名称",
    "siteDescription": "你的站点描述...",
    "siteKeywords": "关键词1, 关键词2, 关键词3",
    "siteUrl": "",
    "ogImage": "/og-image.png",
    "twitterHandle": "@yourhandle",
    "twitterCard": "summary_large_image"
  }
}
```

**英文配置示例** (`public/locales/en/layout.json`)：

```json
{
  "title": "Your Site Title - Subtitle",
  "description": "Your site description...",
  "seo": {
    "siteName": "Your Site Name",
    "siteDescription": "Your site description...",
    "siteKeywords": "keyword1, keyword2, keyword3",
    "siteUrl": "",
    "ogImage": "/og-image.png",
    "twitterHandle": "@yourhandle",
    "twitterCard": "summary_large_image"
  }
}
```

> **注意**：`siteUrl` 留空时会自动使用环境变量 `BETTER_AUTH_URL` 或 `NEXT_PUBLIC_BASE_URL` 的值。

### package.json

更新 [`package.json`](../../package.json) 中的项目信息：

```json
{
  "name": "your-project-name",
  "description": "你的项目描述",
  "author": "你的名字",
  "homepage": "https://your-domain.com",
  "repository": {
    "type": "git",
    "url": "https://github.com/your-username/your-repo"
  }
}
```

## 🌍 多语言文案

### 翻译文件位置

```
public/locales/
├── zh-CN/           # 简体中文
│   ├── common.json  # 通用文案
│   ├── home.json    # 首页文案
│   ├── landing.json # 落地页文案
│   ├── dashboard.json
│   ├── explore.json
│   ├── prompt.json
│   ├── admin.json
│   ├── account.json
│   └── ...
├── en/              # 英文
└── ja/              # 日文
```

### 文案结构示例

**common.json** - 通用文案：

```json
{
  "appName": "PromptHub",
  "loading": "加载中...",
  "error": "出错了",
  "success": "成功",
  "cancel": "取消",
  "confirm": "确认",
  "save": "保存",
  "delete": "删除",
  "edit": "编辑",
  "search": "搜索",
  "noData": "暂无数据"
}
```

**landing.json** - 落地页文案：

```json
{
  "hero": {
    "title": "AI 提示词管理平台",
    "subtitle": "高效管理和分享你的 AI 提示词",
    "cta": "立即开始"
  },
  "features": {
    "title": "核心特性",
    "feature1": {
      "title": "智能管理",
      "description": "轻松创建、编辑和组织你的提示词"
    }
  }
}
```

### 修改文案

1. 找到对应的翻译文件
2. 修改 JSON 中的文案
3. 确保所有语言版本都更新

### 添加新文案

1. 在所有语言的对应文件中添加相同的 key
2. 在代码中使用 `t('namespace:key')` 引用

```tsx
import { useTranslation } from '@/i18n/client';

function MyComponent() {
  const { t } = useTranslation('common');
  
  return <h1>{t('appName')}</h1>;
}
```

## 🖼️ 落地页截图

### 替换功能截图

落地页展示的功能截图位于：

```
public/
├── 1.png    # 第一张截图
├── 2.png    # 第二张截图
└── 3.png    # 第三张截图
```

### 截图建议

- 尺寸：1280x720 或 1920x1080
- 格式：PNG 或 WebP
- 内容：展示产品核心功能

## 📧 联系信息

### 页脚链接

编辑 [`src/components/layout/Footer.tsx`](../../src/components/layout/Footer.tsx) 修改页脚链接：

```tsx
const footerLinks = {
  social: [
    { name: 'GitHub', href: 'https://github.com/your-username' },
    { name: 'Twitter', href: 'https://twitter.com/yourhandle' },
  ],
  legal: [
    { name: 'privacy', href: '/privacy' },
    { name: 'terms', href: '/terms' },
  ],
};
```

### 联系页面

编辑 [`public/locales/*/contact.json`](../../public/locales/zh-CN/contact.json) 修改联系信息：

```json
{
  "title": "联系我们",
  "email": "contact@your-domain.com",
  "address": "你的地址"
}
```

## 🔗 社交媒体

### Open Graph 图片

创建 Open Graph 图片用于社交媒体分享：

1. 创建 1200x630 的图片
2. 保存为 `public/og-image.png`
3. 在 SEO 配置中引用

### Twitter Card

配置 Twitter 分享卡片：

```typescript
// seo-settings-service.ts
{
  twitterHandle: '@yourhandle',
  twitterCard: 'summary_large_image'
}
```

## ✅ 品牌定制检查清单

- [ ] 替换 Logo 图片
- [ ] 更新 favicon
- [ ] 修改 SEO 元数据
- [ ] 更新 package.json 信息
- [ ] 修改所有语言的翻译文案
- [ ] 替换落地页截图
- [ ] 更新联系信息
- [ ] 创建 Open Graph 图片
- [ ] 配置社交媒体链接

## 下一步

- 了解 [主题定制](./theme.md)
- 阅读 [功能扩展](./extending.md)
- 查看 [国际化扩展](./i18n.md)