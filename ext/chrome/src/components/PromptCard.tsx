import React, { useState, useEffect } from 'react';
import { Card, Button, Modal, Tag } from './ui';
import { Prompt } from '../types';
import { copyToClipboard, processPromptWithVariables, extractVariables } from '../utils/helpers';
import { incrementPromptUsage } from '../utils/api';
import { CONFIG } from '../config';

interface PromptCardProps {
  prompt: Prompt;
  token: string;
  localizedTagsMap: Record<string, string>
}

const API_BASE_URL = import.meta.env.VITE_WEB_APP_BASE_URL || ''

const PromptCard: React.FC<PromptCardProps> = ({ prompt, token, localizedTagsMap }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [variableValues, setVariableValues] = useState<Record<string, string>>({});
  const [isProcessing, setIsProcessing] = useState(false);
  
  // 检查提示词是否包含变量
  const hasVariables = prompt.content.includes('{{') && prompt.content.includes('}}');

  // 使用 chrome.i18n 替代 react-i18next 的 t 函数
  const t = (key: string): string => {
    return chrome.i18n.getMessage(key) || key;
  };

  // 自动填充提示词到网页输入框的函数
  const fillPromptToInput = async (content: string) => {
    const selectors = [
      'textarea[placeholder="Optional tone and style instructions for the model"]', // ai studio system输入框
      'textarea[placeholder*="message" i]', // 常见的聊天输入框
      'textarea[placeholder*="prompt" i]', // 提示词输入框
      'textarea[role="textbox"]', // 具有文本框角色的区域
      'textarea', // 任意文本区域
      'input[type="text"]', // 文本输入框
      '[contenteditable="true"]', // 可编辑区域
      '[role="textbox"]' // 具有文本框角色的元素
    ];

    // 同步到 background script
    for (const selector of selectors) {
      try {
        if (chrome.runtime && chrome.runtime.sendMessage) {
            chrome.runtime.sendMessage({
              action: 'fillInput',
              selector: selector,
              content: content
            }, (response: any) => {
              if (response && response.success) {
                showNotification(`${t('promptFilled')}: ${prompt.title}`);
                console.log(`Successfully filled input with selector: ${selector}`);
              } else if (response && response.error) {
                console.log(`Attempted to fill with selector ${selector}, but received error from content script: ${response.error}`);
              } else {
                console.log(`Attempted to fill with selector ${selector}, but content script did not respond with success.`);
              }
            });
        }
      } catch (error: any) {
        console.log(`Selector ${selector} not found or content script communication error, trying next. Error: ${error.message}`);
      }
    }
  };

  const handleUse = async () => {
    if (hasVariables) {
      // 如果有变量，打开模态框让用户输入值
      setIsModalOpen(true);
      // 提取变量名并初始化状态
      const variables = extractVariables(prompt.content);
      const initialValues: Record<string, string> = {};
      variables.forEach(varName => {
        initialValues[varName] = '';
      });
      setVariableValues(initialValues);
    } else {
      // 如果没有变量，先复制到剪贴板，然后自动填充到网页的主输入框中
      await copyToClipboard(prompt.content);
      showNotification(`${t('promptCopied')}: ${prompt.title}`);
      
      // 自动填充到网页的主输入框中
      fillPromptToInput(prompt.content);
      
      // 增加使用次数
      incrementPromptUsage(token, prompt.id).catch(error => {
        console.error('Failed to increment prompt usage:', error);
        // 即使API调用失败，我们也只记录错误而不显示给用户
      });
    }
  };

  const handleCopy = () => {
    copyToClipboard(prompt.content);
    showNotification(`${t('promptCopied')}: ${prompt.title}`);
    // 只有在有有效 token 时才增加使用次数
    if (token) {
      incrementPromptUsage(token, prompt.id).catch(error => {
        console.error('Failed to increment prompt usage:', error);
        // 即使API调用失败，我们也只记录错误而不显示给用户
      });
    }
  };

  const handleModalConfirm = async () => {
    setIsProcessing(true);
    try {
      // 检查是否所有变量都有值
      const allVariablesFilled = Object.values(variableValues).every(value => value && value.trim());
      if (!allVariablesFilled) {
        showNotification(t('pleaseFillAllVariables'), 'error');
        return;
      }
      
      // 处理变量替换
      const processedContent = processPromptWithVariables(prompt.content, variableValues);
      await copyToClipboard(processedContent);
      showNotification(`${t('promptProcessedAndCopied')}: ${prompt.title}`);
      
      // 自动填充到网页的主输入框中
      fillPromptToInput(processedContent);
      
      setIsModalOpen(false);
      
      // 只有在有有效 token 时才增加使用次数
      if (token) {
        incrementPromptUsage(token, prompt.id).catch(error => {
          console.error('Failed to increment prompt usage:', error);
          // 即使API调用失败，我们也只记录错误而不显示给用户
        });
      }
    } catch (error: any) {
      console.error('Error processing prompt:', error);
      showNotification(`${t('errorProcessingPrompt')}: ${error.message}`, 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleVariableChange = (varName: string, value: string) => {
    setVariableValues(prev => ({
      ...prev,
      [varName]: value
    }));
  };

  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    // 在浏览器扩展环境中，使用 chrome.notifications API 显示通知
    if (chrome && chrome.notifications) {
      const notificationId = `prompt-manager-${Date.now()}`;
      chrome.notifications.create(notificationId, {
        type: 'basic',
        iconUrl: chrome.runtime.getURL('icons/logo_128x128.png'),
        title: type === 'success' ? 'PromptHub' : 'PromptHub Error',
        message: message,
        priority: 1
      });
      
      // 5秒后自动清除通知
      setTimeout(() => {
        chrome.notifications.clear(notificationId);
      }, 5000);
    } else {
      // 降级方案：使用浏览器内置的通知
      if (Notification.permission === 'granted') {
        new Notification(type === 'success' ? 'PromptHub' : 'PromptHub Error', {
          body: message,
          icon: chrome.runtime.getURL ? chrome.runtime.getURL('icons/logo_128x128.png') : undefined
        });
      } else if (Notification.permission !== 'denied') {
        Notification.requestPermission().then(permission => {
          if (permission === 'granted') {
            new Notification(type === 'success' ? 'PromptHub' : 'PromptHub Error', {
              body: message,
              icon: chrome.runtime.getURL ? chrome.runtime.getURL('icons/logo_128x128.png') : undefined
            });
          }
        });
      }
    }
  };

  const handleEdit = () => {
    // 打开 Web 应用中的编辑页面
    if (chrome && chrome.tabs && chrome.tabs.create) {
        console.log('Opening web app...',chrome.i18n.getUILanguage());
        if(chrome.i18n.getUILanguage().startsWith('zh')){
          chrome.tabs.create({ url: `${API_BASE_URL}/zh-CN/dashboard?editid=${prompt.id}` });
        } else if(chrome.i18n.getUILanguage() === 'ja'){
          chrome.tabs.create({ url: `${API_BASE_URL}/ja/dashboard?editid=${prompt.id}` });
        } else {
          chrome.tabs.create({ url: `${API_BASE_URL}/dashboard?editid=${prompt.id}` }); // 使用配置中的基础URL
        }
    } else {
      console.error('Chrome API not available');
    }
  };

  return (
    <Card className="p-4">
      <div className="flex justify-between items-start">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-800 truncate">{prompt.title}</h3>
          <p className="text-sm text-gray-600 mt-1 line-clamp-4">
            {prompt.content.substring(0, 100) + (prompt.content.length > 100 ? '...' : '')}
          </p>
        </div>
        <div className="flex flex-col space-y-2 ml-2">
          <Button
            variant="outline"
            size="icon"
            onClick={handleUse}
            title={t('usePromptTooltip')}
            className="p-2 w-8 h-8"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={handleCopy}
            title={t('copyPromptTooltip')}
            className="p-2 w-8 h-8"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={handleEdit}
            title={t('editPromptTooltip')}
            className="p-2 w-8 h-8"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </Button>
        </div>
      </div>
      {/* 标签显示区域 */}
      {prompt.tags && prompt.tags.length > 0 && (
        <div className="mt-2 flex flex-row flex-wrap gap-1 items-center min-h-[22px]">
          {prompt.tags.map((tag, index) => (
            <Tag key={index} className="bg-[var(--primary-100)]/[0.1] text-[var(--primary-100)] hover:bg-[var(--primary-100)]/[0.2] transition-colors duration-200">
              {localizedTagsMap[tag]}
            </Tag>
          ))}
        </div>
      )}

      {/* 变量输入模态框 */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={t('fillPromptVariables')}
      >
        <div className="space-y-6 p-2">
          {hasVariables && extractVariables(prompt.content).map((variable, index) => (
            <div key={index} className="space-y-3">
              <label className="block text-sm font-medium text-gray-600 mb-1">
                {variable}
              </label>
              <input
                type="text"
                value={variableValues[variable] || ''}
                onChange={(e) => handleVariableChange(variable, e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary-100)] focus:border-[var(--primary-100)] transition-all duration-200 text-base"
                placeholder={`${t('enterVariableValue')}: ${variable}`}
              />
            </div>
          ))}
          {/* 实时预览区域 */}
          {hasVariables && (
            <div className="mt-8 space-y-3">
              <label className="block text-sm font-medium text-gray-600 mb-2">
                {t('realTimePreview')}
              </label>
              <div className="border border-gray-200 rounded-xl p-4 bg-gray-50 min-h-[120px] max-h-60 overflow-y-auto transition-all duration-200">
                <pre className="whitespace-pre-wrap break-words font-sans text-base text-gray-700">
                  {prompt.content.split(/(\{\{[^}]+\}\})/g).map((part, index) => {
                    // 检查是否是变量标记
                    if (part.startsWith('{{') && part.endsWith('}}')) {
                      const variableName = part.slice(2, -2).trim();
                      const variableValue = variableValues[variableName] || '';
                      // 如果变量有值，则显示值；否则显示原始变量标记但保持高亮
                      const displayValue = variableValue !== '' ? variableValue : part;
                      return (
                        <span key={index} className="font-bold text-[var(--primary-100)] bg-[var(--primary-300)] px-1 rounded">
                          {displayValue}
                        </span>
                      );
                    }
                    return <span key={index}>{part}</span>;
                  })}
                </pre>
              </div>
            </div>
          )}
        </div>
        <div className="mt-8 flex justify-end space-x-3 px-2 pb-2">
          <Button
            variant="outline"
            onClick={() => setIsModalOpen(false)}
            className="px-5"
          >
            {t('cancel')}
          </Button>
          <Button
            onClick={handleModalConfirm}
            disabled={isProcessing}
            className="px-5 bg-[var(--primary-100)] hover:bg-[var(--primary-200)]/90 text-white"
          >
            {isProcessing ? t('processing') : t('apply')}
          </Button>
        </div>
      </Modal>
    </Card>
  );
};

export default PromptCard;