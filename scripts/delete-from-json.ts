/**
 * 从 JSON 日志文件中删除提示词脚本
 * 
 * 功能：
 * 1. 解析指定的 JSON 日志文件
 * 2. 提取所有 similarGroups 中的 deleted 数组
 * 3. 从数据库中删除这些提示词
 * 
 * 使用方法：
 * npx tsx scripts/delete-from-json.ts <json文件路径>
 * 
 * 示例：
 * npx tsx scripts/delete-from-json.ts logs/111.json
 * 
 * 预览模式（不实际删除）：
 * npx tsx scripts/delete-from-json.ts logs/111.json --dry-run
 */

import 'dotenv/config';
import { config as dotenvConfig } from 'dotenv';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { createClient } from '@libsql/client';
import { drizzle as sqliteDrizzle } from 'drizzle-orm/libsql';
import * as postgresSchema from '../src/drizzle-postgres-schema';
import * as sqliteSchema from '../src/drizzle-sqlite-schema';
import { inArray } from 'drizzle-orm';
import * as fs from 'fs';
import * as path from 'path';

// 加载环境变量
dotenvConfig({ path: '.env' });

// 命令行参数
const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');
const jsonFilePath = args.find(arg => !arg.startsWith('--'));

if (!jsonFilePath) {
  console.error('错误: 请提供 JSON 文件路径');
  console.error('用法: npx tsx scripts/delete-from-json.ts <json文件路径> [--dry-run]');
  console.error('示例: npx tsx scripts/delete-from-json.ts logs/111.json');
  process.exit(1);
}

// 解析 JSON 文件路径
const resolvedPath = path.isAbsolute(jsonFilePath) 
  ? jsonFilePath 
  : path.join(process.cwd(), jsonFilePath);

if (!fs.existsSync(resolvedPath)) {
  console.error(`错误: 文件不存在: ${resolvedPath}`);
  process.exit(1);
}

interface DeletedPrompt {
  id: string;
  title: string;
  content: string;
  similarity?: number;
  [key: string]: any;
}

interface SimilarGroup {
  representativeTitle: string;
  deleted: DeletedPrompt[];
  [key: string]: any;
}

interface JsonLogData {
  timestamp: string;
  isDryRun: boolean;
  similarityThreshold: number;
  totalSimilarGroups: number;
  totalDeleted: number;
  totalKept: number;
  similarGroups: SimilarGroup[];
}

async function main() {
  console.log('========================================');
  console.log('从 JSON 文件删除提示词脚本');
  console.log('========================================');
  console.log(`模式: ${isDryRun ? '预览模式 (不会实际删除)' : '执行模式 (将删除数据)'}`);
  console.log(`JSON 文件: ${resolvedPath}`);
  console.log('');

  // 1. 读取并解析 JSON 文件
  console.log('正在读取 JSON 文件...');
  let jsonData: JsonLogData;
  try {
    const fileContent = fs.readFileSync(resolvedPath, 'utf-8');
    jsonData = JSON.parse(fileContent);
  } catch (error) {
    console.error('错误: 无法解析 JSON 文件:', error);
    process.exit(1);
  }

  // 2. 提取所有要删除的 ID
  const idsToDelete: string[] = [];
  const deletedDetails: Array<{ id: string; title: string; similarity?: number }> = [];

  if (!jsonData.similarGroups || !Array.isArray(jsonData.similarGroups)) {
    console.error('错误: JSON 文件格式不正确，缺少 similarGroups 数组');
    process.exit(1);
  }

  for (const group of jsonData.similarGroups) {
    if (group.deleted && Array.isArray(group.deleted)) {
      for (const item of group.deleted) {
        if (item.id) {
          idsToDelete.push(item.id);
          deletedDetails.push({
            id: item.id,
            title: item.title || '(无标题)',
            similarity: item.similarity,
          });
        }
      }
    }
  }

  if (idsToDelete.length === 0) {
    console.log('✅ JSON 文件中没有需要删除的数据！');
    return;
  }

  console.log(`找到 ${idsToDelete.length} 条需要删除的记录`);
  console.log('');

  // 3. 显示要删除的记录
  console.log('要删除的记录:');
  console.log('----------------------------------------');
  for (let i = 0; i < deletedDetails.length; i++) {
    const item = deletedDetails[i];
    const similarityStr = item.similarity !== undefined 
      ? ` (相似度: ${(item.similarity * 100).toFixed(1)}%)` 
      : '';
    console.log(`[${i + 1}] ID: ${item.id}`);
    console.log(`    标题: ${item.title.substring(0, 50)}${item.title.length > 50 ? '...' : ''}${similarityStr}`);
  }
  console.log('');

  // 4. 初始化数据库连接
  let db: any;
  let schema: typeof postgresSchema | typeof sqliteSchema;

  if (process.env.NEON_DATABASE_URL) {
    console.log('使用 Neon PostgreSQL 数据库');
    const client = postgres(process.env.NEON_DATABASE_URL, {
      prepare: false,
      connect_timeout: 10,
    });
    db = drizzle(client, { schema: postgresSchema, logger: false });
    schema = postgresSchema;
  } else if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.log('使用 Supabase PostgreSQL 数据库');
    const client = postgres(process.env.SUPABASE_URL, {
      prepare: false,
      connect_timeout: 10,
    });
    db = drizzle(client, { schema: postgresSchema, logger: false });
    schema = postgresSchema;
  } else if (process.env.TURSO_DATABASE_URL) {
    console.log('使用 Turso SQLite 数据库');
    const client = createClient({
      url: process.env.TURSO_DATABASE_URL,
      authToken: process.env.TURSO_AUTH_TOKEN,
    });
    db = sqliteDrizzle(client, { schema: sqliteSchema, logger: false });
    schema = sqliteSchema;
  } else {
    console.log('使用本地 SQLite 数据库');
    const client = createClient({
      url: process.env.DB_FILE_NAME || 'file:sqlite.db',
    });
    db = sqliteDrizzle(client, { schema: sqliteSchema, logger: false });
    schema = sqliteSchema;
  }

  console.log('');

  // 5. 执行删除或预览
  if (isDryRun) {
    console.log('========================================');
    console.log('预览模式 - 不会实际删除数据');
    console.log('========================================');
    console.log(`如需执行删除，请运行: npx tsx scripts/delete-from-json.ts ${jsonFilePath}`);
  } else {
    console.log('========================================');
    console.log('开始删除数据...');
    console.log('========================================');

    try {
      // 批量删除
      const result = await db.delete(schema.prompt).where(inArray(schema.prompt.id, idsToDelete));
      console.log(`✅ 成功删除 ${idsToDelete.length} 条记录`);
    } catch (error) {
      console.error('删除失败:', error);
      process.exit(1);
    }
  }

  console.log('');
  console.log('========================================');
  console.log('脚本执行完成');
  console.log('========================================');
}

main().catch(console.error);