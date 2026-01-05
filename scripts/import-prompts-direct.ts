/**
 * 直接数据库导入提示词脚本（批量插入版本）
 * 绕过 HTTP 请求限制，直接操作数据库
 * 使用批量插入，一次插入 1000 条记录
 *
 * 使用方法:
 * npx tsx scripts/import-prompts-direct.ts <json文件路径> <spaceId> [userId]
 *
 * 示例:
 * npx tsx scripts/import-prompts-direct.ts scripts/6/output.json space_xxx user_xxx
 */

import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

// 加载环境变量
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

// 批量大小
const BATCH_SIZE = 100;

// 生成唯一ID的函数
function generateId(): string {
  const timestamp = Date.now().toString(36);
  const randomPart = Math.random().toString(36).substring(2, 15);
  return `${timestamp}${randomPart}`;
}

// 动态导入以支持 ESM
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length < 2) {
    console.log('使用方法: npx tsx scripts/import-prompts-direct.ts <json文件路径> <spaceId> [userId]');
    console.log('示例: npx tsx scripts/import-prompts-direct.ts scripts/6/output.json space_xxx user_xxx');
    process.exit(1);
  }

  const filePath = args[0];
  const spaceId = args[1];
  const userId = args[2] || 'system';

  if (!fs.existsSync(filePath)) {
    console.error(`文件不存在: ${filePath}`);
    process.exit(1);
  }

  console.log(`读取文件: ${filePath}`);
  const fileContent = fs.readFileSync(filePath, 'utf-8');
  
  interface PromptData {
    title: string;
    content: string;
    isPublic: boolean;
    tags?: string[];
    imageUrls?: string[];
    author?: string;
    description?: string;
    useCount?: number;
  }

  let prompts: PromptData[];
  try {
    prompts = JSON.parse(fileContent);
  } catch (error) {
    console.error('JSON 解析错误:', error);
    process.exit(1);
  }

  if (!Array.isArray(prompts)) {
    console.error('JSON 文件必须是数组格式');
    process.exit(1);
  }

  console.log(`总共 ${prompts.length} 条提示词`);
  console.log(`目标空间: ${spaceId}`);
  console.log(`创建者: ${userId}`);
  console.log(`批量大小: ${BATCH_SIZE}`);
  
  // 检查环境变量
  console.log('\n环境变量检查:');
  console.log(`  NEON_DATABASE_URL: ${process.env.NEON_DATABASE_URL ? '已设置' : '未设置'}`);
  console.log(`  SUPABASE_URL: ${process.env.SUPABASE_URL ? '已设置' : '未设置'}`);
  console.log(`  TURSO_DATABASE_URL: ${process.env.TURSO_DATABASE_URL ? '已设置' : '未设置'}`);
  console.log(`  DB_FILE_NAME: ${process.env.DB_FILE_NAME ? '已设置' : '未设置'}`);

  // 动态导入数据库和 schema
  console.log('\n正在连接数据库...');
  const { db } = await import('../src/lib/database');
  const { prompt } = await import('../src/drizzle-schema');
  console.log('数据库连接成功！\n');

  let importedCount = 0;
  let failedCount = 0;
  const errors: { batchIndex: number; startIndex: number; endIndex: number; error: string }[] = [];

  // 倒序导入
  const reversedPrompts = [...prompts].reverse();

  // 计算批次数量
  const totalBatches = Math.ceil(reversedPrompts.length / BATCH_SIZE);
  console.log(`总批次数: ${totalBatches}\n`);

  const startTime = Date.now();

  for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
    const startIdx = batchIndex * BATCH_SIZE;
    const endIdx = Math.min(startIdx + BATCH_SIZE, reversedPrompts.length);
    const batchPrompts = reversedPrompts.slice(startIdx, endIdx);
    
    try {
      // 准备批量插入的数据
      const now = new Date();
      const batchData = batchPrompts.map((promptData) => ({
        id: generateId(),
        title: promptData.title || '无标题',
        content: promptData.content || '',
        description: promptData.description || '',
        tags: JSON.stringify(promptData.tags || []),
        imageUrls: JSON.stringify(promptData.imageUrls || []),
        author: promptData.author || '',
        isPublic: promptData.isPublic ?? true,
        useCount: promptData.useCount || 0,
        spaceId: spaceId,
        createdBy: userId,
        createdAt: now,
        updatedAt: now,
      }));

      // 批量插入
      await db.insert(prompt).values(batchData);
      
      importedCount += batchPrompts.length;
      
      // 打印进度
      const progress = ((importedCount / prompts.length) * 100).toFixed(1);
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      console.log(`批次 ${batchIndex + 1}/${totalBatches}: 已导入 ${importedCount}/${prompts.length} (${progress}%) - 耗时 ${elapsed}s`);
      
    } catch (error) {
      failedCount += batchPrompts.length;
      errors.push({
        batchIndex,
        startIndex: startIdx,
        endIndex: endIdx,
        error: String(error),
      });
      console.error(`批次 ${batchIndex + 1} 导入失败: ${error}`);
    }
  }

  const totalTime = ((Date.now() - startTime) / 1000).toFixed(2);

  console.log('\n========== 导入完成 ==========');
  console.log(`成功导入: ${importedCount} 条`);
  console.log(`失败: ${failedCount} 条`);
  console.log(`总耗时: ${totalTime} 秒`);
  console.log(`平均速度: ${(importedCount / parseFloat(totalTime)).toFixed(0)} 条/秒`);

  // 保存错误日志
  if (errors.length > 0) {
    const errorLogPath = filePath.replace('.json', '-errors.json');
    fs.writeFileSync(errorLogPath, JSON.stringify(errors, null, 2));
    console.log(`错误日志已保存到: ${errorLogPath}`);
  }
}

main().catch(console.error);