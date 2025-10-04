import React, { useState } from 'react';
import { Card, Button, Modal, Tag } from './ui';
import type { Prompt } from '../types/types';
import { copyToClipboard, processPromptWithVariables, extractVariables } from '../utils/helpers';
import { t, getCurrentLanguage } from '../utils/i18n';
import { getCurrentLanguageBaseUrl } from '../config';

const { ipcRenderer, shell } = (window as any).electron;

interface PromptCardProps {
  prompt: Prompt;
  localizedTagsMap?: Record<string, string>;
}

const PromptCard: React.FC<PromptCardProps> = ({ prompt, localizedTagsMap = {} }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [variableValues, setVariableValues] = useState<Record<string, string>>({});
  const [isProcessing, setIsProcessing] = useState(false);
  
  // 检查提示词是否包含变量
  const hasVariables = prompt.content.includes('{{') && prompt.content.includes('}}');

  const handleUse = async () => {
    if (hasVariables) {
      // 提取变量名并初始化状态
      const variables = extractVariables(prompt.content);
      const initialValues: Record<string, string> = {};
      variables.forEach(varName => {
        initialValues[varName] = '';
      });
      setVariableValues(initialValues);
      // 如果有变量，打开模态框让用户输入值
      setIsModalOpen(true);
    } else {
      // 如果没有变量，复制到剪贴板并发送到活动窗口
      await copyToClipboard(prompt.content);
      ipcRenderer.send('copy-to-active-window', prompt.content);
      showNotification(`${t('promptCopied')}: ${prompt.title}`);
    }
  };

  const handleCopy = async () => {
    await copyToClipboard(prompt.content);
    showNotification(`${t('promptCopied')}: ${prompt.title}`);
  };

  const handleEdit = () => {
    // 打开 Web 应用中的编辑页面
    const currentLang = getCurrentLanguage();
    const baseUrl = getCurrentLanguageBaseUrl(currentLang);
    const editUrl = `${baseUrl}/dashboard?editid=${prompt.id}`;
    
    // 使用 Electron shell 打开URL
    shell.openExternal(editUrl);
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
      
      // 发送到活动窗口
      ipcRenderer.send('copy-to-active-window', processedContent);
      
      setIsModalOpen(false);
    } catch (error: any) {
      console.error('处理提示词时出错:', error);
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
    // 在桌面应用中，可以使用系统通知
    console.log(`${type}: ${message}`);
  };

  return (
    <Card className="p-4 hover:shadow-md transition-shadow duration-200">
      <div className="flex justify-between items-start">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-800 text-sm truncate">{prompt.title}</h3>
          <p className="text-xs text-gray-600 mt-1 line-clamp-4">
            {prompt.content.substring(0, 100) + (prompt.content.length > 100 ? '...' : '')}
          </p>
        </div>
        <div className="flex flex-col space-y-2 ml-2">
          <Button
            variant="outline"
            size="icon"
            onClick={handleUse}
            title={t('usePromptTooltip')}
            className="p-2 w-8 h-8 rounded-lg"
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
            className="p-2 w-8 h-8 rounded-lg"
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
            className="p-2 w-8 h-8 rounded-lg"
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
          {prompt.tags.map((tag: string, index: number) => (
            <Tag key={index} className="bg-default text-main hover:bg-default transition-colors duration-200 p-2 rounded text-xs">
              {localizedTagsMap[tag] || tag}
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
              <label className="block text-xs font-medium text-gray-600 mb-1">
                {variable}
              </label>
              <input
                type="text"
                value={variableValues[variable] || ''}
                onChange={(e) => handleVariableChange(variable, e.target.value)}
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg  focus:outline-none focus:ring-2 focus:ring-main focus:border-main transition-all duration-200 text-sm"
                placeholder={`${t('enterValueFor')} ${variable}`}
              />
            </div>
          ))}
          {/* 实时预览区域 */}
          {hasVariables && (
            <div className="mt-8 space-y-3">
              <label className="block text-xs font-medium text-gray-600 mb-2">
                {t('realTimePreview')}
              </label>
              <div className="border border-gray-200 rounded-xl p-4 bg-gray-50 min-h-[120px] max-h-60 overflow-y-auto transition-all duration-200">
                <pre className="whitespace-pre-wrap break-words font-sans text-sm text-gray-700">
                  {prompt.content.split(/(\{\{[^}]+\}\})/g).map((part: string, index: number) => {
                    // 检查是否是变量标记
                    if (part.startsWith('{{') && part.endsWith('}}')) {
                      const variableName = part.slice(2, -2).trim();
                      const variableValue = variableValues[variableName] || '';
                      // 如果变量有值，则显示值；否则显示原始变量标记但保持高亮
                      const displayValue = variableValue !== '' ? variableValue : part;
                      return (
                        <span key={index} className="font-bold text-main bg-default px-1 rounded">
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
            className="px-5 border-gray-100 rounded-lg"
          >
            {t('cancel')}
          </Button>
          <Button
            onClick={handleModalConfirm}
            disabled={isProcessing}
            className="px-5 bg-main hover:bg-main text-white border-gray-100 rounded-lg"
          >
            {isProcessing ? t('processing') : t('apply')}
          </Button>
        </div>
      </Modal>
    </Card>
  );
};

export default PromptCard;