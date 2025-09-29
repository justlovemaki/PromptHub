// next-sitemap.config.js

/** @type {import('next-sitemap').IConfig} */

module.exports = {
  // 必须项，你的网站域名
  siteUrl: process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000/',

  // (可选) 自动生成 robots.txt 文件，默认为 false
  generateRobotsTxt: true,

  // (可选) 自定义 robots.txt 的内容
  robotsTxtOptions: {
    policies: [
      {
        userAgent: '*',
        allow: '/',
      },
      {
        userAgent: 'Googlebot',
        disallow: ['/private'],
      },
    ],
    // (可选) 在 robots.txt 中添加额外的 sitemap
    // additionalSitemaps: [
    //   `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/sitemap-en.xml`,
    //   `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/sitemap-zh-CN.xml`,
    //   `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/sitemap-ja.xml`,
    // ],
  },
  
  // (可选) 排除特定的路由
  exclude: ['/api/*', '/_next/*', '/static/*'],

  // 多语言配置
  i18n: {
    locales: ['en', 'zh-CN', 'ja'],
    defaultLocale: 'en',
  },

  // 自定义输出目录
  // outDir: './out',
  
  // 生成针对每种语言的单独站点地图
  generateIndexSitemap: false, // 不生成总的索引站点地图
  
  // 使用自定义函数来生成不同语言的站点地图
  sitemapSize: 1000, // 每个站点地图文件的最大 URL 数量
  
  // 包含静态页面
  transform: async (config, path) => {
    // 为动态路由设置默认值
    if (path.includes('[fileName]')) {
      return null; // 这些将在 additionalPaths 中处理
    }
    
    return {
      loc: path,
      changefreq: 'daily',
      priority: path === '/' ? 1.0 : 0.8,
      lastmod: new Date().toISOString(),
    };
  },

  // 添加动态路由和多语言支持
  additionalPaths: async (config) => {
    const paths = [];
    
    // 根据配置的语言生成多语言路径
    const languages = config.i18n.locales;
    const defaultLanguage = config.i18n.defaultLocale;
    
    // 添加静态页面路径（包含多语言版本）
    const staticPaths = [
      '/',
      '/pricing',
      '/contact',
      '/privacy',
      '/terms'
    ];
    
    staticPaths.forEach(path => {
      languages.forEach(lang => {
        // 对于默认语言，我们保持原始路径
        // 对于其他语言，添加语言前缀
        let localizedPath;
        if (lang === defaultLanguage) {
          localizedPath = path;
        } else {
          localizedPath = `/${lang}${path === '/' ? '' : path}`;
        }
        
        paths.push({
          loc: localizedPath,
          changefreq: 'daily',
          priority: path === '/' ? 1.0 : 0.8,
          lastmod: new Date().toISOString(),
        });
      });
    });
    
    return paths;
  },
};