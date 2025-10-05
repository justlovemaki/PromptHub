import React, { useState, useEffect, useRef } from 'react';
import { DropdownMenu } from './ui';
import { Card } from './ui';
import PromptCard from './PromptCard';
import KeyboardShortcutSettings from './KeyboardShortcutSettings';
import { fetchPrompts, fetchUserStats, fetchUserInfo, setAuthToken, fetchPromptTags, PromptTag, findTagByKey } from '../utils/api';
import { Prompt, UserStats, User, USER_ROLES } from '../types';
import { CONFIG } from '../config';

const API_BASE_URL = import.meta.env.VITE_WEB_APP_BASE_URL || ''

const SidePanelApp: React.FC = () => {
  const [token, setToken] = useState<string | null>(null);
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [userInfo, setUserInfo] = useState<User | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [allTags, setAllTags] = useState<PromptTag[]>([]);
  const [localizedTags, setLocalizedTags] = useState<Record<string, string>>({});
  const [showTagDropdown, setShowTagDropdown] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [activeTab, setActiveTab] = useState<'prompts' | 'usage'>('prompts'); // 添加标签页状态，保持默认为'prompts'，与原来一致
  // const [language, setLanguage] = useState('en'); // 直切读取浏览器配置
  const observer = useRef<IntersectionObserver | null>(null);
  const lastPromptRef = useRef<HTMLDivElement>(null);

  // 使用 chrome.i18n 替代 react-i18next 的 t 函数
  const t = (key: string): string => {
    return chrome.i18n.getMessage(key) || key;
  };

  // 初始化配置到 localStorage
  useEffect(() => {
    // 将配置写入 chrome.storage.local
    if (chrome && chrome.storage && chrome.storage.local) {
      CONFIG.WEB_APP_BASE_URL = API_BASE_URL;
      chrome.storage.local.set({ extension_config: CONFIG });
    } else {
      console.error('Chrome storage API not available');
    }
  }, []);

  // 加载认证 token
  useEffect(() => {
    loadAuthToken();
  }, []);

  // 加载标签本地化映射
  const loadTagLocalizations = async () => {
    if (token) {
      try {
        const promptTagsResponse = await fetchPromptTags(token);
        const fetchedTags = Array.isArray(promptTagsResponse.tags) ? promptTagsResponse.tags : [];
        setAllTags(fetchedTags);
        
        // 预加载这些标签的本地化文本
        const localizedTagsMap: Record<string, string> = {};
        for (const tag of fetchedTags) {
          const tagInfo = await findTagByKey(tag.name);
          localizedTagsMap[tag.name] = tagInfo?.name || tag.name;
        }
        setLocalizedTags(localizedTagsMap);
      } catch (error) {
        console.error('Error loading tag localizations:', error);
      }
    }
  };

  // 加载 token 后获取数据
  useEffect(() => {
    if (token && searchTerm === '') {
      loadData();
      // 同时加载标签本地化映射
      loadTagLocalizations();
    }
    
    // 监听来自 background script 的消息
    const messageListener = (message: any, sender: any, sendResponse: any) => {
      if (message.action === 'dataUpdated' && message.type === 'prompts') {
        loadData(); // 重新加载提示词数据
        // 同时重新加载标签本地化映射
        loadTagLocalizations();
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
  }, [token, searchTerm]); // 移除 activeTab 作为依赖

  // 在token变化时获取用户信息
  useEffect(() => {
    const loadUserInfo = async () => {
      if (token) {
        try {
          const userInfoData = await fetchUserInfo(token);
          setUserInfo(userInfoData);
        } catch (err) {
          console.error('Error loading user info:', err);
        }
      } else {
        setUserInfo(null); // 当token为空时清除用户信息
      }
    };

    loadUserInfo();
  }, [token]);

  // 添加滚动加载更多功能
  useEffect(() => {
    if (loading || loadingMore || !hasMore || activeTab !== 'prompts') return;

    const currentRef = lastPromptRef.current;

    const observerCallback: IntersectionObserverCallback = (entries) => {
      if (entries[0].isIntersecting && !loadingMore && hasMore) {
        setPage(prevPage => prevPage + 1);
      }
    };

    observer.current = new IntersectionObserver(observerCallback, {
      rootMargin: '100px' // 当距离底部100px时触发加载
    });

    if (currentRef) {
      observer.current.observe(currentRef);
    }

    return () => {
      if (observer.current && currentRef) {
        observer.current.unobserve(currentRef);
      }
    };
  }, [loading, loadingMore, hasMore, activeTab]);

  // 当页码变化时加载更多数据
  useEffect(() => {
    if (page > 1 && token) {
      loadData(false); // 不重置数据，只是加载更多
    }
  }, [page, token]);

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
                // 获取数据
                loadData();
                // 同时重新加载标签本地化映射
                loadTagLocalizations();
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

  const loadData = async (reset: boolean = true, withStats: boolean = true) => {
    if (!token) return;
    
    // 保存当前滚动位置
    const container = document.getElementById('prompts-list-container');
    const savedScrollTop = container ? container.scrollTop : 0;
    
    try {
      if (reset) {
        setLoading(true);
        setPage(1);
      } else {
        setLoadingMore(true);
      }
  
      const promptsData = await fetchPrompts(token, {
        page: reset ? 1 : page,
        limit: 10, // 每页加载10个提示词
        search: searchTerm,
        tag: selectedTag || '', // 添加标签过滤，如果为null则转换为undefined
        sortBy: 'useCount', // 默认按使用次数倒序查询
        sortOrder: 'desc'
      });
      
      if (reset) {
        setPrompts(promptsData.prompts);
        setHasMore(page < promptsData.totalPages);
      } else {
        setPrompts(prev => [...prev, ...promptsData.prompts]);
        setHasMore(page < promptsData.totalPages);
      }
      
      if(withStats){
        const statsData = await fetchUserStats(token, withStats);
        setUserStats(statsData);
      }
      
    } catch (err: any) {
      setError('Failed to load data');
      console.error('Error loading data:', err);
      handleLogout()
      setError(err.message || 'Failed to load data');
    } finally {
      setLoading(false);
      setLoadingMore(false);
      
      // 恢复之前的滚动位置（包括重置时也需要恢复，因为列表容器可能已经有滚动）
      if (container) {
        container.scrollTop = savedScrollTop;
      }
    }
  };

  // const handleLanguageChange = (lang: string) => {
  //   setLanguage(lang);
  //   // 在浏览器扩展中，通常语言切换会通过 chrome.i18n 自动处理
  //   // 但如果需要手动切换语言，可能需要重新加载扩展或执行其他操作
  // };

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
      console.log('Opening web app...',chrome.i18n.getUILanguage());
      if(chrome.i18n.getUILanguage().startsWith('zh')){
        chrome.tabs.create({ url: `${API_BASE_URL}/zh-CN/dashboard` });
      } else if(chrome.i18n.getUILanguage() === 'ja'){
        chrome.tabs.create({ url: `${API_BASE_URL}/ja/dashboard` });
      } else {
        chrome.tabs.create({ url: `${API_BASE_URL}/dashboard` }); // 使用配置中的基础URL
      }
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
      let tab = null;
      console.log('Opening web app...',chrome.i18n.getUILanguage());
      if(chrome.i18n.getUILanguage().startsWith('zh')){
        tab = await chrome.tabs.create({ url: `${API_BASE_URL}/zh-CN/` });
      } else if(chrome.i18n.getUILanguage() === 'ja'){
        tab = await chrome.tabs.create({ url: `${API_BASE_URL}/ja/` });
      } else {
        tab = await chrome.tabs.create({ url: `${API_BASE_URL}/` }); // 使用配置中的基础URL
      }
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
      
      // 检查localStorage中的token的函数
      const checkForToken = async (): Promise<string | null> => {
        try {
          // 使用 chrome.scripting.executeScript 从 localStorage 获取 auth-storage
          const results = await chrome.scripting.executeScript({
            target: { tabId: tab.id! },
            func: (key) => {
              return window.localStorage.getItem(key);
            },
            args: ["auth-storage"]
          });

          const localStorageValue = results[0].result;
          if (localStorageValue) {
            try {
              // 解析 auth-storage 值以获取 token
              const authData = JSON.parse(localStorageValue);
              const token = authData.state?.token;
              
              if (token) {
                console.log('Found token in auth-storage');
                return token;
              }
            } catch (parseError) {
              console.error('Error parsing auth-storage:', parseError);
            }
          }
          return null;
        } catch (scriptError: any) {
          console.error("执行脚本失败:", scriptError);
          return null;
        }
      };
      
      // 启动定时任务来持续检查token
      const startTokenPolling = () => {
        const pollInterval = setInterval(async () => {
          const token = await checkForToken();
          if (token) {
            // 找到token后，停止轮询
            clearInterval(pollInterval);
            
            // 保存 token
            setToken(token);
            await setAuthToken(token);
            
            // 重新加载数据
            loadData();
            
            // 关闭提示错误的界面
            setError(null);
            
            // 显示成功信息
            console.log('Token retrieved successfully, polling stopped');
          }
        }, 2000); // 每2秒检查一次
        
        // 返回interval ID，以便在需要时可以手动停止
        return pollInterval;
      };
      
      try {
        await checkTabLoaded();
        
        // 等待一小段时间确保页面完全加载
        await new Promise(resolve => setTimeout(resolve, 1000));
                
        // 立即检查一次
        const token = await checkForToken();
        if (token) {
          // 如果立即找到了token
          setToken(token);
          await setAuthToken(token);
                
          // 重新加载数据
          loadData();
                
          // 关闭提示错误的界面
          setError(null);
                
          // 关闭刚刚打开的标签页
          try {
            await chrome.tabs.remove(tab.id!);
            console.log('Tab closed successfully after immediate token found');
          } catch (closeError) {
            console.error('Error closing tab:', closeError);
          }
        } else {
          // 如果没找到token，开始轮询检查
          const pollInterval = startTokenPolling();
                
          // 监听标签页是否被关闭，如果关闭则停止轮询
          chrome.tabs.onRemoved.addListener(function onTabRemoved(removedTabId) {
            if (removedTabId === tab.id) {
              clearInterval(pollInterval);
              chrome.tabs.onRemoved.removeListener(onTabRemoved);
              console.log('Tab closed, polling stopped');
            }
          });
        }
      } catch (scriptError: any) {
        console.error("执行脚本失败:", scriptError);
        setError('Failed to retrieve token from localStorage: ' + scriptError.message);
                
        // 即使出错也要确保标签页被关闭
        try {
          await chrome.tabs.remove(tab.id!);
          console.log('Tab closed after error');
        } catch (e) {
          console.log('Could not close tab (may already be closed)');
        }
      }
    } catch (err: any) {
      console.error('Error opening tab or getting auth data:', err);
      setError('Failed to open web app or retrieve auth data: ' + err.message);
    }
  };

  // 搜索词或选中标签变化时使用防抖机制重新加载数据
  useEffect(() => {
    // 防止初始化时的空搜索触发加载
    if (!token || (searchTerm === '' && selectedTag === null)) return;
                
    // 使用防抖延迟来减少API调用频率
    const debounceTimer = setTimeout(() => {
      setPage(1); // 搜索时总是重置到第一页
      loadData(true, false); // 重新加载数据
    }, 500); // 有搜索词时延迟500ms
                
    // 清理定时器
    return () => clearTimeout(debounceTimer);
  }, [searchTerm, selectedTag, token]);
                  
  // 刷新数据的函数
  const handleRefresh = async () => {
    // 同时加载提示词数据、用户统计信息、户信息和标签数据
    if (token) {
      setLoading(true); // 开始加载时设置loading状态
      try {
                
        // 并行加载所有数据
        const [userInfoData] = await Promise.all([
          fetchUserInfo(token), // 同时获取用户信息
          loadData(true, true),
          loadTagLocalizations(),
        ]);
                
        // 更新所有状态
        setUserInfo(userInfoData);
      } catch (err: any) {
        setError('Failed to refresh data');
        console.error('Error refreshing data:', err);
        setError(err.message || 'Failed to refresh data');
      } finally {
        setLoading(false); // 结束加载状态
      }
    }
  };

  // 显示自己所有标签
  const handleGetTags = async () => {
    if(showTagDropdown){
      setShowTagDropdown(false);
      return;
    }
    setShowTagDropdown(true);
    return;
  };

  // 选择标签
  const handleSelectTag = (tag: string) => {
    setSelectedTag(tag);
    setShowTagDropdown(false); // 选择后关闭下拉菜单
  };

  // 清除选中的标签
  const handleClearTag = () => {
    setSelectedTag('');
  };

  // 直接使用从API获取的数据，搜索已在后端完成
  const displayedPrompts = prompts;

  if(!token){
    return (
      <div className="flex flex-col h-screen bg-gray-50">
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="text-center bg-white rounded-xl shadow-sm p-6 max-w-sm w-full">
            <div className="text-gray-500 mb-6">{t('authenticationRequired')}</div>
            <button
              className="px-5 py-3 bg-[var(--primary-100)] hover:bg-[var(--primary-100)]/90 text-white rounded-lg shadow-sm transition-all duration-200 font-medium w-full"
              onClick={getAuthFromLocalStorage}
            >
              {t('openWebApp')}
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 p-4 flex justify-between items-center">
        <div className="flex items-center space-x-3">
          {/* <div className="w-10 h-10 bg-gradient-to-r from-brand-blue to-indigo-600 rounded-lg flex items-center justify-center shadow-sm">
            <span className="text-white font-bold">P</span>
          </div> */}
          <h1 className="text-xl font-bold text-gray-900">{t('appName')}</h1>
        </div>
                
        <div className="flex items-center space-x-4">
          <button
            onClick={handleRefresh}
            className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors duration-200"
            title={t('refresh')}
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
          {/* <select
            value={language}
            onChange={(e) => handleLanguageChange(e.target.value)}
            className="text-sm border border-gray-300 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-brand-blue focus:border-brand-blue"
          >
            <option value="en">EN</option>
            <option value="zh">中文</option>
          </select> */}
                
          <DropdownMenu user={userInfo}>
            {/* Dropdown Menu */}
            <div className="absolute right-0 mt-2 w-52 bg-white border border-gray-200 rounded-xl shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10 transform origin-top-right scale-95 group-hover:scale-100">
              <div className="p-3 border-b border-gray-100 bg-gray-50 rounded-t-xl">
                <div className="text-sm font-medium text-gray-700">
                  {userInfo?.name || userInfo?.email?.split('@')[0] || 'User Name'}
                </div>
                <div className="text-xs text-gray-500">
                  {userInfo?.email || 'user@example.com'}
                </div>
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
          </DropdownMenu>
        </div>
      </header>
      
      {/* Tab Navigation */}
      <div className="flex border-b border-gray-200 bg-white px-4 pt-2 pb-1 mb-2">
        <button
          className={`px-4 py-2 font-medium text-sm rounded-t-lg transition-colors duration-200 ${
            activeTab === 'prompts'
              ? 'text-[var(--primary-100)] border-b-2 border-[var(--primary-100)] bg-white'
              : 'text-gray-600 hover:text-gray-900'
          }`}
          onClick={() => setActiveTab('prompts')}
        >
          {t('promptsTab') || '提示词'}
        </button>
        <button
          className={`px-4 py-2 font-medium text-sm rounded-t-lg transition-colors duration-200 ${
            activeTab === 'usage'
              ? 'text-[var(--primary-100)] border-b-2 border-[var(--primary-100)] bg-white'
              : 'text-gray-600 hover:text-gray-900'
          }`}
          onClick={() => setActiveTab('usage')}
        >
          {t('usageTab') || '使用方法'}
        </button>
      </div>

      {/* Dashboard Stats */}
      {userStats && activeTab === 'prompts' && (
        <div className="p-4 grid grid-cols-2 gap-4 bg-gray-50">
          {(userInfo?.role === USER_ROLES.ADMIN) && (
            <Card className="p-5 rounded-xl shadow-sm border border-gray-100 transition-transform duration-200 hover:shadow-md">
              <h3 className="text-sm font-medium text-gray-600">{t('subscriptionStatus')}</h3>
              <p className="text-xl font-semibold mt-1 text-gray-900">{userInfo?.subscriptionStatus}</p>
            </Card>
          )}
          {(userInfo?.role === USER_ROLES.ADMIN) && (
            <Card className="p-5 rounded-xl shadow-sm border border-gray-100 transition-transform duration-200 hover:shadow-md">
              <h3 className="text-sm font-medium text-gray-600">{t('aiPoints')}</h3>
              <p className="text-xl font-semibold mt-1 text-gray-900">{userStats.remainingCredits}</p>
            </Card>
          )}
          <Card className="p-5 rounded-xl shadow-sm border border-gray-100 transition-transform duration-200 hover:shadow-md">
            <h3 className="text-sm font-medium text-gray-600">{t('totalPrompts')}</h3>
            <p className="text-xl font-semibold mt-1 text-gray-900">{userStats.totalPrompts}</p>
          </Card>
          <Card className="p-5 rounded-xl shadow-sm border border-gray-100 transition-transform duration-200 hover:shadow-md">
            <h3 className="text-sm font-medium text-gray-600">{t('monthlyCreated')}</h3>
            <p className="text-xl font-semibold mt-1 text-gray-900">{userStats.monthlyCreated}</p>
          </Card>
          <Card className="p-5 rounded-xl shadow-sm border border-gray-100 transition-transform duration-200 hover:shadow-md">
            <h3 className="text-sm font-medium text-gray-600">{t('publicPrompts')}</h3>
            <p className="text-xl font-semibold mt-1 text-gray-900">{userStats.publicPrompts}</p>
          </Card>
          <Card className="p-5 rounded-xl shadow-sm border border-gray-100 transition-transform duration-200 hover:shadow-md">
            <h3 className="text-sm font-medium text-gray-600">{t('tagsCount')}</h3>
            <p className="text-xl font-semibold mt-1 text-gray-900">{userStats.tagsCount}</p>
          </Card>
        </div>
      )}

      {/* Search */}
      {activeTab === 'prompts' && (
        <div className="p-4 pb-2">
          <div className="relative">
            <input
              type="text"
              placeholder={t('searchPrompts')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary-100)] focus:border-[var(--primary-100)] transition-all duration-200 text-base pr-24" // 增加右侧内边距为按钮留出空间
            />
                
            {/* 标签选择按钮 */}
            <button
              onClick={handleGetTags}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded-md transition-colors duration-200"
              title={t('selectTag')}
            >
              {selectedTag ? (
                <span className="text-[var(--primary-100)] font-medium">{localizedTags[selectedTag] || selectedTag}</span>
              ) : (
                <span className="text-gray-600">#</span>
              )}
            </button>
                
            {/* 清除标签按钮 */}
            {selectedTag && (
              <button
                onClick={handleClearTag}
                className="absolute right-0 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                title={t('clearTag')}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
                
          {/* 标签下拉菜单 */}
          {showTagDropdown && (
            <div className="mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-10 max-h-60 overflow-y-auto">
              <div className="p-2">
                <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">{t('promptTags')}</div>
                {allTags.length > 0 ? (
                  allTags.map((tag) => (
                    <div
                      key={tag.name}
                      onClick={() => handleSelectTag(tag.name)}
                      className={`px-3 py-2 rounded cursor-pointer mb-1 text-sm ${
                        selectedTag === tag.name
                          ? 'bg-blue-100 text-blue-700 font-medium'
                          : 'hover:bg-gray-100 text-gray-700'
                      }`}
                    >
                      {localizedTags[tag.name] || tag.name}
                    </div>
                  ))
                ) : (
                  <div className="px-3 py-2 text-sm text-gray-500">{t('noTagsAvailable')}</div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Prompts List */}
      <div id="prompts-list-container" className="flex-1 overflow-y-auto p-4 pt-2 bg-gray-50">
        {activeTab === 'prompts' && (
          <>
            {loading && !error ? (
              <div className="flex items-center justify-center h-32">
                <div className="text-center">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[var(--primary-100)] mb-2"></div>
                  <p className="text-gray-600">{t('loading')}...</p>
                </div>
              </div>
            ) : displayedPrompts.length > 0 ? (
              <div className="space-y-3">
                {token && (
                  displayedPrompts.map((prompt, index) => {
                    // 为列表的最后一项添加ref，以便用于无限滚动
                    if (index === displayedPrompts.length - 1) {
                      return (
                        <div ref={lastPromptRef} key={prompt.id}>
                          <PromptCard prompt={prompt} token={token} localizedTagsMap={localizedTags} />
                        </div>
                      );
                    } else {
                      return <PromptCard key={prompt.id} prompt={prompt} token={token} localizedTagsMap={localizedTags} />;
                    }
                  })
                )}
              </div>
            ) : (
              <div className="text-center py-10 text-gray-500 bg-white rounded-xl shadow-sm p-6 mt-2">
                {searchTerm ? t('noPromptsFound') : t('noPromptsAvailable')}
              </div>
            )}
            {/* 加载更多指示器 */}
            {loadingMore && (
              <div className="flex items-center justify-center mt-4 py-4">
                <div className="inline-block animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-[var(--primary-100)] mr-3"></div>
                <span className="text-gray-600">{t('loadingMore')}...</span>
              </div>
            )}
            {!loadingMore && !hasMore && displayedPrompts.length > 0 && (
              <div className="text-center py-4 text-gray-500">
                {t('noMorePrompts')}
              </div>
            )}
          </>
        )}
        
        {activeTab === 'usage' && (
          <div className="p-4 space-y-4">
            <Card className="p-5 rounded-xl shadow-sm border border-gray-100 transition-transform duration-200 hover:shadow-md">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">{t('usageExamples') || '使用示例'}</h3>
              <div className="space-y-3 text-gray-700">
                <p>{t('usageExample1') || '1. 在任何网页中选中文本，右键选择"快速导入为提示词"来创建新的提示词。'}</p>
                <p>{t('usageExample2') || '2. 点击提示词卡片的"使用"按钮，提示词内容将自动填入当前页面的输入框。'}</p>
                <p>{t('usageExample3') || '3. 在提示词中使用 {{variable}} 语法添加变量，使提示词更灵活'}</p>
                <p>{t('usageExample4') || '4. 使用标签对提示词进行分类管理，便于查找和使用'}</p>
              </div>
            </Card>
            
            <Card className="p-5 rounded-xl shadow-sm border border-gray-100 transition-transform duration-200 hover:shadow-md">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">{t('keyboardShortcuts') || '快捷键'}</h3>
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-2 text-gray-700">
                  <KeyboardShortcutSettings />
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default SidePanelApp;