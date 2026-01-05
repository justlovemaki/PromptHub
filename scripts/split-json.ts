import * as fs from 'fs';
import * as path from 'path';

/**
 * 拆分大型 JSON 数组为多个小文件
 * 用法: npx tsx scripts/split-json.ts <输入文件路径> [每份大小]
 * 例如: npx tsx scripts/split-json.ts scripts/prompts.json 3000
 */

async function splitJson() {
  const inputFile = process.argv[2];
  const chunkSize = parseInt(process.argv[3] || '3000', 10);

  if (!inputFile) {
    console.error('错误: 请提供输入文件路径。');
    console.log('用法: npx tsx scripts/split-json.ts <输入文件路径> [每份大小]');
    process.exit(1);
  }

  const inputPath = path.resolve(process.cwd(), inputFile);

  if (!fs.existsSync(inputPath)) {
    console.error(`错误: 找不到文件 ${inputPath}`);
    process.exit(1);
  }

  try {
    console.log(`正在读取文件: ${inputFile}...`);
    const rawData = fs.readFileSync(inputPath, 'utf8');
    const data = JSON.parse(rawData);

    if (!Array.isArray(data)) {
      console.error('错误: JSON 数据必须是一个数组。');
      process.exit(1);
    }

    const totalItems = data.length;
    console.log(`总条数: ${totalItems}`);
    console.log(`每份大小: ${chunkSize}`);

    const outputDir = path.dirname(inputPath);
    const totalFiles = Math.ceil(totalItems / chunkSize);

    for (let i = 0; i < totalItems; i += chunkSize) {
      const chunk = data.slice(i, i + chunkSize);
      const fileIndex = Math.floor(i / chunkSize) + 1;
      const outputFileName = `output_${fileIndex}.json`;
      const outputPath = path.join(outputDir, outputFileName);

      fs.writeFileSync(outputPath, JSON.stringify(chunk, null, 2), 'utf8');
      console.log(`[${fileIndex}/${totalFiles}] 已保存 ${outputFileName} (${chunk.length} 条数据)`);
    }

    console.log('\n拆分完成！');
  } catch (error: any) {
    console.error(`处理文件时出错: ${error.message}`);
    process.exit(1);
  }
}

splitJson();
