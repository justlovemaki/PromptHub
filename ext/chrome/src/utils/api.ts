// API 工具函数
import { Prompt, UserStats } from '../types';
import { CONFIG } from '../config';

const API_BASE_URL = CONFIG.WEB_APP_BASE_URL;

// 通过后台服务工作线程发送API请求
const sendApiRequest = async (url: string, method: string, token: string, data?: any): Promise<any> => {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage({
      action: 'apiRequest',
      url: API_BASE_URL + url,
      method: method,
      data: data
    }, (response) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
      } else if (response && response.error) {
        reject(new Error(response.error));
      } else {
        resolve(response.data);
      }
    });
  });
};

// 获取提示词列表
export const fetchPrompts = async (token: string): Promise<Prompt[]> => {
  try {
    const data = await sendApiRequest(CONFIG.ENDPOINTS.PROMPTS_LIST, 'GET', token);
    return data.data.prompts || [];
  } catch (error) {
    throw new Error(`Failed to fetch prompts: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

// 获取用户统计信息 - 使用仪表盘统计端点
export const fetchUserStats = async (token: string): Promise<UserStats> => {
  try {
    const data = await sendApiRequest(CONFIG.ENDPOINTS.USER_STATS, 'GET', token);
    // 将仪表盘数据转换为UserStats格式
    if (data.success && data.data) {
      const dashboardData = data.data;
      return {
        subscriptionStatus: dashboardData.subscriptionStatus || dashboardData.subscriptionStatus || 'FREE',
        subscriptionAiPoints: dashboardData.subscriptionAiPoints || dashboardData.remainingCredits || 0,
        promptCount: dashboardData.totalPrompts || 0,
        monthlyUsageCount: dashboardData.monthlyCreated || 0,
        totalPrompts: dashboardData.totalPrompts,
        monthlyCreated: dashboardData.monthlyCreated,
        remainingCredits: dashboardData.remainingCredits,
        tagsCount: dashboardData.tagsCount,
        recentPrompts: dashboardData.recentPrompts
      };
    } else {
      throw new Error(data.message || 'Invalid response format');
    }
  } catch (error) {
    throw new Error(`Failed to fetch user stats: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

// 通用 API 请求函数
export const apiRequest = async (
  url: string,
  method: string,
  token: string,
  data?: any
): Promise<any> => {
  try {
    return await sendApiRequest(url, method, token, data);
  } catch (error) {
    throw new Error(`API request failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

// 获取认证 token
export const getAuthToken = async (): Promise<string | null> => {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage({ action: 'getAuthToken' }, (response) => {
      resolve(response?.token || null);
    });
  });
};

// 设置认证 token
export const setAuthToken = async (token: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage({ action: 'setAuthToken', token }, (response) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
      } else if (response && response.error) {
        reject(new Error(response.error));
      } else {
        resolve();
      }
    });
  });
};

// 增加提示词使用次数
export const incrementPromptUsage = async (token: string, promptId: string): Promise<void> => {
  try {
    const data = await sendApiRequest(CONFIG.ENDPOINTS.PROMPTS_USE, 'POST', token, { promptId });
    if (!data.success) {
      throw new Error(data.message || 'Failed to increment prompt usage');
    }
  } catch (error) {
    throw new Error(`Failed to increment prompt usage: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

// 创建提示词
export const createPrompt = async (
  token: string,
  promptData: { title: string; content: string; description?: string; tags?: string[]; isPublic?: boolean }
): Promise<Prompt> => {
  try {
    const data = await sendApiRequest(CONFIG.ENDPOINTS.PROMPTS_CREATE, 'POST', token, promptData);
    if (!data.success) {
      throw new Error(data.message || 'Failed to create prompt');
    }

    // 处理返回的提示词数据
    const createdPrompt = data.data;
    return {
      ...createdPrompt,
      createdAt: new Date(createdPrompt.createdAt),
      updatedAt: new Date(createdPrompt.updatedAt),
      tags: createdPrompt.tags || [],
      isPublic: createdPrompt.isPublic || false,
      useCount: createdPrompt.useCount || 0
    };
  } catch (error) {
    throw new Error(`Failed to create prompt: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

// 更新提示词
export const updatePrompt = async (
  token: string,
  promptId: string,
  updateData: { title?: string; content?: string; description?: string; tags?: string[]; isPublic?: boolean }
): Promise<Prompt> => {
  try {
    const data = await sendApiRequest(CONFIG.ENDPOINTS.PROMPTS_UPDATE, 'POST', token, { id: promptId, ...updateData });
    if (!data.success) {
      throw new Error(data.message || 'Failed to update prompt');
    }

    // 处理返回的提示词数据
    const updatedPrompt = data.data;
    return {
      ...updatedPrompt,
      createdAt: new Date(updatedPrompt.createdAt),
      updatedAt: new Date(updatedPrompt.updatedAt),
      tags: updatedPrompt.tags || [],
      isPublic: updatedPrompt.isPublic || false,
      useCount: updatedPrompt.useCount || 0
    };
  } catch (error) {
    throw new Error(`Failed to update prompt: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

// 删除提示词
export const deletePrompt = async (token: string, promptId: string): Promise<void> => {
  try {
    const data = await sendApiRequest(CONFIG.ENDPOINTS.PROMPTS_DELETE, 'POST', token, { id: promptId });
    if (!data.success) {
      throw new Error(data.message || 'Failed to delete prompt');
    }
  } catch (error) {
    throw new Error(`Failed to delete prompt: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};