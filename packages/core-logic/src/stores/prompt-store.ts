import type { 
  Prompt, 
  CreatePromptRequest, 
  UpdatePromptRequest, 
  DeletePromptRequest,
  PromptListQuery,
  PromptListResponse,
  SSEEvent 
} from '../types';

// ============== 提示词状态接口 ==============

export interface PromptState {
  // 状态
  prompts: Prompt[];
  currentPrompt: Prompt | null;
  isLoading: boolean;
  error: string | null;
  
  // 分页信息
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  
  // 查询参数
  query: PromptListQuery;
  
  // 操作
  fetchPrompts: (query?: PromptListQuery) => Promise<void>;
  createPrompt: (data: CreatePromptRequest) => Promise<boolean>;
  updatePrompt: (data: UpdatePromptRequest) => Promise<boolean>;
  deletePrompt: (id: string) => Promise<boolean>;
  getPrompt: (id: string) => Promise<void>;
  
  // 搜索和筛选
  setSearch: (search: string) => void;
  setTags: (tags: string[]) => void;
  setPage: (page: number) => void;
  setSortBy: (sortBy: PromptListQuery['sortBy']) => void;
  setSortOrder: (sortOrder: PromptListQuery['sortOrder']) => void;
  
  // SSE 实时更新
  handleSSEEvent: (event: SSEEvent) => void;
  
  // 内部方法
  setPrompts: (prompts: Prompt[]) => void;
  addPrompt: (prompt: Prompt) => void;
  updatePromptInList: (prompt: Prompt) => void;
  removePrompt: (id: string) => void;
  setCurrentPrompt: (prompt: Prompt | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setPagination: (pagination: Partial<PromptState['pagination']>) => void;
  setQuery: (query: Partial<PromptListQuery>) => void;
  clearError: () => void;
}

// TODO: 实现Zustand store当依赖安装后
// export const usePromptStore = create<PromptState>()(...);

// ============== 便捷 Hooks ==============

// TODO: 实现hooks当store创建后
/*
export const usePrompts = () => {
  // 实现逻辑
};

export const usePromptActions = () => {
  // 实现逻辑
};

export const usePromptQuery = () => {
  // 实现逻辑
};

export const useCurrentPrompt = () => {
  // 实现逻辑
};
*/

// ============== 辅助函数 ==============

// 提示词变量解析
export const parsePromptVariables = (content: string): string[] => {
  const regex = /\{\{([^}]+)\}\}/g;
  const variables: string[] = [];
  let match;
  
  while ((match = regex.exec(content)) !== null) {
    const variable = match[1].trim();
    if (!variables.includes(variable)) {
      variables.push(variable);
    }
  }
  
  return variables;
};

// 替换提示词变量
export const replacePromptVariables = (
  content: string,
  variables: Record<string, string>
): string => {
  let result = content;
  
  Object.entries(variables).forEach(([key, value]) => {
    const regex = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'g');
    result = result.replace(regex, value);
  });
  
  return result;
};

// 替换提示词变量（预览版本 - 只替换非空值）
export const replacePromptVariablesForPreview = (
  content: string,
  variables: Record<string, string>
): string => {
  let result = content;
  
  Object.entries(variables).forEach(([key, value]) => {
    // 只有当值不为空时才进行替换
    if (value && value.trim()) {
      const regex = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'g');
      result = result.replace(regex, value);
    }
  });
  
  return result;
};

// 验证提示词内容
export const validatePromptContent = (content: string): {
  isValid: boolean;
  errors: string[];
  variables: string[];
} => {
  const errors: string[] = [];
  const variables = parsePromptVariables(content);
  
  // 检查内容是否为空
  if (!content.trim()) {
    errors.push('提示词内容不能为空');
  }
  
  // 检查是否有未闭合的变量语法
  const openBraces = (content.match(/\{\{/g) || []).length;
  const closeBraces = (content.match(/\}\}/g) || []).length;
  
  if (openBraces !== closeBraces) {
    errors.push('变量语法不完整，请检查 {{}} 是否配对');
  }
  
  // 检查变量名是否有效
  variables.forEach(variable => {
    if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(variable)) {
      errors.push(`变量名 "${variable}" 无效，只能包含字母、数字和下划线，且不能以数字开头`);
    }
  });
  
  return {
    isValid: errors.length === 0,
    errors,
    variables,
  };
};

// 提示词标签处理
export const parsePromptTags = (tagsString: string): string[] => {
  try {
    if (!tagsString) return [];
    return JSON.parse(tagsString);
  } catch {
    // 如果不是有效的JSON，尝试按逗号分割
    return tagsString.split(',').map(tag => tag.trim()).filter(Boolean);
  }
};

export const stringifyPromptTags = (tags: string[]): string => {
  return JSON.stringify(tags);
};

// 提示词搜索匹配
export const matchPromptSearch = (prompt: Prompt, searchTerm: string): boolean => {
  if (!searchTerm) return true;
  
  const search = searchTerm.toLowerCase();
  const title = prompt.title?.toLowerCase() || '';
  const content = prompt.content?.toLowerCase() || '';
  const description = prompt.description?.toLowerCase() || '';
  
  // 处理tags字段，确保类型安全
  let tagsText = '';
  if (prompt.tags) {
    if (Array.isArray(prompt.tags)) {
      // 如果已经是数组，直接使用
      tagsText = prompt.tags.join(' ').toLowerCase();
    } else if (typeof prompt.tags === 'string') {
      // 如果是字符串，解析后再使用
      tagsText = parsePromptTags(prompt.tags).join(' ').toLowerCase();
    }
  }
  
  return title.includes(search) || 
         content.includes(search) || 
         description.includes(search) || 
         tagsText.includes(search);
};

// 提示词排序
export const sortPrompts = (
  prompts: Prompt[], 
  sortBy: PromptListQuery['sortBy'] = 'updatedAt',
  sortOrder: PromptListQuery['sortOrder'] = 'desc'
): Prompt[] => {
  return [...prompts].sort((a, b) => {
    let aValue: any = a[sortBy];
    let bValue: any = b[sortBy];
    
    // 处理日期类型
    if (sortBy === 'createdAt' || sortBy === 'updatedAt') {
      aValue = new Date(aValue).getTime();
      bValue = new Date(bValue).getTime();
    }
    
    // 处理字符串类型
    if (typeof aValue === 'string') {
      aValue = aValue.toLowerCase();
      bValue = bValue.toLowerCase();
    }
    
    let comparison = 0;
    if (aValue < bValue) {
      comparison = -1;
    } else if (aValue > bValue) {
      comparison = 1;
    }
    
    return sortOrder === 'desc' ? -comparison : comparison;
  });
};

// 提示词统计
export const getPromptStats = (prompts: Prompt[]) => {
  const total = prompts.length;
  const publicPrompts = prompts.filter(p => p.isPublic).length;
  const privatePrompts = total - publicPrompts;
  const totalUseCount = prompts.reduce((sum, p) => sum + (p.useCount || 0), 0);
  const avgUseCount = total > 0 ? totalUseCount / total : 0;
  
  // 处理tags字段，确保类型安全
  const allTags = prompts.flatMap(p => {
    if (!p.tags) return [];
    if (Array.isArray(p.tags)) {
      return p.tags;
    } else if (typeof p.tags === 'string') {
      return parsePromptTags(p.tags);
    }
    return [];
  });
  
  const tagCounts = allTags.reduce((acc, tag) => {
    acc[tag] = (acc[tag] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  const popularTags = Object.entries(tagCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([tag, count]) => ({ tag, count }));
  
  return {
    total,
    publicPrompts,
    privatePrompts,
    totalUseCount,
    avgUseCount,
    popularTags,
    tagCounts,
  };
};