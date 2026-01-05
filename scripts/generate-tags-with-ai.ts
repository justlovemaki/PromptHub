/**
 * AI 标签生成脚本
 * 使用 OpenAI API 根据 prompt 的 content 生成合适的标签
 *
 * 使用方法:
 * npx tsx scripts/generate-tags-with-ai.ts [spaceId] [--batch-size=10] [--max-count=100] [--dry-run]
 *
 * 参数:
 * - spaceId: 可选，指定空间ID，不指定则处理所有未公开的 prompts（isPublic=false）
 * - --batch-size=N: 每批处理的数量，默认 50
 * - --max-count=N: 一次运行最大处理数量，默认不限制
 * - --dry-run: 仅预览，不实际更新数据库
 *
 * 环境变量:
 * - OPENAI_API_KEY: OpenAI API 密钥
 * - OPENAI_BASE_URL: OpenAI API 基础 URL（可选，用于代理）
 *
 * 示例:
 * npx tsx scripts/generate-tags-with-ai.ts
 * npx tsx scripts/generate-tags-with-ai.ts space_xxx --batch-size=100
 * npx tsx scripts/generate-tags-with-ai.ts --max-count=200
 * npx tsx scripts/generate-tags-with-ai.ts --dry-run
 */

import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

// 加载环境变量
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

// 从 tags-cn.json 提取所有可用标签
import tagsCnJson from '../src/tags/tags-cn.json';

interface TagLabel {
  name: string;
  key: string;
  description: string;
}

interface TagCategory {
  category_name: string;
  labels: TagLabel[];
}

interface TagClassification {
  title: string;
  description: string;
  categories: Record<string, TagCategory>;
}

interface TagsJson {
  prompt_tags_classification: {
    scenario_tags: TagClassification;
    intent_tags: TagClassification;
  };
}

// 提取所有可用的标签 key
function extractAllTagKeys(tagsJson: TagsJson): { key: string; name: string; description: string }[] {
  const allTags: { key: string; name: string; description: string }[] = [];
  
  const { scenario_tags, intent_tags } = tagsJson.prompt_tags_classification;
  
  // 提取场景标签
  for (const categoryKey of Object.keys(scenario_tags.categories)) {
    const category = scenario_tags.categories[categoryKey];
    for (const label of category.labels) {
      allTags.push({
        key: label.key,
        name: label.name,
        description: label.description
      });
    }
  }
  
  // 提取意图标签
  for (const categoryKey of Object.keys(intent_tags.categories)) {
    const category = intent_tags.categories[categoryKey];
    for (const label of category.labels) {
      allTags.push({
        key: label.key,
        name: label.name,
        description: label.description
      });
    }
  }
  
  return allTags;
}

const ALL_AVAILABLE_TAGS = extractAllTagKeys(tagsCnJson as TagsJson);
const ALL_TAG_KEYS = ALL_AVAILABLE_TAGS.map(t => t.key);

// 构建标签描述文本，用于 AI 提示
function buildTagDescriptionText(): string {
  let text = '可用标签列表（key: 名称 - 描述）：\n';
  for (const tag of ALL_AVAILABLE_TAGS) {
    text += `- ${tag.key}: ${tag.name} - ${tag.description}\n`;
  }
  return text;
}

// OpenAI API 调用（带重试机制）
async function callOpenAI(prompt: string, systemPrompt: string, retries = 3): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  const baseUrl = process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1';
  
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY 环境变量未设置');
  }
  
  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: prompt }
          ],
          temperature: 0.3,
          max_tokens: 16000
        })
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`OpenAI API 错误: ${response.status} - ${errorText}`);
      }
      
      const data = await response.json();
      const content = data.choices[0]?.message?.content || '';
      
      // 检查响应是否为空
      if (!content || content.trim().length === 0) {
        throw new Error('AI 返回了空响应');
      }
      
      // 检查是否因为 finish_reason 被截断
      const finishReason = data.choices[0]?.finish_reason;
      if (finishReason === 'length') {
        console.warn(`警告: AI 响应因长度限制被截断 (finish_reason: ${finishReason})`);
      }
      
      return content;
    } catch (error) {
      lastError = error as Error;
      console.error(`API 调用失败 (尝试 ${attempt}/${retries}):`, (error as Error).message);
      
      if (attempt < retries) {
        const waitTime = attempt * 2000; // 递增等待时间
        console.log(`等待 ${waitTime / 1000} 秒后重试...`);
        await delay(waitTime);
      }
    }
  }
  
  throw lastError || new Error('API 调用失败');
}

// 生成结果接口
interface GenerateResult {
  tags: string[];
  description: string;
}

// 批量生成结果接口
interface BatchGenerateResult {
  [id: string]: GenerateResult;
}

// 输入项接口
interface PromptInput {
  id: string;
  title: string;
  content: string;
}

// 批量根据 prompt content 生成标签和描述（一次处理多条数据）
async function generateTagsForPromptBatch(prompts: PromptInput[]): Promise<BatchGenerateResult> {
  const tagDescriptions = buildTagDescriptionText();
  
  // 构建输入数据，截断过长的内容
  const inputData = prompts.map(p => ({
    id: p.id,
    title: p.title,
    content: p.content.substring(0, 1000) + (p.content.length > 1000 ? '...(已截断)' : '')
  }));
  
  const systemPrompt = `你是一个专业的提示词分类和描述专家。你的任务是为每个提示词生成标签和描述。

${tagDescriptions}

【重要规则】
1. 标签只能从上述标签列表中选择，不要创造新标签
2. 每个提示词选择 2-5 个最相关的标签
3. 如果内容涉及图像生成、AI绘画、图片创作等，必须包含 imageGeneration 标签

【description 生成规则 - 极其重要】
- 你必须根据 content 字段的实际内容，用自己的话总结出这个提示词的功能和用途
- description 必须是你自己生成的新文字，长度 20-50 字
- 【禁止】直接复制或引用输入中的 title 字段
- 【禁止】直接复制 content 中的任何原文
- description 应该回答：这个提示词能帮用户做什么？

【输入格式】
你会收到一个 JSON 数组，包含多个提示词，每个提示词有 id、title 和 content 字段

【输出格式 - 严格遵守】
返回一个 JSON 对象，格式如下：
{
  "提示词id": {
    "tags": ["标签1", "标签2"],
    "description": "用你自己的话总结这个提示词的功能，20-50字"
  }
}

【示例】
输入: {"id": "abc", "title": "代码助手", "content": "你是一个编程专家，帮助用户编写Python代码..."}
输出: {"abc": {"tags": ["coding"], "description": "Python编程助手，可以帮助编写、调试和优化代码"}}

注意：示例中的 description 是根据 content 内容总结的，而不是复制 title "代码助手"

【注意事项】
- 只返回纯 JSON，不要添加任何其他文字、解释或代码块标记
- 每个提示词都必须同时包含 tags 数组和 description 字符串
- description 必须是你根据 content 生成的新描述，不能复制输入的任何字段，不能包含任何引号`;

  const userPrompt = `请为以下提示词批量生成标签和描述：

${JSON.stringify(inputData, null, 2)}

请返回 JSON 格式的结果（key 为每个提示词的 id）：`;

  try {
    const response = await callOpenAI(userPrompt, systemPrompt);
    
    // 调试：打印 AI 返回的原始内容
    const responseLength = response.length;
    console.log(`AI 响应长度: ${responseLength} 字符`);
    if (responseLength < 100) {
      console.log(`AI 完整响应: ${response}`);
    } else {
      console.log(`AI 原始返回（前500字符）: ${response.substring(0, 500)}...`);
      console.log(`AI 原始返回（后200字符）: ...${response.substring(responseLength - 200)}`);
    }
    
    // 尝试解析 JSON 响应
    let result: Record<string, { tags?: string[]; description?: string }>;
    try {
      // 更加健壮的 JSON 提取逻辑
      let cleanResponse = response.trim();
      
      // 1. 提取第一个 { 和最后一个 } 之间的内容
      const firstBraceIndex = cleanResponse.indexOf('{');
      const lastBraceIndex = cleanResponse.lastIndexOf('}');
      
      if (firstBraceIndex !== -1 && lastBraceIndex !== -1 && lastBraceIndex > firstBraceIndex) {
        cleanResponse = cleanResponse.substring(firstBraceIndex, lastBraceIndex + 1);
      } else if (firstBraceIndex !== -1) {
        // 只有开括号，从第一个开括号开始提取
        cleanResponse = cleanResponse.substring(firstBraceIndex);
      }
      
      // 2. 移除可能的残留代码块标记
      cleanResponse = cleanResponse
        .replace(/^```(?:json|JSON)?\s*\n?/gm, '')
        .replace(/\n?```\s*$/gm, '')
        .trim();
      
      // 3. 修复中文引号问题
      const chineseQuotePattern = /[""]/g;
      if (chineseQuotePattern.test(cleanResponse)) {
        console.log('检测到中文引号，正在尝试修复...');
        // 将中文引号替换为标准 ASCII 引号
        cleanResponse = cleanResponse.replace(/[""]/g, '"');
      }
      
      // 4. 尝试修复不完整的 JSON（如果以 { 开头但没有正确结束）
      if (cleanResponse.startsWith('{') && !cleanResponse.endsWith('}')) {
        console.warn('警告: JSON 响应不完整，尝试修复...');
        // 找到最后一个完整的对象
        const lastCompleteIndex = cleanResponse.lastIndexOf('}');
        if (lastCompleteIndex > 0) {
          // 计算需要添加多少个 } 来闭合
          const openBraces = (cleanResponse.match(/{/g) || []).length;
          const closeBraces = (cleanResponse.match(/}/g) || []).length;
          const missingBraces = openBraces - closeBraces;
          cleanResponse = cleanResponse + '}'.repeat(missingBraces);
          console.log(`添加了 ${missingBraces} 个 } 来修复 JSON`);
        }
      }
      
      result = JSON.parse(cleanResponse);
    } catch (parseError) {
      console.error('JSON 解析失败:', parseError);
      console.error('原始响应长度:', response.length);
      console.error('原始响应（完整）:', response);
      // 抛出异常以触发重试
      throw new Error(`AI 返回的内容不是有效的 JSON: ${(parseError as Error).message}`);
    }
    
    // 验证并过滤标签
    const validatedResult: BatchGenerateResult = {};
    for (const p of prompts) {
      const itemResult = result[p.id];
      if (itemResult) {
        const validTags = (itemResult.tags || [])
          .filter(tag => tag && ALL_TAG_KEYS.includes(tag));
        const description = itemResult.description || '';
        
        // 调试：如果没有 description，打印警告
        if (!description) {
          console.warn(`警告: 提示词 ${p.id} (${p.title.substring(0, 20)}...) 没有返回 description`);
          console.warn(`  AI 返回的数据:`, JSON.stringify(itemResult));
        }
        
        validatedResult[p.id] = {
          tags: validTags,
          description: description
        };
      } else {
        console.warn(`警告: 提示词 ${p.id} (${p.title.substring(0, 20)}...) 在 AI 返回中不存在`);
        validatedResult[p.id] = { tags: [], description: '' };
      }
    }
    
    return validatedResult;
  } catch (error) {
    console.error('批量生成标签和描述失败:', error);
    throw error;
    // 返回空结果
    // const emptyResult: BatchGenerateResult = {};
    // for (const p of prompts) {
    //   emptyResult[p.id] = { tags: [], description: '' };
    // }
    // return emptyResult;
  }
}

// 延迟函数
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// 主函数
async function main() {
  const args = process.argv.slice(2);
  
  // 解析参数
  let spaceId: string | undefined;
  let batchSize = 10;  // 默认批处理大小改为 10，避免响应被截断
  let maxCount: number | undefined;
  let dryRun = false;
  
  for (const arg of args) {
    if (arg.startsWith('--batch-size=')) {
      batchSize = parseInt(arg.split('=')[1], 10) || 50;
    } else if (arg.startsWith('--max-count=')) {
      maxCount = parseInt(arg.split('=')[1], 10);
    } else if (arg === '--dry-run') {
      dryRun = true;
    } else if (!arg.startsWith('--')) {
      spaceId = arg;
    }
  }
  
  console.log('========== AI 标签生成脚本 ==========');
  console.log(`批处理大小: ${batchSize}`);
  console.log(`最大处理数量: ${maxCount ? maxCount : '不限制'}`);
  console.log(`模式: ${dryRun ? '预览模式（不更新数据库）' : '正式模式'}`);
  if (spaceId) {
    console.log(`目标空间: ${spaceId}`);
  } else {
    console.log('目标: 所有未公开的 prompts（isPublic=false），处理后将设为公开');
  }
  console.log(`可用标签数量: ${ALL_TAG_KEYS.length}`);
  console.log('');
  
  // 检查环境变量
  if (!process.env.OPENAI_API_KEY) {
    console.error('错误: OPENAI_API_KEY 环境变量未设置');
    process.exit(1);
  }
  
  // 动态导入数据库服务
  console.log('正在连接数据库...');
  const { db } = await import('../src/lib/database');
  const { prompt } = await import('../src/drizzle-schema');
  const { eq, and, sql } = await import('drizzle-orm');
  console.log('数据库连接成功！\n');
  
  // 构建查询条件
  const conditions = [];
  if (spaceId) {
    conditions.push(eq(prompt.spaceId, spaceId));
  } else {
    // 默认只处理未公开的 prompts（isPublic=false）
    conditions.push(eq(prompt.isPublic, false));
  }
  
  // 获取所有需要处理的 prompts
  console.log('正在查询 prompts...');
  let prompts = await db.query.prompt.findMany({
    where: conditions.length > 0 ? and(...conditions) : undefined,
  });
  
  const totalFound = prompts.length;
  
  // 如果设置了最大处理数量，截取数组
  if (maxCount && prompts.length > maxCount) {
    prompts = prompts.slice(0, maxCount);
    console.log(`找到 ${totalFound} 条 prompts，本次处理前 ${maxCount} 条\n`);
  } else {
    console.log(`找到 ${prompts.length} 条 prompts 需要处理\n`);
  }
  
  if (prompts.length === 0) {
    console.log('没有需要处理的 prompts');
    return;
  }
  
  // 统计信息
  let processedCount = 0;
  let updatedCount = 0;
  let errorCount = 0;
  const results: { id: string; title: string; oldTags: string[]; newTags: string[]; oldDescription: string; newDescription: string }[] = [];
  
  // 分批处理（一次 API 调用处理整批数据）
  for (let i = 0; i < prompts.length; i += batchSize) {
    const batch = prompts.slice(i, i + batchSize);
    const batchNum = Math.floor(i / batchSize) + 1;
    const totalBatches = Math.ceil(prompts.length / batchSize);
    
    console.log(`\n========== 处理批次 ${batchNum}/${totalBatches}（${batch.length} 条）==========`);
    
    // 准备批量输入数据
    const batchInput: PromptInput[] = batch.map(p => ({
      id: p.id,
      title: p.title,
      content: p.content
    }));
    
    // 预处理：解析现有标签
    const existingTagsMap: Record<string, string[]> = {};
    for (const p of batch) {
      try {
        existingTagsMap[p.id] = p.tags ? JSON.parse(p.tags) : [];
      } catch {
        existingTagsMap[p.id] = [];
      }
    }
    
    try {
      // 批量调用 AI 生成标签和描述
      console.log(`正在调用 AI 批量生成 ${batch.length} 条提示词的标签和描述...`);
      const batchResults = await generateTagsForPromptBatch(batchInput);
      console.log(`AI 返回结果，开始处理...`);
      
      // 处理每条结果
      for (const p of batch) {
        processedCount++;
        const generated = batchResults[p.id] || { tags: [], description: '' };
        const existingTags = existingTagsMap[p.id] || [];
        
        // 检查是否有 imageGeneration 标签
        const hasImageGeneration = existingTags.includes('imageGeneration');
        
        // 合并标签：保留 imageGeneration（如果原来有），添加新生成的标签
        let newTags = [...generated.tags];
        if (hasImageGeneration && !newTags.includes('imageGeneration')) {
          newTags.push('imageGeneration');
        }
        
        // 去重
        newTags = [...new Set(newTags)];
        
        // 获取原有描述
        const oldDescription = p.description || '';
        const newDescription = generated.description || oldDescription;
        
        // 记录结果
        results.push({
          id: p.id,
          title: p.title,
          oldTags: existingTags,
          newTags: newTags,
          oldDescription: oldDescription,
          newDescription: newDescription
        });
        
        console.log(`[${processedCount}/${prompts.length}] ${p.title.substring(0, 40)}...`);
        console.log(`  原标签: [${existingTags.join(', ')}]`);
        console.log(`  新标签: [${newTags.join(', ')}]`);
        if (newDescription) {
          console.log(`  新描述: ${newDescription.substring(0, 50)}${newDescription.length > 50 ? '...' : ''}`);
        }
        
        // 更新数据库（如果不是 dry-run 模式）
        if (!dryRun && (newTags.length > 0 || newDescription)) {
          const updateData: { tags?: string; description?: string; isPublic: boolean; updatedAt: Date } = {
            isPublic: true,  // 处理后设为公开
            updatedAt: new Date()
          };
          
          if (newTags.length > 0) {
            updateData.tags = JSON.stringify(newTags);
          }
          
          if (newDescription) {
            updateData.description = newDescription;
          }
          
          await db.update(prompt)
            .set(updateData)
            .where(eq(prompt.id, p.id));
          updatedCount++;
        } else if (dryRun) {
          console.log(`  [预览] 将更新并设为公开`);
        }
      }
      
      console.log(`\n批次 ${batchNum} 处理完成，成功处理 ${batch.length} 条`);
      
    } catch (error) {
      errorCount += batch.length;
      console.error(`批次 ${batchNum} 处理失败:`, error);
    }
    
    // 批次间延迟
    if (i + batchSize < prompts.length) {
      console.log(`\n等待 3 秒后处理下一批...`);
      await delay(3000);
    }
  }
  
  // 输出统计信息
  console.log('\n========== 处理完成 ==========');
  console.log(`总处理数: ${processedCount}`);
  console.log(`成功更新: ${updatedCount}`);
  console.log(`错误数量: ${errorCount}`);
  
  // 保存结果日志
  const logFileName = `tags-generation-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
  const logPath = path.join(process.cwd(), 'logs', logFileName);
  
  // 确保 logs 目录存在
  const logsDir = path.join(process.cwd(), 'logs');
  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
  }
  
  fs.writeFileSync(logPath, JSON.stringify({
    timestamp: new Date().toISOString(),
    config: {
      spaceId,
      batchSize,
      dryRun
    },
    stats: {
      total: prompts.length,
      processed: processedCount,
      updated: updatedCount,
      errors: errorCount
    },
    results
  }, null, 2));
  
  console.log(`\n结果日志已保存到: ${logPath}`);
}

main().catch(console.error);