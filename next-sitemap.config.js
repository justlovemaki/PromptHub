// next-sitemap.config.js

/** @type {import('next-sitemap').IConfig} */

const siteUrl = (process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000').replace(/\/$/, '');

// 支持的语言列表
const languages = ['en', 'zh-CN', 'ja'];

module.exports = {
  // 必须项，你的网站域名
  siteUrl: siteUrl,

  // 自动生成 robots.txt 文件
  generateRobotsTxt: true,

  // 自定义 robots.txt 的内容
  robotsTxtOptions: {
    policies: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          // API 路由
          '/api/',
          
          // 管理后台（需要管理员权限）
          '/admin/',
          '/*/admin/',
          
          // 用户仪表盘（需要登录）
          '/dashboard',
          '/*/dashboard',
          
          // 账户设置（需要登录）
          '/account',
          '/*/account',
        ],
      },
    ],
    // 添加多语言 sitemap 到 robots.txt
    additionalSitemaps: [
      `${siteUrl}/sitemap.xml`,
      ...languages.map(lang => `${siteUrl}/sitemap-${lang}.xml`),
    ],
  },
  
  // 排除特定的路由（不生成到 sitemap 中）
  // 注意：sitemap 由 scripts/generate-sitemap.js 生成，这里的配置仅用于 next-sitemap 自身
  exclude: [
    '/api/*',
    '/_next/*',
    '/static/*',
    // 管理后台
    '/admin',
    '/admin/*',
    '/*/admin',
    '/*/admin/*',
    // 用户私有页面
    '/dashboard',
    '/*/dashboard',
    '/account',
    '/*/account',
    // 排除所有语言路径，由 scripts/generate-sitemap.js 生成
    '/en',
    '/en/*',
    '/zh-CN',
    '/zh-CN/*',
    '/ja',
    '/ja/*',
  ],

  // 不生成默认的索引站点地图，使用 scripts/generate-sitemap.js 生成
  generateIndexSitemap: false,
  
  // 每个站点地图文件的最大 URL 数量
  sitemapSize: 5000,
  
  // 转换函数：排除所有路径，因为我们使用 scripts/generate-sitemap.js 生成
  transform: async (config, path) => {
    // 排除所有路径
    return null;
  },

  // 不使用 additionalPaths
  additionalPaths: async (config) => {
    return [];
  },
};