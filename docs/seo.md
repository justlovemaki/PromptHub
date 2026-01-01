# SEO 配置

本文档介绍 PromptHub 的搜索引擎优化配置。

## 🔍 SEO 特性

- **动态元数据**: 基于页面内容自动生成 title、description
- **Open Graph**: 完整的社交媒体分享卡片支持
- **Twitter Card**: Twitter 分享优化
- **多语言 SEO**: 每种语言独立的 SEO 配置
- **Sitemap 生成**: 自动生成多语言站点地图
- **robots.txt**: 搜索引擎爬虫配置
- **Canonical URL**: 规范链接，避免重复内容
- **结构化数据**: 支持搜索引擎富文本展示

## ⚙️ 多语言 SEO 设置

### 配置方式

SEO 配置通过 i18n 翻译文件管理，每种语言的配置位于 `public/locales/{lang}/layout.json`。

服务层 [`src/lib/services/settings/seo-settings-service.ts`](../src/lib/services/settings/seo-settings-service.ts) 会自动从翻译文件中读取 SEO 配置。

### 配置示例

**中文配置 (`public/locales/zh-CN/layout.json`)：**

```json
{
  "title": "PromptHub - AI提示词管理平台",
  "description": "PromptHub提供专业的AI提示词管理工具，海量模板库助您高效创作，提升AI工作流效率。",
  "seo": {
    "siteName": "PromptHub",
    "siteDescription": "PromptHub提供专业的AI提示词管理工具，海量模板库助您高效创作，提升AI工作流效率。",
    "siteKeywords": "AI提示词, ChatGPT提示词, Claude提示词, 提示词管理, 提示词模板, AI工作流",
    "siteUrl": "",
    "ogImage": "/logo.png",
    "twitterHandle": "@prompthub",
    "twitterCard": "summary_large_image"
  }
}
```

**英文配置 (`public/locales/en/layout.json`)：**

```json
{
  "title": "PromptHub - AI Prompt Management Platform",
  "description": "Professional AI prompt management tool with rich template library to boost your AI workflow efficiency.",
  "seo": {
    "siteName": "PromptHub",
    "siteDescription": "Professional AI prompt management tool with rich template library to boost your AI workflow efficiency.",
    "siteKeywords": "AI prompt, ChatGPT prompts, Claude prompts, prompt manager, prompt template, AI workflow",
    "siteUrl": "",
    "ogImage": "/logo.png",
    "twitterHandle": "@prompthub",
    "twitterCard": "summary_large_image"
  }
}
```

> **注意**: `siteUrl` 字段留空时，系统会自动使用环境变量 `BETTER_AUTH_URL` 或 `NEXT_PUBLIC_BASE_URL` 的值。

### 配置字段说明

| 字段 | 说明 |
|------|------|
| `siteTitle` | 网站标题，显示在浏览器标签 |
| `siteName` | 网站名称，用于 Open Graph |
| `siteDescription` | 网站描述，用于搜索结果 |
| `siteKeywords` | 关键词，逗号分隔 |
| `siteUrl` | 网站 URL |
| `ogImage` | Open Graph 图片路径 |
| `twitterHandle` | Twitter 账号 |
| `twitterCard` | Twitter 卡片类型 |

## 🗺️ Sitemap 生成

### 自动生成

构建时自动生成 Sitemap：

```bash
pnpm build
```

### 手动生成

```bash
node scripts/generate-sitemap.js
```

### 生成的文件

```
public/
├── sitemap.xml          # 主站点地图（索引）
├── sitemap-zh-CN.xml    # 中文站点地图
├── sitemap-en.xml       # 英文站点地图
├── sitemap-ja.xml       # 日文站点地图
└── robots.txt           # 爬虫配置
```

### Sitemap 配置

编辑 [`next-sitemap.config.js`](../next-sitemap.config.js)：

```javascript
module.exports = {
  siteUrl: process.env.SITE_URL || 'https://your-domain.com',
  generateRobotsTxt: true,
  exclude: ['/admin/*', '/api/*'],
  alternateRefs: [
    { href: 'https://your-domain.com/zh-CN', hreflang: 'zh-CN' },
    { href: 'https://your-domain.com/en', hreflang: 'en' },
    { href: 'https://your-domain.com/ja', hreflang: 'ja' },
  ],
};
```

## 🤖 robots.txt

默认配置：

```txt
User-agent: *
Allow: /

Sitemap: https://your-domain.com/sitemap.xml
```

### 自定义 robots.txt

编辑 [`public/robots.txt`](../public/robots.txt) 或通过 next-sitemap 配置生成。

## 📊 网站分析

### Umami 分析

PromptHub 支持 [Umami](https://umami.is/) 隐私友好型分析。

#### 配置

在环境变量中设置：

```env
NEXT_PUBLIC_UMAMI_WEBSITE_ID=your-umami-website-id
```

#### 特点

- 隐私友好，不使用 Cookie
- 轻量级，不影响页面性能
- 开源自托管选项
- GDPR 合规

### Google Analytics（可选）

如需使用 Google Analytics，可以添加到 [`src/app/[lang]/layout.tsx`](../src/app/[lang]/layout.tsx)：

```tsx
import Script from 'next/script';

// 在 layout 中添加
<Script
  src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_ID}`}
  strategy="afterInteractive"
/>
<Script id="google-analytics" strategy="afterInteractive">
  {`
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', '${process.env.NEXT_PUBLIC_GA_ID}');
  `}
</Script>
```

## 🔗 页面元数据

### 动态元数据

每个页面可以定义自己的元数据：

```typescript
// src/app/[lang]/page.tsx
import { Metadata } from 'next';

export async function generateMetadata({
  params: { lang }
}: {
  params: { lang: string }
}): Promise<Metadata> {
  const seoConfig = await getSeoConfig(lang);
  
  return {
    title: seoConfig.siteTitle,
    description: seoConfig.siteDescription,
    keywords: seoConfig.siteKeywords,
    openGraph: {
      title: seoConfig.siteTitle,
      description: seoConfig.siteDescription,
      url: seoConfig.siteUrl,
      siteName: seoConfig.siteName,
      images: [seoConfig.ogImage],
      locale: lang,
      type: 'website',
    },
    twitter: {
      card: seoConfig.twitterCard,
      title: seoConfig.siteTitle,
      description: seoConfig.siteDescription,
      creator: seoConfig.twitterHandle,
    },
    alternates: {
      canonical: `${seoConfig.siteUrl}/${lang}`,
      languages: {
        'zh-CN': `${seoConfig.siteUrl}/zh-CN`,
        'en': `${seoConfig.siteUrl}/en`,
        'ja': `${seoConfig.siteUrl}/ja`,
      },
    },
  };
}
```

### 提示词详情页

提示词详情页使用动态元数据：

```typescript
// src/app/[lang]/prompt/[id]/page.tsx
export async function generateMetadata({
  params: { lang, id }
}: {
  params: { lang: string; id: string }
}): Promise<Metadata> {
  const prompt = await PromptService.findById(id);
  
  if (!prompt) {
    return { title: 'Not Found' };
  }
  
  return {
    title: `${prompt.title} | PromptHub`,
    description: prompt.description || prompt.content.slice(0, 160),
    openGraph: {
      title: prompt.title,
      description: prompt.description,
      type: 'article',
    },
  };
}
```

## ✅ SEO 检查清单

### 基础配置

- [ ] 配置 `siteUrl` 环境变量
- [ ] 设置每种语言的 SEO 配置
- [ ] 生成 Sitemap
- [ ] 配置 robots.txt

### 页面优化

- [ ] 每个页面有唯一的 title
- [ ] 每个页面有描述性的 description
- [ ] 使用语义化 HTML 标签
- [ ] 图片使用 alt 属性

### 技术优化

- [ ] 启用 HTTPS
- [ ] 配置 canonical URL
- [ ] 设置 hreflang 标签
- [ ] 优化页面加载速度

### 验证

- [ ] 提交 Sitemap 到 Google Search Console
- [ ] 验证 Open Graph 标签（使用 Facebook 调试工具）
- [ ] 验证 Twitter Card（使用 Twitter Card 验证器）

## 🔧 Google Search Console

### 验证网站

1. 访问 [Google Search Console](https://search.google.com/search-console)
2. 添加你的网站
3. 选择验证方式（推荐 HTML 标签）
4. 将验证代码添加到环境变量：

```env
NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION=your-verification-code
```

### 提交 Sitemap

1. 在 Search Console 中选择你的网站
2. 点击 **Sitemaps**
3. 输入 `sitemap.xml`
4. 点击 **提交**

## 下一步

- 阅读 [定制指南](./customization/branding.md)
- 查看 [部署指南](./deployment.md)
- 了解 [开发指南](./development.md)