import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, Input } from './ui';
import PromptCard from './PromptCard';
import { fetchPrompts, fetchUserStats, getAuthToken, setAuthToken, apiRequest } from '../utils/api';
import { Prompt, UserStats } from '../types';
import { CONFIG } from '../config';

const SidePanelApp: React.FC = () => {
  const { t, i18n } = useTranslation();
  const [token, setToken] = useState<string | null>(null);
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 初始化配置到 localStorage
  useEffect(() => {
    // 将配置写入 chrome.storage.local
    if (chrome && chrome.storage && chrome.storage.local) {
      chrome.storage.local.set({ extension_config: CONFIG });
    } else {
      console.error('Chrome storage API not available');
    }
  }, []);

  // 加载认证 token
  useEffect(() => {
    loadAuthToken();
  }, []);

  // 加载 token 后获取数据
  useEffect(() => {
    if (token) {
      loadData();
      
      // 监听来自 background script 的消息
      const messageListener = (message: any, sender: any, sendResponse: any) => {
        if (message.action === 'dataUpdated' && message.type === 'prompts') {
          loadData(); // 重新加载提示词数据
        }
      };
      
      if (chrome && chrome.runtime && chrome.runtime.onMessage) {
        chrome.runtime.onMessage.addListener(messageListener);
      }
      
      return () => {
        if (chrome && chrome.runtime && chrome.runtime.onMessage) {
          chrome.runtime.onMessage.removeListener(messageListener);
        }
      };
    }
  }, [token]);

  const loadAuthToken = async () => {
    if (chrome && chrome.storage && chrome.storage.local) {
      try {
        const result: { authToken?: string } = await chrome.storage.local.get(['authToken']);
        const storedToken = result.authToken;
        
        if (storedToken) {
          setToken(storedToken);
          // 同步到 background script
          if (chrome.runtime && chrome.runtime.sendMessage) {
            chrome.runtime.sendMessage({ action: 'setAuthToken', token: storedToken });
          }
        } else {
          // 如果没有存储的 token，尝试从 background script 获取
          if (chrome.runtime && chrome.runtime.sendMessage) {
            chrome.runtime.sendMessage({ action: 'getAuthToken' }, (response: any) => {
              if (response && response.token) {
                setToken(response.token);
              } else {
                setError('No authentication token found. Please log in to the web app first.');
              }
            });
          }
        }
      } catch (err) {
        setError('Failed to load authentication token');
        console.error('Error loading token:', err);
      }
    } else {
      setError('Chrome storage API not available');
    }
  };

  const loadData = async () => {
    if (!token) return;
    
    try {
      setLoading(true);
      const [promptsData, statsData] = await Promise.all([
        fetchPrompts(token),
        fetchUserStats(token)
      ]);
      
      setPrompts(promptsData);
      setUserStats(statsData);
    } catch (err: any) {
      setError('Failed to load data');
      console.error('Error loading data:', err);
      setError(err.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleLanguageChange = (lang: string) => {
    i18n.changeLanguage(lang);
  };

  const handleLogout = async () => {
    // 清除本地存储的 token
    if (chrome && chrome.storage && chrome.storage.local) {
      await chrome.storage.local.remove(['authToken']);
    } else {
      console.error('Chrome storage API not available');
    }
    setToken(null);
    // 通知 background script 清除 token
    if (chrome && chrome.runtime && chrome.runtime.sendMessage) {
      chrome.runtime.sendMessage({ action: 'setAuthToken', token: null });
    } else {
      console.error('Chrome runtime API not available');
    }
  };

  const handleOpenWebApp = () => {
    if (chrome && chrome.tabs && chrome.tabs.create) {
      chrome.tabs.create({ url: `${CONFIG.WEB_APP_BASE_URL}/dashboard` }); // 使用配置中的基础URL
    } else {
      console.error('Chrome API not available');
    }
  };

  // 从localStorage获取token的函数
  const getAuthFromLocalStorage = async () => {
    console.log('getAuthFromLocalStorage called');
    try {
      // 检查API是否可用
      if (!chrome || !chrome.tabs || !chrome.tabs.create) {
        console.error('Chrome tabs API not available');
        setError('Chrome API not available');
        return;
      }
      
      if (!chrome.scripting) {
        console.error('Chrome scripting API not available');
        setError('Chrome scripting API not available');
        return;
      }
      
      // 打开目标网页
      const tab = await chrome.tabs.create({ url: CONFIG.WEB_APP_BASE_URL });
      console.log('Tab created:', tab.id);
      
      // 等待页面加载完成
      const checkTabLoaded = async (): Promise<void> => {
        return new Promise((resolve, reject) => {
          const interval = setInterval(async () => {
            try {
              const tabStatus = await chrome.tabs.get(tab.id!);
              console.log('Tab status:', tabStatus.status);
              if (tabStatus.status === 'complete') {
                clearInterval(interval);
                resolve();
              }
            } catch (error) {
              console.error('Error getting tab status:', error);
              clearInterval(interval);
              reject(error);
            }
          }, 500); // 每500ms检查一次
          
          // 设置超时
          setTimeout(() => {
            clearInterval(interval);
            reject(new Error('Tab loading timeout'));
          }, 10000); // 10秒超时
        });
      };
      
      try {
        await checkTabLoaded();
        
        // 等待一小段时间确保页面完全加载
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        console.log('Executing script in tab:', tab.id);
        
        // 使用 chrome.scripting.executeScript 从 localStorage 获取 auth-storage
        const results = await chrome.scripting.executeScript({
          target: { tabId: tab.id! },
          func: (key) => {
            console.log('Getting item from localStorage:', key);
            return window.localStorage.getItem(key);
          },
          args: ["auth-storage"]
        });

        console.log('Script execution results:', results);
        const localStorageValue = results[0].result;
        if (localStorageValue) {
          console.log('Found localStorage value:', localStorageValue);
          try {
            // 解析 auth-storage 值以获取 token
            const authData = JSON.parse(localStorageValue);
            const token = authData.state?.token;
            
            if (token) {
              console.log('Found token in auth-storage');
              // 保存 token
              setToken(token);
              await setAuthToken(token);
              
              // 重新加载数据
              loadData();
              
              // 关闭提示错误的界面
              setError(null);
              
              // 关闭刚刚打开的标签页
              try {
                await chrome.tabs.remove(tab.id!);
                console.log('Tab closed successfully');
              } catch (closeError) {
                console.error('Error closing tab:', closeError);
              }
            } else {
              setError('Token not found in localStorage auth-storage');
            }
          } catch (parseError) {
            console.error('Error parsing auth-storage:', parseError);
            setError('Failed to parse auth data from localStorage');
          }
        } else {
          setError('Auth data not found in localStorage');
        }
      } catch (scriptError: any) {
        console.error("执行脚本失败:", scriptError);
        setError('Failed to retrieve token from localStorage: ' + scriptError.message);
      } finally {
        // 确保标签页被关闭
        try {
          await chrome.tabs.remove(tab.id!);
          console.log('Tab closed in finally block');
        } catch (e) {
          // 如果标签页已关闭，则忽略错误
          console.log('Could not close tab (may already be closed)');
        }
      }
    } catch (err: any) {
      console.error('Error opening tab or getting auth data:', err);
      setError('Failed to open web app or retrieve auth data: ' + err.message);
    }
  };

  // 过滤提示词
  const filteredPrompts = prompts.filter(prompt => 
    prompt.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    prompt.content.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (error) {
    return (
      <div className="p-6 flex flex-col items-center justify-center min-h-[200px]">
        <h1 className="text-xl font-bold text-red-500">{t('appName')}</h1>
        <p className="text-red-500 mt-4 text-center">{error}</p>
        <button
          className="mt-6 px-5 py-3 bg-brand-blue hover:bg-brand-blue/90 text-white rounded-lg shadow-sm transition-all duration-200 font-medium"
          onClick={getAuthFromLocalStorage}
        >
          {t('retry')}
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 p-4 flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-r from-brand-blue to-indigo-600 rounded-lg flex items-center justify-center shadow-sm">
            <span className="text-white font-bold">P</span>
          </div>
          <h1 className="text-xl font-bold text-gray-900">{t('appName')}</h1>
        </div>
        
        <div className="flex items-center space-x-4">
          <select
            value={i18n.language}
            onChange={(e) => handleLanguageChange(e.target.value)}
            className="text-sm border border-gray-300 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-brand-blue focus:border-brand-blue"
          >
            <option value="en">EN</option>
            <option value="zh">中文</option>
          </select>
          
          <div className="relative group">
            <div className="w-9 h-9 bg-gradient-to-r from-gray-500 to-gray-700 rounded-full flex items-center justify-center cursor-pointer shadow-sm hover:shadow-md transition-shadow duration-200">
              <span className="text-white font-medium text-sm">U</span>
            </div>
            
            {/* Dropdown Menu */}
            <div className="absolute right-0 mt-2 w-52 bg-white border border-gray-200 rounded-xl shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10 transform origin-top-right scale-95 group-hover:scale-100">
              <div className="p-3 border-b border-gray-100 bg-gray-50 rounded-t-xl">
                <div className="text-sm font-medium text-gray-700">User Name</div>
                <div className="text-xs text-gray-500">user@example.com</div>
              </div>
              <button
                onClick={handleOpenWebApp}
                className="block w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-150 rounded-b-xl"
              >
                {t('openWebApp')}
              </button>
              <button
                onClick={handleLogout}
                className="block w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-150 rounded-b-xl"
              >
                {t('logout')}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Dashboard Stats */}
      {userStats && (
        <div className="p-4 grid grid-cols-2 gap-4 bg-gray-50">
          <Card className="p-5 rounded-xl shadow-sm border border-gray-100 transition-transform duration-200 hover:shadow-md">
            <h3 className="text-sm font-medium text-gray-600">{t('subscriptionStatus')}</h3>
            <p className="text-xl font-semibold mt-1 text-gray-900">{userStats.subscriptionStatus}</p>
          </Card>
          <Card className="p-5 rounded-xl shadow-sm border border-gray-100 transition-transform duration-200 hover:shadow-md">
            <h3 className="text-sm font-medium text-gray-600">{t('aiPoints')}</h3>
            <p className="text-xl font-semibold mt-1 text-gray-900">{userStats.subscriptionAiPoints}</p>
          </Card>
          <Card className="p-5 rounded-xl shadow-sm border border-gray-100 transition-transform duration-200 hover:shadow-md">
            <h3 className="text-sm font-medium text-gray-600">{t('myPromptsCount')}</h3>
            <p className="text-xl font-semibold mt-1 text-gray-900">{userStats.promptCount}</p>
          </Card>
          <Card className="p-5 rounded-xl shadow-sm border border-gray-100 transition-transform duration-200 hover:shadow-md">
            <h3 className="text-sm font-medium text-gray-600">{t('monthlyUsageCount')}</h3>
            <p className="text-xl font-semibold mt-1 text-gray-900">{userStats.monthlyUsageCount}</p>
          </Card>
        </div>
      )}

      {/* Search */}
      <div className="p-4 pb-2">
        <Input
          type="text"
          placeholder={t('searchPrompts')}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full rounded-lg border-gray-300 focus:border-brand-blue focus:ring-brand-blue text-base py-3 px-4 shadow-sm"
        />
      </div>

      {/* Prompts List */}
      <div className="flex-1 overflow-y-auto p-4 pt-2 bg-gray-50">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-brand-blue mb-2"></div>
              <p className="text-gray-600">{t('loading')}...</p>
            </div>
          </div>
        ) : filteredPrompts.length > 0 ? (
          <div className="space-y-3">
            {token ? (
              filteredPrompts.map((prompt) => (
                <PromptCard key={prompt.id} prompt={prompt} token={token} />
              ))
            ) : (
              <div className="text-center py-10 text-gray-500 bg-white rounded-xl shadow-sm p-6">
                {t('authenticationRequired')}
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-10 text-gray-500 bg-white rounded-xl shadow-sm p-6 mt-2">
            {searchTerm ? t('noPromptsFound') : t('noPromptsAvailable')}
          </div>
        )}
      </div>
    </div>
  );
};

export default SidePanelApp;