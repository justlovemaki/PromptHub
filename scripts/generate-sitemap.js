/**
 * 静态 Sitemap 生成脚本
 * 在构建后执行，生成多语言 sitemap 文件
 *
 * 功能：
 * 1. 按语言拆分生成多个 sitemap 文件 (sitemap-en.xml, sitemap-zh-CN.xml, sitemap-ja.xml)
 * 2. 生成 sitemap index 文件 (sitemap.xml)
 * 3. 从数据库获取公开提示词并生成 sitemap
 * 4. 每个语言的 sitemap 只包含该语言的 URL
 *
 * 使用方法: node scripts/generate-sitemap.js
 */

const fs = require('fs');
const path = require('path');

// 加载环境变量
require('dotenv').config({ path: path.join(process.cwd(), '.env') });
require('dotenv').config({ path: path.join(process.cwd(), '.env.local'), override: true });
require('dotenv').config({ path: path.join(process.cwd(), '.env.production'), override: true });
require('dotenv').config({ path: path.join(process.cwd(), '.env.production.local'), override: true });

// 配置
const BASE_URL = (process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000').replace(/\/$/, '');
const LANGUAGES = ['en', 'zh-CN', 'ja'];

// 公开的静态页面路径配置
const publicStaticPages = [
  { path: '', changeFrequency: 'daily', priority: 1.0 },
  { path: '/explore', changeFrequency: 'hourly', priority: 0.9 },
  { path: '/contact', changeFrequency: 'monthly', priority: 0.5 },
  { path: '/privacy', changeFrequency: 'monthly', priority: 0.3 },
  { path: '/terms', changeFrequency: 'monthly', priority: 0.3 },
  { path: '/download', changeFrequency: 'weekly', priority: 0.6 },
  { path: '/nano-banana-pro', changeFrequency: 'weekly', priority: 0.8 },
  { path: '/nano-banana', changeFrequency: 'weekly', priority: 0.8 },
];

/**
 * 生成单语言 sitemap XML 内容（不包含 hreflang 链接）
 * 每个语言的 sitemap 只包含该语言的 URL
 */
function generateLanguageSitemapXml(entries) {
  const urlElements = entries.map(entry => {
    return `  <url>
    <loc>${entry.url}</loc>
    <lastmod>${entry.lastModified}</lastmod>
    <changefreq>${entry.changeFrequency}</changefreq>
    <priority>${entry.priority}</priority>
  </url>`;
  }).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlElements}
</urlset>`;
}

/**
 * 生成 sitemap index XML 内容
 */
function generateSitemapIndexXml(sitemapFiles, baseUrl) {
  const now = new Date().toISOString();
  
  const sitemapElements = sitemapFiles.map(file => {
    return `  <sitemap>
    <loc>${baseUrl}/${file}</loc>
    <lastmod>${now}</lastmod>
  </sitemap>`;
  }).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemapElements}
</sitemapindex>`;
}

/**
 * 连接数据库并获取公开提示词
 */
async function getPublicPrompts() {
  const prompts = [];
  
  try {
    // 检查数据库配置
    const neonUrl = process.env.NEON_DATABASE_URL;
    const supabaseUrl = process.env.SUPABASE_URL;
    const tursoUrl = process.env.TURSO_DATABASE_URL;
    const dbFileName = process.env.DB_FILE_NAME;
    
    if (neonUrl) {
      // 使用 Neon PostgreSQL
      console.log('📦 连接 Neon PostgreSQL 数据库...');
      const postgres = require('postgres');
      const sql = postgres(neonUrl, { prepare: false });
      
      const result = await sql`
        SELECT id, "updated_at" as "updatedAt"
        FROM prompt
        WHERE "is_public" = true
      `;
      
      for (const row of result) {
        prompts.push({
          id: row.id,
          updatedAt: row.updatedAt,
        });
      }
      
      await sql.end();
      
    } else if (supabaseUrl) {
      // 使用 Supabase PostgreSQL
      console.log('📦 连接 Supabase PostgreSQL 数据库...');
      const postgres = require('postgres');
      const sql = postgres(supabaseUrl, { prepare: false });
      
      const result = await sql`
        SELECT id, "updated_at" as "updatedAt"
        FROM prompt
        WHERE "is_public" = true
      `;
      
      for (const row of result) {
        prompts.push({
          id: row.id,
          updatedAt: row.updatedAt,
        });
      }
      
      await sql.end();
      
    } else if (tursoUrl || dbFileName) {
      // 使用 Turso 或 SQLite
      console.log('📦 连接 SQLite/Turso 数据库...');
      const { createClient } = require('@libsql/client');
      
      const client = createClient({
        url: tursoUrl || dbFileName || 'file:sqlite.db',
        authToken: process.env.TURSO_AUTH_TOKEN,
      });
      
      const result = await client.execute({
        sql: 'SELECT id, updated_at FROM prompt WHERE is_public = 1',
        args: [],
      });
      
      for (const row of result.rows) {
        prompts.push({
          id: row.id,
          updatedAt: row.updated_at,
        });
      }
      
    } else {
      console.log('⚠️  未配置数据库连接，跳过动态内容');
    }
    
  } catch (error) {
    console.error('❌ 数据库查询失败:', error.message);
    console.log('⚠️  将仅生成静态页面 sitemap');
  }
  
  return prompts;
}

/**
 * 主函数：生成静态 sitemap
 */
async function generateStaticSitemap() {
  console.log('🚀 开始生成静态 sitemap...');
  console.log(`📍 Base URL: ${BASE_URL}`);
  console.log(`🌐 支持语言: ${LANGUAGES.join(', ')}`);
  
  const now = new Date().toISOString();
  
  // 确保 public 目录存在
  const publicDir = path.join(process.cwd(), 'public');
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  // 获取公开提示词（已禁用）
  // console.log('\n📦 获取公开提示词...');
  // const publicPrompts = await getPublicPrompts();
  
  // if (publicPrompts.length > 0) {
  //   console.log(`   ✓ 找到 ${publicPrompts.length} 个公开提示词`);
  // } else {
  //   console.log('   ⚠️  没有找到公开提示词');
  // }
  const publicPrompts = [];

  // 按语言生成 sitemap 文件
  const sitemapFiles = [];
  let totalUrls = 0;
  
  console.log('\n📄 按语言生成 sitemap 文件...');
  
  for (const lang of LANGUAGES) {
    const entries = [];
    
    // 生成静态页面条目
    for (const page of publicStaticPages) {
      const url = page.path === ''
        ? `${BASE_URL}/${lang}`
        : `${BASE_URL}/${lang}${page.path}`;
      
      entries.push({
        url,
        lastModified: now,
        changeFrequency: page.changeFrequency,
        priority: page.priority,
      });
    }
    
    // 生成提示词页面条目
    for (const p of publicPrompts) {
      const url = `${BASE_URL}/${lang}/prompt/${p.id}`;
      
      entries.push({
        url,
        lastModified: p.updatedAt ? new Date(p.updatedAt).toISOString() : now,
        changeFrequency: 'weekly',
        priority: 0.7,
      });
    }
    
    // 生成该语言的 sitemap XML
    const sitemapXml = generateLanguageSitemapXml(entries);
    
    // 写入文件
    const filename = `sitemap-${lang}.xml`;
    const outputPath = path.join(publicDir, filename);
    fs.writeFileSync(outputPath, sitemapXml, 'utf-8');
    
    sitemapFiles.push(filename);
    totalUrls += entries.length;
    
    console.log(`   ✓ ${filename}: ${entries.length} 个 URL`);
  }
  
  // 生成 sitemap index
  console.log('\n📝 生成 sitemap index...');
  const sitemapIndexXml = generateSitemapIndexXml(sitemapFiles, BASE_URL);
  const indexPath = path.join(publicDir, 'sitemap.xml');
  fs.writeFileSync(indexPath, sitemapIndexXml, 'utf-8');
  console.log(`   ✓ sitemap.xml (索引文件)`);
  
  // 输出统计
  console.log(`\n✅ Sitemap 生成完成！`);
  console.log(`📊 统计信息:`);
  console.log(`   - 语言数量: ${LANGUAGES.length}`);
  console.log(`   - 静态页面: ${publicStaticPages.length} 个/语言`);
  console.log(`   - 提示词页面: ${publicPrompts.length} 个/语言`);
  console.log(`   - 总 URL 数: ${totalUrls}`);
  console.log(`   - 生成文件:`);
  console.log(`     - sitemap.xml (索引)`);
  for (const file of sitemapFiles) {
    console.log(`     - ${file}`);
  }
}

// 执行
generateStaticSitemap()
  .then(() => {
    console.log('\n🎉 完成！');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ 生成 sitemap 失败:', error);
    process.exit(1);
  });