import React, { useState, useEffect } from 'react';

interface ShortcutConfig {
  name: string;
  description: string;
  action: string;
  defaultKey: string;
}

interface ShortcutsConfig {
  [key: string]: ShortcutConfig;
}

interface KeyboardShortcutSettingsProps {
  shortcuts?: ShortcutsConfig;
}

const DEFAULT_SHORTCUTS: ShortcutsConfig = {
  openPanel: {
    name: 'toggleSidePanel',
    description: 'toggleSidePanelDesc',
    action: 'openPanel',
    defaultKey: 'Alt+O'
  },
  quickSaveSelection: {
    name: 'quickSaveSelection',
    description: 'quickSaveSelectionDesc',
    action: 'quickSaveSelection',
    defaultKey: 'Alt+P'
  }
};

const KeyboardShortcutSettings: React.FC<KeyboardShortcutSettingsProps> = ({ shortcuts = DEFAULT_SHORTCUTS }) => {
  const [defaultShortcuts] = useState<ShortcutsConfig>(shortcuts);
  const [currentShortcuts, setCurrentShortcuts] = useState<{ [action: string]: string }>({});

  // 加载快捷键设置
  useEffect(() => {
    loadShortcutSettings();
  }, []);

  const loadShortcutSettings = async () => {
    try {
      // 在Chrome扩展中，快捷键通常是通过manifest.json中的commands定义的
      // 我们可以通过chrome.commands API获取当前设置
      if (chrome && chrome.commands && chrome.commands.getAll) {
        const commands = await chrome.commands.getAll();
        const loadedShortcuts: { [action: string]: string } = {};

        commands.forEach((command: any) => {
          if (command.name === 'toggle-side-panel') {
            loadedShortcuts.openPanel = command.shortcut || defaultShortcuts.openPanel.defaultKey;
          } else if (command.name === 'quick-save-selection') {
            loadedShortcuts.quickSaveSelection = command.shortcut || defaultShortcuts.quickSaveSelection.defaultKey;
          }
        });

        setCurrentShortcuts(loadedShortcuts);
      } else {
        // 如果API不可用，使用默认值
        setCurrentShortcuts({
          openPanel: defaultShortcuts.openPanel.defaultKey,
          quickSaveSelection: defaultShortcuts.quickSaveSelection.defaultKey
        });
      }
    } catch (error) {
      console.error('加载快捷键设置失败:', error);
      // 使用默认值
      setCurrentShortcuts({
        openPanel: defaultShortcuts.openPanel.defaultKey,
        quickSaveSelection: defaultShortcuts.quickSaveSelection.defaultKey
      });
    }
  };

  // 获取本地化文本的辅助函数
  const t = (key: string): string => {
    return chrome.i18n.getMessage(key) || key;
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        {Object.entries(defaultShortcuts).map(([key, config]) => (
          <div key={key} className="flex items-center justify-between py-2 border-b border-gray-100">
            <div className="flex-1">
              <div className="font-medium text-gray-900 text-sm">{t(config.name)}</div>
              <div className="text-xs text-gray-500">{t(config.description)}</div>
            </div>
            <div className="flex items-center space-x-2">
              <span className="px-3 py-1.5 bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-200 rounded text-xs font-mono min-w-[80px] text-center text-gray-700">
                {currentShortcuts[config.action] || config.defaultKey}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="pt-3 border-t border-gray-200">
        <div className="text-xs text-gray-500 italic">
          {t('shortcutChangeNotice') || '提示：修改快捷键需要在浏览器扩展设置中完成'}
        </div>
        <div className="mt-2 text-xs text-gray-500">
          {t('howToChangeShortcut') || '方法：点击浏览器右上角扩展图标 → 管理扩展 → 键盘快捷键 → 设置新快捷键'}
        </div>
      </div>
    </div>
  );
};

export default KeyboardShortcutSettings;