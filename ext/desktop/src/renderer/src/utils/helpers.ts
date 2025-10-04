// 辅助工具函数

// 复制文本到剪贴板
export const copyToClipboard = async (text: string): Promise<void> => {
  try {
    await navigator.clipboard.writeText(text);
    console.log('文本已复制到剪贴板');
  } catch (err) {
    console.error('复制文本失败: ', err);
    // 降级方案：使用 execCommand（虽然已废弃，但在某些环境中仍有效）
    const textArea = document.createElement('textarea');
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
      const successful = document.execCommand('copy');
      if (successful) {
        console.log('使用 execCommand 成功复制文本');
      } else {
        console.error('使用 execCommand 复制文本失败');
      }
    } catch (execErr) {
      console.error('复制到剪贴板时发生异常: ', execErr);
    }
    document.body.removeChild(textArea);
  }
};

// 处理包含变量的提示词
export const processPromptWithVariables = (content: string, variables: Record<string, string>): string => {
  let processedContent = content;
  
  // 遍历所有变量并替换
  Object.keys(variables).forEach(key => {
    const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
    processedContent = processedContent.replace(regex, variables[key]);
  });
  
  return processedContent;
};

// 提取提示词中的变量
export const extractVariables = (content: string): string[] => {
  const regex = /{{(.*?)}}/g;
  const matches = [];
  let match;
  while ((match = regex.exec(content)) !== null) {
    matches.push(match[1].trim());
  }
  return Array.from(new Set(matches)); // 去重
};