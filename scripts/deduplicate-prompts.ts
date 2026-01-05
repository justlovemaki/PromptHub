/**
 * 提示词去重脚本（支持相似度匹配）
 * 
 * 功能：
 * 1. 查找数据库中相似的提示词（基于 title 和 content 的相似度判断）
 * 2. 保留每组相似中最新的一个（根据 updatedAt 时间）
 * 3. 删除其他相似项
 * 4. 将删除的数据记录到日志文件
 * 
 * 使用方法：
 * npx tsx scripts/deduplicate-prompts.ts
 * 
 * 或者先预览不删除：
 * npx tsx scripts/deduplicate-prompts.ts --dry-run
 * 
 * 自定义相似度阈值（默认 0.8，即 80% 相似）：
 * npx tsx scripts/deduplicate-prompts.ts --threshold=0.9
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
const isDryRun = process.argv.includes('--dry-run');
const thresholdArg = process.argv.find(arg => arg.startsWith('--threshold='));
const SIMILARITY_THRESHOLD = thresholdArg ? parseFloat(thresholdArg.split('=')[1]) : 0.8;

// 日志文件路径
const logDir = path.join(process.cwd(), 'logs');
const logFileName = `deleted-prompts-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
const logFilePath = path.join(logDir, logFileName);

// 确保日志目录存在
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

interface PromptRecord {
  id: string;
  title: string;
  content: string;
  description: string | null;
  tags: string | null;
  imageUrls: string | null;
  author: string | null;
  isPublic: boolean | null;
  approvalStatus: string | null;
  useCount: number | null;
  spaceId: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

interface SimilarGroup {
  representativeTitle: string;
  representativeContent: string;
  prompts: Array<PromptRecord & { similarity?: number }>;
  kept: PromptRecord;
  deleted: Array<PromptRecord & { similarity: number }>;
}

interface DeletedLog {
  timestamp: string;
  isDryRun: boolean;
  similarityThreshold: number;
  totalSimilarGroups: number;
  totalDeleted: number;
  totalKept: number;
  similarGroups: SimilarGroup[];
}

/**
 * 计算两个字符串的 Levenshtein 距离
 */
function levenshteinDistance(str1: string, str2: string): number {
  const m = str1.length;
  const n = str2.length;

  // 创建距离矩阵
  const dp: number[][] = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));

  // 初始化第一行和第一列
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  // 填充矩阵
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (str1[i - 1] === str2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = Math.min(
          dp[i - 1][j] + 1,     // 删除
          dp[i][j - 1] + 1,     // 插入
          dp[i - 1][j - 1] + 1  // 替换
        );
      }
    }
  }

  return dp[m][n];
}

/**
 * 计算两个字符串的相似度（0-1之间，1表示完全相同）
 */
function calculateSimilarity(str1: string, str2: string): number {
  if (!str1 && !str2) return 1;
  if (!str1 || !str2) return 0;

  // 标准化字符串：转小写，去除多余空白
  const s1 = str1.toLowerCase().trim().replace(/\s+/g, ' ');
  const s2 = str2.toLowerCase().trim().replace(/\s+/g, ' ');

  if (s1 === s2) return 1;

  // 对于较长的字符串，使用优化的方法
  const maxLen = Math.max(s1.length, s2.length);
  
  // 如果字符串太长，使用分块比较
  if (maxLen > 1000) {
    return calculateLongStringSimilarity(s1, s2);
  }

  const distance = levenshteinDistance(s1, s2);
  return 1 - distance / maxLen;
}

/**
 * 对长字符串使用分块比较计算相似度
 */
function calculateLongStringSimilarity(str1: string, str2: string): number {
  const chunkSize = 200;
  const chunks1 = splitIntoChunks(str1, chunkSize);
  const chunks2 = splitIntoChunks(str2, chunkSize);

  // 计算共同的 n-gram
  const ngrams1 = new Set(getNGrams(str1, 3));
  const ngrams2 = new Set(getNGrams(str2, 3));

  const intersection = new Set([...ngrams1].filter(x => ngrams2.has(x)));
  const union = new Set([...ngrams1, ...ngrams2]);

  // Jaccard 相似度
  return intersection.size / union.size;
}

/**
 * 将字符串分割成块
 */
function splitIntoChunks(str: string, chunkSize: number): string[] {
  const chunks: string[] = [];
  for (let i = 0; i < str.length; i += chunkSize) {
    chunks.push(str.slice(i, i + chunkSize));
  }
  return chunks;
}

/**
 * 获取字符串的 n-gram
 */
function getNGrams(str: string, n: number): string[] {
  const ngrams: string[] = [];
  for (let i = 0; i <= str.length - n; i++) {
    ngrams.push(str.slice(i, i + n));
  }
  return ngrams;
}

/**
 * 计算两个提示词的综合相似度
 * title 权重 40%，content 权重 60%
 */
function calculatePromptSimilarity(prompt1: PromptRecord, prompt2: PromptRecord): number {
  const titleSimilarity = calculateSimilarity(prompt1.title || '', prompt2.title || '');
  const contentSimilarity = calculateSimilarity(prompt1.content || '', prompt2.content || '');

  // 加权平均
  return titleSimilarity * 0.4 + contentSimilarity * 0.6;
}

/**
 * 使用并查集（Union-Find）对相似的提示词进行分组
 */
class UnionFind {
  private parent: Map<string, string>;
  private rank: Map<string, number>;

  constructor() {
    this.parent = new Map();
    this.rank = new Map();
  }

  makeSet(x: string): void {
    if (!this.parent.has(x)) {
      this.parent.set(x, x);
      this.rank.set(x, 0);
    }
  }

  find(x: string): string {
    if (this.parent.get(x) !== x) {
      this.parent.set(x, this.find(this.parent.get(x)!));
    }
    return this.parent.get(x)!;
  }

  union(x: string, y: string): void {
    const rootX = this.find(x);
    const rootY = this.find(y);

    if (rootX !== rootY) {
      const rankX = this.rank.get(rootX)!;
      const rankY = this.rank.get(rootY)!;

      if (rankX < rankY) {
        this.parent.set(rootX, rootY);
      } else if (rankX > rankY) {
        this.parent.set(rootY, rootX);
      } else {
        this.parent.set(rootY, rootX);
        this.rank.set(rootX, rankX + 1);
      }
    }
  }

  getGroups(): Map<string, string[]> {
    const groups = new Map<string, string[]>();
    for (const [item] of this.parent) {
      const root = this.find(item);
      if (!groups.has(root)) {
        groups.set(root, []);
      }
      groups.get(root)!.push(item);
    }
    return groups;
  }
}

async function main() {
  console.log('========================================');
  console.log('提示词去重脚本（相似度匹配版）');
  console.log('========================================');
  console.log(`模式: ${isDryRun ? '预览模式 (不会实际删除)' : '执行模式 (将删除相似数据)'}`);
  console.log(`相似度阈值: ${(SIMILARITY_THRESHOLD * 100).toFixed(0)}%`);
  console.log('');

  // 初始化数据库连接
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

  try {
    // 1. 获取所有提示词
    console.log('正在获取所有提示词...');
    const allPrompts: PromptRecord[] = await db.select().from(schema.prompt);
    console.log(`共找到 ${allPrompts.length} 条提示词`);
    console.log('');

    if (allPrompts.length < 2) {
      console.log('✅ 提示词数量不足，无需去重！');
      return;
    }

    // 2. 计算相似度并分组
    console.log('正在计算相似度...');
    console.log('（这可能需要一些时间，取决于数据量）');
    
    const uf = new UnionFind();
    const promptMap = new Map<string, PromptRecord>();
    const similarityMap = new Map<string, number>(); // 存储每对提示词的相似度

    // 初始化并查集
    for (const prompt of allPrompts) {
      uf.makeSet(prompt.id);
      promptMap.set(prompt.id, prompt);
    }

    // 计算两两之间的相似度
    const totalPairs = (allPrompts.length * (allPrompts.length - 1)) / 2;
    let processedPairs = 0;
    let lastProgress = 0;

    for (let i = 0; i < allPrompts.length; i++) {
      for (let j = i + 1; j < allPrompts.length; j++) {
        const prompt1 = allPrompts[i];
        const prompt2 = allPrompts[j];

        const similarity = calculatePromptSimilarity(prompt1, prompt2);

        if (similarity >= SIMILARITY_THRESHOLD) {
          uf.union(prompt1.id, prompt2.id);
          // 存储相似度
          const key = [prompt1.id, prompt2.id].sort().join('|');
          similarityMap.set(key, similarity);
        }

        processedPairs++;
        const progress = Math.floor((processedPairs / totalPairs) * 100);
        if (progress >= lastProgress + 10) {
          console.log(`  进度: ${progress}%`);
          lastProgress = progress;
        }
      }
    }

    console.log('  进度: 100%');
    console.log('');

    // 3. 获取分组结果
    const groups = uf.getGroups();
    const similarGroups: SimilarGroup[] = [];

    for (const [, ids] of groups) {
      if (ids.length > 1) {
        const prompts = ids.map(id => promptMap.get(id)!);

        // 按 updatedAt 降序排序，保留最新的
        prompts.sort((a, b) => {
          const dateA = new Date(a.updatedAt).getTime();
          const dateB = new Date(b.updatedAt).getTime();
          return dateB - dateA;
        });

        const [kept, ...deleted] = prompts;

        // 计算每个被删除项与保留项的相似度
        const deletedWithSimilarity = deleted.map(p => {
          const key = [kept.id, p.id].sort().join('|');
          const similarity = similarityMap.get(key) || calculatePromptSimilarity(kept, p);
          return { ...p, similarity };
        });

        similarGroups.push({
          representativeTitle: kept.title || '(无标题)',
          representativeContent: (kept.content || '').substring(0, 100) + ((kept.content || '').length > 100 ? '...' : ''),
          prompts: prompts.map(p => {
            const key = [kept.id, p.id].sort().join('|');
            return { ...p, similarity: p.id === kept.id ? 1 : (similarityMap.get(key) || 0) };
          }),
          kept,
          deleted: deletedWithSimilarity,
        });
      }
    }

    if (similarGroups.length === 0) {
      console.log('✅ 没有发现相似的提示词！');
      return;
    }

    // 4. 显示相似统计
    const totalDeleted = similarGroups.reduce((sum, g) => sum + g.deleted.length, 0);
    console.log(`发现 ${similarGroups.length} 组相似数据`);
    console.log(`将删除 ${totalDeleted} 条相似记录，保留 ${similarGroups.length} 条`);
    console.log('');

    // 5. 显示详细信息
    console.log('相似详情:');
    console.log('----------------------------------------');
    for (let i = 0; i < similarGroups.length; i++) {
      const group = similarGroups[i];
      console.log(`\n[${i + 1}] 标题: "${group.representativeTitle.substring(0, 50)}${group.representativeTitle.length > 50 ? '...' : ''}"`);
      console.log(`    相似数量: ${group.prompts.length} 条`);
      console.log(`    保留: ID=${group.kept.id}, 更新时间=${group.kept.updatedAt}`);
      console.log(`    删除:`);
      for (const deleted of group.deleted) {
        console.log(`      - ID=${deleted.id}, 相似度=${(deleted.similarity * 100).toFixed(1)}%, 标题="${(deleted.title || '').substring(0, 30)}..."`);
      }
    }
    console.log('');

    // 6. 准备日志数据
    const logData: DeletedLog = {
      timestamp: new Date().toISOString(),
      isDryRun,
      similarityThreshold: SIMILARITY_THRESHOLD,
      totalSimilarGroups: similarGroups.length,
      totalDeleted,
      totalKept: similarGroups.length,
      similarGroups: similarGroups.map(g => ({
        ...g,
        prompts: g.prompts.map(p => ({
          ...p,
          createdAt: new Date(p.createdAt),
          updatedAt: new Date(p.updatedAt),
        })),
        kept: {
          ...g.kept,
          createdAt: new Date(g.kept.createdAt),
          updatedAt: new Date(g.kept.updatedAt),
        },
        deleted: g.deleted.map(p => ({
          ...p,
          createdAt: new Date(p.createdAt),
          updatedAt: new Date(p.updatedAt),
        })),
      })),
    };

    // 7. 执行删除或预览
    if (isDryRun) {
      console.log('========================================');
      console.log('预览模式 - 不会实际删除数据');
      console.log('========================================');
      console.log(`如需执行删除，请运行: npx tsx scripts/deduplicate-prompts.ts`);
      console.log(`调整相似度阈值: npx tsx scripts/deduplicate-prompts.ts --threshold=0.9`);
    } else {
      console.log('========================================');
      console.log('开始删除相似数据...');
      console.log('========================================');

      // 收集所有要删除的 ID
      const idsToDelete = similarGroups.flatMap(g => g.deleted.map(p => p.id));

      if (idsToDelete.length > 0) {
        // 批量删除
        await db.delete(schema.prompt).where(inArray(schema.prompt.id, idsToDelete));
        console.log(`✅ 成功删除 ${idsToDelete.length} 条相似记录`);
      }
    }

    // 8. 保存日志文件
    fs.writeFileSync(logFilePath, JSON.stringify(logData, null, 2), 'utf-8');
    console.log('');
    console.log(`📝 日志已保存到: ${logFilePath}`);

  } catch (error) {
    console.error('执行出错:', error);
    process.exit(1);
  }

  console.log('');
  console.log('========================================');
  console.log('脚本执行完成');
  console.log('========================================');
}

main().catch(console.error);