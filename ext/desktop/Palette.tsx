import React, { useState, useEffect, useRef } from 'react';
import { Card } from './components/ui';
import PromptCard from './components/PromptCard';
import type { Prompt, UserStats, UserInfo, PromptTag } from './types/types';
import { API_CONFIG } from './config';
import { findTagByKey } from './utils/tags';
import { initI18n, t, getCurrentLanguage, setLanguage, getLanguageDisplayName, SUPPORTED_LANGUAGES, type SupportedLanguage } from './utils/i18n';
import { getCurrentLanguageBaseUrl } from './config';

// 直接导入electron
const { ipcRenderer, shell } = require('electron');

const CommandPalette: React.FC = () => {
  const [currentLang, setCurrentLang] = useState<SupportedLanguage>(() => initI18n());
  const [token, setToken] = useState<string | null>(null);
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [allTags, setAllTags] = useState<PromptTag[]>([]);
  const [localizedTags, setLocalizedTags] = useState<Record<string, string>>({});
  const [showTagDropdown, setShowTagDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [activeTab, setActiveTab] = useState<'prompts' | 'usage'>('prompts');
  const [showTokenPage, setShowTokenPage] = useState(false);
  const [tokenInput, setTokenInput] = useState('');
  const [isAlwaysOnTop, setIsAlwaysOnTop] = useState(false);
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);
  
  const observer = useRef<IntersectionObserver | null>(null);
  const lastPromptRef = useRef<HTMLDivElement>(null);

  // 语言切换处理函数
  const handleLanguageChange = (lang: SupportedLanguage) => {
    setLanguage(lang);
    setCurrentLang(lang);
    setShowLanguageDropdown(false);
    // 强制重新渲染以更新所有文案
    window.location.reload();
  };

  // 关闭窗口
  const handleClose = () => {
    console.log('点击关闭按钮');
    ipcRenderer.send('hide-window');
  };

  // 打开获取Token的URL
  const openTokenUrl = () => {
    const baseUrl = getCurrentLanguageBaseUrl(currentLang);
    const tokenUrl = `${baseUrl}/account`;
    shell.openExternal(tokenUrl);
  };

  // 切换置顶状态
  const handleToggleAlwaysOnTop = async () => {
    const newState = await ipcRenderer.invoke('toggle-always-on-top');
    setIsAlwaysOnTop(newState);
  };

  // 检查是否存在认证Token
  useEffect(() => {
    loadAuthToken();
  }, []);

  // 加载认证 token
  const loadAuthToken = async () => {
    try {
      const storedToken = await ipcRenderer.invoke('get-auth-token');
      if (storedToken) {
        setToken(storedToken);
        setShowTokenPage(false);
      } else {
        setShowTokenPage(true);
      }
    } catch (error) {
      console.error('检查认证Token失败:', error);
      setShowTokenPage(true);
    }
  };

  // 加载标签本地化映射
  const loadTagLocalizations = async () => {
    if (token) {
      try {
        const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.PROMPTS_TAGS}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data) {
            const fetchedTags = Array.isArray(data.data) ? data.data : [];
            setAllTags(fetchedTags);
            
            // 预加载这些标签的本地化文本
            const localizedTagsMap: Record<string, string> = {};
            for (const tag of fetchedTags) {
              const tagInfo = await findTagByKey(tag.name);
              localizedTagsMap[tag.name] = tagInfo?.name || tag.name;
            }
            setLocalizedTags(localizedTagsMap);
          }
        } else if (response.status === 401) {
          // 401错误，显示token设置页面
          setShowTokenPage(true);
          const errorData = await response.json();
          setError(errorData.message || t('tokenValidationFailed'));
        }
      } catch (error) {
        console.error('加载标签失败:', error);
      }
    }
  };

  // 加载数据
  const loadData = async (reset: boolean = true, withStats: boolean = true) => {
    if (!token) return;
    
    try {
      if (reset) {
        setLoading(true);
        setPage(1);
      } else {
        setLoadingMore(true);
      }
  
      // 构建查询参数
      const queryParams = new URLSearchParams();
      queryParams.append('page', (reset ? 1 : page).toString());
      queryParams.append('limit', '10');
      queryParams.append('sortBy', 'useCount');
      queryParams.append('sortOrder', 'desc');
      if (searchTerm) queryParams.append('search', searchTerm);
      if (selectedTag) queryParams.append('tag', selectedTag);
      
      const promptsResponse = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.PROMPTS_LIST}?${queryParams.toString()}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      });
      
      if (promptsResponse.ok) {
        const promptsData = await promptsResponse.json();
        if (promptsData.success && promptsData.data) {
          if (reset) {
            setPrompts(promptsData.data.prompts || []);
            setHasMore(page < (promptsData.data.totalPages || 1));
          } else {
            setPrompts(prev => [...prev, ...(promptsData.data.prompts || [])]);
            setHasMore(page < (promptsData.data.totalPages || 1));
          }
        }
      } else if (promptsResponse.status === 401) {
        // 401错误，显示token设置页面
        setShowTokenPage(true);
        const errorData = await promptsResponse.json();
        setError(errorData.message || t('tokenValidationFailed'));
        return; // 退出函数，避免继续执行
      }
      
      if (withStats) {
        const statsResponse = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.USER_STATS}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          }
        });
        
        if (statsResponse.ok) {
          const statsData = await statsResponse.json();
          if (statsData.success && statsData.data) {
            setUserStats(statsData.data);
          }
        } else if (statsResponse.status === 401) {
          // 401错误，显示token设置页面
          setShowTokenPage(true);
          const errorData = await statsResponse.json();
          setError(errorData.message || t('tokenValidationFailed'));
          return; // 退出函数，避免继续执行
        }
      }
      
      setError(null);
    } catch (err: any) {
      if (!showTokenPage) { // 只有在没有显示token页面时才设置一般错误
        setError('加载数据失败');
      }
      console.error('加载数据时出错:', err);
    } finally {
      if (!showTokenPage) { // 只有在没有显示token页面时才更新加载状态
        setLoading(false);
        setLoadingMore(false);
      }
    }
  };

  // 加载用户信息
  const loadUserInfo = async () => {
    if (token) {
      try {
        const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.USER_INFO}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data) {
            setUserInfo(data.data);
          }
        } else if (response.status === 401) {
          // 401错误，显示token设置页面
          setShowTokenPage(true);
          const errorData = await response.json();
          setError(errorData.message || t('tokenValidationFailed'));
        }
      } catch (err) {
        console.error('加载用户信息失败:', err);
      }
    }
  };

  // token变化时加载数据
  useEffect(() => {
    if (token && !showTokenPage) {
      loadData();
      loadTagLocalizations();
      loadUserInfo();
    }
  }, [token, showTokenPage]);

  // 搜索词或选中标签变化时重新加载数据
  useEffect(() => {
    if (!token || showTokenPage) return;
    
    const debounceTimer = setTimeout(() => {
      setPage(1);
      loadData(true, false);
    }, 500);
    
    return () => clearTimeout(debounceTimer);
  }, [searchTerm, selectedTag]);

  // 添加滚动加载更多功能
  useEffect(() => {
    if (loading || loadingMore || !hasMore || showTokenPage) return;

    const currentRef = lastPromptRef.current;

    const observerCallback: IntersectionObserverCallback = (entries) => {
      if (entries[0].isIntersecting && !loadingMore && hasMore) {
        setPage(prevPage => prevPage + 1);
      }
    };

    observer.current = new IntersectionObserver(observerCallback, {
      rootMargin: '100px'
    });

    if (currentRef) {
      observer.current.observe(currentRef);
    }

    return () => {
      if (observer.current && currentRef) {
        observer.current.unobserve(currentRef);
      }
    };
  }, [loading, loadingMore, hasMore, showTokenPage]);

  // 当页码变化时加载更多数据
  useEffect(() => {
    if (page > 1 && token && !showTokenPage) {
      loadData(false);
    }
  }, [page]);

  // 保存Token
  const saveToken = async () => {
    if (!tokenInput.trim()) {
      setError(t('enterValidToken'));
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      // 验证Token
      const queryParams = new URLSearchParams();
      queryParams.append('page', '1');
      queryParams.append('limit', '10');
      queryParams.append('sortBy', 'useCount');
      queryParams.append('sortOrder', 'desc');
      
      const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.PROMPTS_LIST}?${queryParams.toString()}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${tokenInput.trim()}`,
          'Content-Type': 'application/json',
        }
      });
      
      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          const errorData = await response.json();
          setError(errorData.message || t('tokenValidationFailed'));
          setShowTokenPage(true); // 显示token设置页面
        } else {
          setError(t('cannotConnectServer'));
        }
        return;
      }
      
      // 保存Token
      await ipcRenderer.invoke('set-auth-token', tokenInput.trim());
      setToken(tokenInput.trim());
      setShowTokenPage(false);
    } catch (error) {
      setError(t('tokenValidationFailed'));
      console.error('Token验证失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 刷新数据
  const handleRefresh = async () => {
    if (token) {
      setLoading(true);
      setError(null);
      try {
        // 按顺序加载数据，确保401错误能被正确处理
        await loadData(true, true);
        if (!showTokenPage) { // 如果没有显示token页面，继续加载其他数据
          await loadTagLocalizations();
          await loadUserInfo();
        }
      } catch (err: any) {
        if (!showTokenPage) { // 只有在没有因为401错误显示token页面时才显示一般错误
          setError(t('refreshData'));
          console.error('刷新数据时出错:', err);
        }
      } finally {
        setLoading(false);
      }
    }
  };

  // 显示标签下拉菜单
  const handleGetTags = async () => {
    setShowTagDropdown(!showTagDropdown);
  };

  // 选择标签
  const handleSelectTag = (tag: string) => {
    setSelectedTag(tag);
    setShowTagDropdown(false);
  };

  // 清除选中的标签
  const handleClearTag = () => {
    setSelectedTag('');
  };

  // 注销
  const handleLogout = async () => {
    await ipcRenderer.invoke('set-auth-token', null);
    setToken(null);
    setShowTokenPage(true);
  };

  // 过滤后的提示词列表
  const displayedPrompts = prompts;

  // Token设置页面
  if (showTokenPage) {
    return (
      <div className="app-container">
        <div className="title-bar">
          <div className="title-bar-draggable">
            <span className="title-bar-text">{t('appName')}</span>
          </div>
          <button
            className={`title-bar-pin border-none border-transparent ${isAlwaysOnTop ? 'active' : ''}`}
            onClick={handleToggleAlwaysOnTop}
            title={isAlwaysOnTop ? t('unpinWindow') : t('pinWindow')}
          >
            📌
          </button>
          <button className="title-bar-close border-none border-transparent" onClick={handleClose}>
            ×
          </button>
        </div>
        <div className="token-page page">
          <h2>{t('setAccessToken')}</h2>
          <input
            type="password"
            placeholder={t('enterToken')}
            value={tokenInput}
            onChange={(e) => setTokenInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && saveToken()}
            autoFocus
            className="token-input"
          />
          <div className="token-buttons">
            <button onClick={saveToken} className="save-token-btn border-none border-transparent" disabled={loading}>
              {loading ? t('validating') : t('saveAndGetPrompts')}
            </button>
            {token && (
              <button
                onClick={() => {
                  setShowTokenPage(false);
                  setSearchTerm('');
                }}
                className="skip-btn border-none border-transparent"
              >
                {t('skipUseCurrent')}
              </button>
            )}
          </div>
          {error && <p className="error-message">{error}</p>}
          <p className="token-info">{t('tokenInfo')} - <a href="#" onClick={(e) => { e.preventDefault(); openTokenUrl(); }} className="text-blue-600 hover:text-blue-800 underline">{t('clickHere')}</a></p>
        </div>
      </div>
    );
  }

  // 主界面
  return (
    <div className="app-container">
      {/* 标题栏 */}
      <div className="title-bar">
        <div className="title-bar-draggable">
          <span className="title-bar-text">{t('appName')}</span>
        </div>
        <button
          className={`title-bar-pin border-none border-transparent ${isAlwaysOnTop ? 'active' : ''}`}
          onClick={handleToggleAlwaysOnTop}
          title={isAlwaysOnTop ? t('unpinWindow') : t('pinWindow')}
        >
          📌
        </button>
        <button className="title-bar-close border-none border-transparent" onClick={handleClose}>
          ×
        </button>
      </div>

      {/* Header */}
      <header className="bg-white  p-4 flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <h1 className="text-xl font-bold text-gray-900">{t('appName')}</h1>
        </div>
        
        <div className="flex items-center space-x-4">
          {/* 语言切换按钮 */}
          <div className="relative">
            <button
              onClick={() => setShowLanguageDropdown(!showLanguageDropdown)}
              className="p-2 rounded-lg border-none border-transparent hover:bg-gray-200 transition-colors duration-200"
              title={t('switchLanguage')}
            >
              <span className="text-sm font-medium text-gray-700">
                {currentLang === 'zh-CN' ? '中文' : currentLang === 'ja' ? '日本語' : 'EN'}
              </span>
            </button>
            
            {showLanguageDropdown && (
              <div className="absolute right-0 mt-2 w-24 bg-white border rounded-lg shadow-lg z-50">
                {SUPPORTED_LANGUAGES.map((lang) => (
                  <button
                    key={lang}
                    onClick={() => handleLanguageChange(lang)}
                    className={`block w-full text-left px-4 py-2 text-sm border-none border-transparent hover:bg-gray-50 transition-colors duration-150 ${
                      currentLang === lang ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700'
                    } ${lang === SUPPORTED_LANGUAGES[0] ? 'rounded-t-lg' : ''} ${lang === SUPPORTED_LANGUAGES[SUPPORTED_LANGUAGES.length - 1] ? 'rounded-b-lg' : ''}`}
                  >
                    {getLanguageDisplayName(lang)}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={handleRefresh}
            className="p-2 rounded-lg border-none border-transparent hover:border-main hover:bg-gray-200 active:text-white transition-colors duration-200"
            title={t('refresh')}
          >
            <svg className="w-5 h-5 text-gray-600 hover:text-white active:text-white hover:border-main active:bg-main" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
          
          <div className="relative group">
            <div className={`w-9 h-9 bg-gradient-to-r rounded-full flex items-center justify-center cursor-pointer  hover:shadow-md transition-shadow duration-200 ${
              userInfo?.subscriptionStatus === 'PRO'
                ? 'from-cyan-500 to-blue-600' // 更具科技感的蓝绿色渐变
                : userInfo?.subscriptionStatus === 'TEAM'
                ? 'from-purple-500 via-purple-600 to-indigo-700' // 渐变紫色
                : userInfo?.subscriptionStatus === 'FREE'
                ? 'from-gray-500 to-gray-700' // 默认颜色
                : 'from-gray-500 to-gray-700' // 默认颜色
            }`}>
              <span className="text-white font-medium text-sm">
                {userInfo?.name ? userInfo.name.charAt(0).toUpperCase() : 'U'}
              </span>
            </div>
            {/* Dropdown Menu */}
            <div className="absolute right-0 mt-2 w-52 bg-white border  rounded-xl  opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10 transform origin-top-right scale-95 group-hover:scale-100">
              <div className="p-3  bg-gray-50 rounded-t-xl">
                <div className="text-sm font-medium text-gray-700">
                  {userInfo?.name || userInfo?.email?.split('@')[0] || '用户名'}
                </div>
                <div className="text-xs text-gray-500">
                  {userInfo?.email || 'user@example.com'}
                </div>
              </div>
              <button
                onClick={() => {
                  setToken(null);
                  setShowTokenPage(true);
                  setTokenInput('');
                }}
                className="block w-full text-left px-4 py-3 text-sm text-gray-700 border-none border-transparent hover:bg-gray-50 transition-colors duration-150"
              >
                {t('changeToken')}
              </button>
              <button
                onClick={handleLogout}
                className="block w-full text-left px-4 py-3 text-sm text-gray-700 border-none border-transparent hover:bg-gray-50 transition-colors duration-150 rounded-b-xl"
              >
                {t('logout')}
              </button>
            </div>
          </div>
        </div>
      </header>
      
      {/* Tab Navigation */}
      <div className="flex  bg-white px-4 pt-2 pb-1 mb-2">
        <button
          className={`px-4 py-2 font-medium text-sm rounded-t-lg border-none border-transparent transition-colors duration-200 ${
            activeTab === 'prompts'
              ? 'text-main border-b-2 border-main bg-white'
              : 'text-gray-600 hover:text-gray-900'
          }`}
          onClick={() => setActiveTab('prompts')}
        >
          {t('promptsTab')}
        </button>
        <button
          className={`px-4 py-2 font-medium text-sm rounded-t-lg border-none border-transparent transition-colors duration-200 ${
            activeTab === 'usage'
              ? 'text-main border-b-2 border-main bg-white'
              : 'text-gray-600 hover:text-gray-900'
          }`}
          onClick={() => setActiveTab('usage')}
        >
          {t('usageTab')}
        </button>
      </div>

      {/* Dashboard Stats */}
      {userStats && activeTab === 'prompts' && (
        <div className="p-4 grid grid-cols-2 gap-4 bg-gray-50">
          {userInfo?.role === 'ADMIN' && (
            <Card className="p-5 rounded-xl  border  transition-transform duration-200 hover:shadow-md">
              <h3 className="text-sm font-medium text-gray-600">{t('subscriptionStatus')}</h3>
              <p className="text-xl font-semibold mt-1 text-gray-900">{userInfo?.subscriptionStatus}</p>
            </Card>
          )}
          {userInfo?.role === 'ADMIN' && (
            <Card className="p-5 rounded-xl  border  transition-transform duration-200 hover:shadow-md">
              <h3 className="text-sm font-medium text-gray-600">{t('aiPoints')}</h3>
              <p className="text-xl font-semibold mt-1 text-gray-900">{userStats.remainingCredits}</p>
            </Card>
          )}
          <Card className="p-5 rounded-xl  border  transition-transform duration-200 hover:shadow-md">
            <h3 className="text-sm font-medium text-gray-600">{t('totalPrompts')}</h3>
            <p className="text-xl font-semibold mt-1 text-gray-900">{userStats.totalPrompts}</p>
          </Card>
          <Card className="p-5 rounded-xl  border  transition-transform duration-200 hover:shadow-md">
            <h3 className="text-sm font-medium text-gray-600">{t('monthlyCreated')}</h3>
            <p className="text-xl font-semibold mt-1 text-gray-900">{userStats.monthlyCreated}</p>
          </Card>
          <Card className="p-5 rounded-xl  border  transition-transform duration-200 hover:shadow-md">
            <h3 className="text-sm font-medium text-gray-600">{t('publicPrompts')}</h3>
            <p className="text-xl font-semibold mt-1 text-gray-900">{userStats.publicPrompts}</p>
          </Card>
          <Card className="p-5 rounded-xl  border  transition-transform duration-200 hover:shadow-md">
            <h3 className="text-sm font-medium text-gray-600">{t('tagsCount')}</h3>
            <p className="text-xl font-semibold mt-1 text-gray-900">{userStats.tagsCount}</p>
          </Card>
        </div>
      )}

      {/* Search */}
      {activeTab === 'prompts' && (
        <div className="p-4 bg-gray-50">
          <div className="relative">
            <input
              type="text"
              placeholder={t('searchPrompts')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg  focus:outline-none focus:ring-2 focus:ring-main focus:border-main transition-all duration-200 text-base pr-24"
            />
            
            {/* 标签选择按钮 */}
            <button
              onClick={handleGetTags}
              className="absolute p-2 mr-2 right-4 top-1/2 transform -translate-y-1/2 text-sm border-none border-transparent hover:border-gray-200 hover:bg-gray-200 rounded-lg transition-colors duration-200"
              title={t('selectTag')}
            >
              {selectedTag ? (
                <span className="text-main font-medium">{localizedTags[selectedTag] || selectedTag}</span>
              ) : (
                <span className="text-gray-600">#</span>
              )}
            </button>
            
            {/* 清除标签按钮 */}
            {selectedTag && (
              <button
                onClick={handleClearTag}
                className="absolute right-0 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 border-none bg-white hover:bg-gray-100 rounded-lg mr-1"
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
            <div className="mt-2 bg-white border-none  rounded-lg  z-10 max-h-60 overflow-y-auto">
              <div className="p-2">
                <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">{t('promptTags')}</div>
                {allTags.length > 0 ? (
                  allTags.map((tag) => (
                    <div
                      key={tag.name}
                      onClick={() => handleSelectTag(tag.name)}
                      className={`px-3 py-2 rounded cursor-pointer mb-1 text-sm border-none border-transparent ${
                        selectedTag === tag.name
                          ? 'bg-blue-100 text-blue-700 font-medium'
                          : 'hover: text-gray-700'
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
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#667eea] mb-2"></div>
                  <p className="text-gray-600">{t('loading')}...</p>
                </div>
              </div>
            ) : displayedPrompts.length > 0 ? (
              <div className="space-y-3">
                {displayedPrompts.map((prompt, index) => {
                  if (index === displayedPrompts.length - 1) {
                    return (
                      <div ref={lastPromptRef} key={prompt.id}>
                        <PromptCard prompt={prompt} localizedTagsMap={localizedTags} />
                      </div>
                    );
                  } else {
                    return <PromptCard key={prompt.id} prompt={prompt} localizedTagsMap={localizedTags} />;
                  }
                })}
              </div>
            ) : (
              <div className="text-center py-10 text-gray-500 bg-white rounded-xl  p-6 mt-2">
                {searchTerm ? t('noPromptsFound') : t('noPromptsAvailable')}
              </div>
            )}
            {/* 加载更多指示器 */}
            {loadingMore && (
              <div className="flex items-center justify-center mt-4 py-4">
                <div className="inline-block animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-[#667eea] mr-3"></div>
                <span className="text-gray-600">{t('loadingMore')}</span>
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
            <Card className="p-5 rounded-xl  border  transition-transform duration-200 hover:shadow-md">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">{t('usageExamples')}</h3>
              <div className="space-y-3 text-gray-700">
                <p>{t('usageExample1')}</p>
                <p>{t('usageExample2')}</p>
                <p>{t('usageExample3')}</p>
                <p>{t('usageExample4')}</p>
              </div>
            </Card>
            
            <Card className="p-5 rounded-xl  border  transition-transform duration-200 hover:shadow-md">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">{t('keyboardShortcuts')}</h3>
              <div className="grid grid-cols-1 gap-2 text-gray-700">
                <div className="flex justify-between items-center py-2 ">
                  <span>{t('openPanel')}</span>
                  <span className=" px-2 py-1 rounded text-sm font-mono">Ctrl+Shift+P</span>
                </div>
                <div className="flex justify-between items-center py-2 ">
                  <span>{t('closePanel')}</span>
                  <span className=" px-2 py-1 rounded text-sm font-mono">Ctrl+Shift+P</span>
                </div>
                <div className="flex justify-between items-center py-2 ">
                  <span>{t('navigateUpDown')}</span>
                  <span className=" px-2 py-1 rounded text-sm font-mono">↑ ↓</span>
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default CommandPalette;