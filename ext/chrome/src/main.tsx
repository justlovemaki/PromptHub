import React from 'react';
import { createRoot } from 'react-dom/client';
import SidePanelApp from './components/SidePanelApp';
import './assets/index.css';

// 设置国际化
import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';

// 初始化国际化
i18next
  .use(initReactI18next)
  .init({
    lng: 'en', // 默认语言
    fallbackLng: 'en',
    resources: {
      en: {
        translation: {
          appName: 'AI Prompt Manager',
          appDesc: 'Manage and use your AI prompts seamlessly.',
          toggleSidePanelDesc: 'Toggle the Prompt Manager Side Panel',
          quickImportPrompt: 'Quick Import as Prompt',
          openWebApp: 'Open Web App',
          logout: 'Logout',
          subscriptionStatus: 'Subscription Status',
          aiPoints: 'AI Points',
          myPromptsCount: 'My Prompts Count',
          monthlyUsageCount: 'Monthly Usage Count',
          searchPrompts: 'Search Prompts',
          use: 'Use',
          copy: 'Copy',
          edit: 'Edit',
          cancel: 'Cancel',
          confirm: 'Confirm',
          loading: 'Loading',
          noPromptsFound: 'No prompts found',
          noPromptsAvailable: 'No prompts available',
          authenticationRequired: 'Authentication required'
        }
      },
      zh: {
        translation: {
          appName: 'AI 提示词管理器',
          appDesc: '无缝管理并使用您的 AI 提示词。',
          toggleSidePanelDesc: '切换提示词管理器侧边栏',
          quickImportPrompt: '快速导入为提示词',
          openWebApp: '打开 Web 应用',
          logout: '登出',
          subscriptionStatus: '订阅状态',
          aiPoints: 'AI 点数',
          myPromptsCount: '我的提示词总数',
          monthlyUsageCount: '本月使用次数',
          searchPrompts: '搜索提示词',
          use: '使用',
          copy: '复制',
          edit: '编辑',
          cancel: '取消',
          confirm: '确认',
          loading: '加载中',
          noPromptsFound: '未找到提示词',
          noPromptsAvailable: '暂无提示词',
          authenticationRequired: '需要身份验证'
        }
      }
    }
  });

const container = document.getElementById('root');
const root = createRoot(container!);
root.render(<SidePanelApp />);