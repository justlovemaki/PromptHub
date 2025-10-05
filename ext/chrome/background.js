// 后台服务工作线程 - 处理认证、右键菜单、快捷键等核心逻辑

let authToken = null;
let baseUrl = null;

// 检测快捷键冲突的函数
async function checkKeyboardShortcutConflicts() {
  if (chrome && chrome.commands && chrome.commands.getAll) {
    try {
      const commands = await chrome.commands.getAll();
      const conflicts = [];
      
      // 检查当前扩展的快捷键是否与其他扩展冲突
      for (const command of commands) {
        if (command.shortcut) {
          // 获取所有扩展的命令来检查冲突
          const allCommands = await chrome.commands.getAll();
          for (const otherCmd of allCommands) {
            if (otherCmd.name !== command.name && otherCmd.shortcut && otherCmd.shortcut === command.shortcut) {
              conflicts.push({
                ourCommand: { name: command.name, description: command.description, shortcut: command.shortcut },
                conflictingCommand: { name: otherCmd.name, description: otherCmd.description, shortcut: otherCmd.shortcut }
              });
            }
          }
        }
      }
      
      if (conflicts.length > 0) {
        console.warn('Keyboard shortcut conflicts detected:', conflicts);
        // 发送通知到侧边栏或显示警告
        if (chrome && chrome.runtime && chrome.runtime.sendMessage) {
          chrome.runtime.sendMessage({
            action: 'shortcutConflictWarning',
            conflicts: conflicts
          }).catch(error => {
            // 如果没有打开的页面接收消息，忽略错误
          });
        }
        
        // 创建一个通知提醒用户
        if (chrome && chrome.notifications) {
          chrome.notifications.create({
            type: 'basic',
            iconUrl: 'icons/icon128.png',
            title: chrome.i18n.getMessage('shortcutConflictTitle') || 'Shortcut Conflict Detected',
            message: chrome.i18n.getMessage('shortcutConflictMessage') || 'One or more of our shortcuts conflict with other extensions. Consider changing them in extension settings.',
            priority: 1
          });
        }
      }
      
      return conflicts;
    } catch (error) {
      console.error('Error checking keyboard shortcut conflicts:', error);
      return [];
    }
  }
  return [];
}

// 安装时创建右键菜单和检测快捷键冲突
if (chrome && chrome.runtime && chrome.runtime.onInstalled && chrome.contextMenus && chrome.contextMenus.create) {
  chrome.runtime.onInstalled.addListener(async () => {
    chrome.contextMenus.create({
      id: 'quickImportPrompt',
      title: chrome.i18n.getMessage('quickImportPrompt'),
      contexts: ['selection']
    });
    
    // 检测快捷键冲突
    await checkKeyboardShortcutConflicts();
  });
}

// 监听快捷键变化事件，检测冲突
if (chrome && chrome.commands && chrome.commands.onChanged) {
  chrome.commands.onChanged.addListener(async () => {
    await checkKeyboardShortcutConflicts();
  });
}

// 从 storage 中加载认证 token
if (chrome && chrome.storage && chrome.storage.local) {
  chrome.storage.local.get(['authToken']).then((result) => {
    authToken = result.authToken;
  });
  chrome.storage.local.get(['extension_config']).then((result) => {
    const extension_config = result.extension_config;
    baseUrl = extension_config && extension_config.WEB_APP_BASE_URL ? extension_config.WEB_APP_BASE_URL : 'http://localhost';
  });
}

// 监听 storage 变化，更新 token
if (chrome && chrome.storage && chrome.storage.onChanged) {
  chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === 'local' && changes.authToken) {
      authToken = changes.authToken.newValue;
    }
    if (namespace === 'local' && changes.extension_config) {
      const extension_config = changes.extension_config.newValue;
      baseUrl = extension_config && extension_config.WEB_APP_BASE_URL ? extension_config.WEB_APP_BASE_URL : 'http://localhost';
    }
  });
}

// 处理来自 content script 和 side panel 的消息
if (chrome && chrome.runtime && chrome.runtime.onMessage) {
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    handleIncomingMessage(message, sender, sendResponse);
    return true; // 保持消息通道开放以支持异步响应
  });
}

// 处理右键菜单点击事件
if (chrome && chrome.contextMenus && chrome.contextMenus.onClicked) {
  chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === 'quickImportPrompt' && info.selectionText) {
      quickImportPrompt(info.selectionText);
    }
  });
}

// 点击插件图标时打开侧边栏
if (chrome && chrome.action && chrome.action.onClicked) {
  chrome.action.onClicked.addListener(() => {
    toggleSidePanel();
  });
}

// 处理快捷键命令
if (chrome && chrome.commands && chrome.commands.onCommand) {
  chrome.commands.onCommand.addListener((command, info, tab) => {
    if (command === 'toggle-side-panel') {
      toggleSidePanel();
    } else if (command === 'quick-save-selection') {
      chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
        const currentTab = tabs[0];
        if (!currentTab || !currentTab.id) {
          console.error('No active tab found or tab ID is missing.');
          return;
        }

        try {
          const selectedText = await getSelectedText(currentTab.id);
          if (selectedText) {
            quickImportPrompt(selectedText);
          } else {
            console.log('No selected text found.');
          }
        } catch (error) {
          console.error('Error during quick-save-selection process:', error);
        }
      });
    }
  });
}

// 处理消息的核心函数
async function handleIncomingMessage(message, sender, sendResponse) {
  switch (message.action) {
    case 'getAuthToken':
      sendResponse({ token: authToken });
      break;
    case 'setAuthToken':
      authToken = message.token;
      if (chrome && chrome.storage && chrome.storage.local) {
        await chrome.storage.local.set({ authToken: message.token });
      } else {
        console.error('Chrome storage API not available');
      }
      sendResponse({ success: true });
      break;
    case 'apiRequest':
      // handleApiRequest 函数内部会处理 sendResponse
      handleApiRequest(message, sendResponse);
      return true; // 保持消息通道开放以支持异步响应
    case 'fillInput':
      chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
        const currentTab = tabs[0];
        if (!currentTab || !currentTab.id) {
          sendResponse({ success: false, error: 'No active tab found or tab ID is missing.' });
          return;
        }

        try {
          const result = await fillInputFieldInTab(currentTab.id, message.selector, message.content);
          sendResponse(result);
        } catch (error) {
          console.error('Error during fillInput process:', error);
          sendResponse({ success: false, error: error.message });
        }
      });
      return true; // 保持消息通道开放以支持异步响应
    case 'getPromptByIndex':
      getPromptByIndex(message.index, sendResponse);
      return true; // 保持消息通道开放以支持异步响应
    default:
      sendResponse({ error: 'Unknown action' });
  }
}

// 处理 API 请求
async function handleApiRequest(message, sendResponse) {
  if (!authToken) {
    sendResponse({ error: 'No authentication token' });
    return true; // 保持消息通道开放
  }

  try {
    // 确保URL是完整的，如果以/开头则添加基础URL
    const fullUrl = message.url.startsWith('http') ? message.url : `${baseUrl}${message.url}`;
    const response = await fetch(fullUrl, {
      method: message.method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: message.data ? JSON.stringify(message.data) : undefined
    });

    const result = await response.json();
    sendResponse({ success: true, data: result });
  } catch (error) {
    sendResponse({ error: error.message });
  }
  return true; // 保持消息通道开放以支持异步响应
}

// 快速导入提示词
async function quickImportPrompt(content) {
  if (!authToken) {
    console.error('No authentication token');
    return;
  }

  try {
    const response = await fetch(baseUrl + '/api/prompts/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({
        title: 'Quickly: '+content.trim().substring(0, 15),
        content: content,
        description: 'Quickly imported from browser selection'
      })
    });

    const result = await response.json();
    
    // 通知侧边栏更新数据
    if (chrome && chrome.runtime && chrome.runtime.sendMessage) {
      chrome.runtime.sendMessage({ action: 'dataUpdated', type: 'prompts' });
    }
    
    console.log('Prompt imported successfully:', result);
  } catch (error) {
    console.error('Failed to import prompt:', error);
  }
}

// 切换侧边栏
function toggleSidePanel() {
  // 直接尝试打开侧边栏，这是在用户手势响应中的正确做法
  // 不要进行任何异步操作如 chrome.tabs.query 或 chrome.sidePanel.getOptions
  if (!chrome || !chrome.tabs || !chrome.tabs.query) {
    console.error('Chrome tabs API not available');
    return;
  }
  
  // 使用 chrome.tabs.query 获取当前标签页，但不等待结果
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (chrome.runtime.lastError) {
      console.error('Error getting active tab:', chrome.runtime.lastError);
      return;
    }
    
    if (!tabs || tabs.length === 0) {
      console.error('No active tab found');
      return;
    }
    
    const currentTab = tabs[0];
    
    if (!chrome || !chrome.sidePanel || !chrome.sidePanel.open) {
      console.error('Chrome sidePanel API not available');
      return;
    }
    
    // 直接调用 sidePanel.open，这是在用户手势响应中的正确做法
    chrome.sidePanel.open({ tabId: currentTab.id }).catch((error) => {
      console.error('Error opening side panel:', error);
      // 确保错误信息包含具体错误类型和消息
      console.error('Side panel error details:', {
        message: error.message,
        name: error.name,
        stack: error.stack
      });
    });
  });
}

// 封装获取选中文本的逻辑，支持从内容脚本或直接执行脚本获取
const getSelectedText = async (tabId) => {
  console.log('quick-save-selection command triggered');

  try {
    // 尝试发送消息给内容脚本，并等待响应
    const response = await chrome.tabs.sendMessage(tabId, { action: 'getSelectedText' });
    if (response && response.selectedText) {
      console.log('Selected text received from content script:', response.selectedText);
      return response.selectedText;
    }
  } catch (error) {
    // 捕获 sendMessage 失败（例如，内容脚本未注入或接收端不存在）
    if (error.message && error.message.includes("Receiving end does not exist")) {
      console.warn('Message to content script failed, falling back to executeScript:', error.message);
    } else {
      console.error('Error sending message to content script:', error);
    }
  }

  // 如果消息发送失败或没有选中文本，则直接执行脚本
  try {
    const selectionResult = await chrome.scripting.executeScript({
      target: { tabId },
      function: () => window.getSelection().toString().trim(),
    });

    if (selectionResult && selectionResult[0] && selectionResult[0].result) {
      console.log('Selected text received from executeScript');
      return selectionResult[0].result;
    } else {
      console.log('No selected text found on the page via executeScript.');
      return null;
    }
  } catch (scriptingError) {
    console.error('Error executing script to get selected text:', scriptingError);
    return null;
  }
};

// 封装填充输入框的逻辑，支持从内容脚本或直接执行脚本填充
const fillInputFieldInTab = async (tabId, selector, content) => {
  try {
    // 尝试发送消息给内容脚本，并等待响应
    const response = await chrome.tabs.sendMessage(tabId, { action: 'fillInput', selector, content });
    if (response && response.success) {
      console.log('Input field filled via content script:', selector);
      return response;
    }
  } catch (error) {
    // 捕获 sendMessage 失败（例如，内容脚本未注入或接收端不存在）
    if (error.message && error.message.includes("Receiving end does not exist")) {
      console.warn('Message to content script failed for fillInput, falling back to executeScript:', error.message);
    } else {
      console.error('Error sending message to content script for fillInput:', error);
    }
  }

  // 如果消息发送失败，则直接执行脚本
  try {
    // 将 fillInputField 的核心逻辑作为函数注入
    const fillResult = await chrome.scripting.executeScript({
      target: { tabId },
      func: (selector, content) => {
        const inputElement = document.querySelector(selector);
        if (inputElement) {
          if (inputElement.isContentEditable) {
            inputElement.innerText = content;
            inputElement.dispatchEvent(new Event('input', { bubbles: true }));
            inputElement.dispatchEvent(new Event('change', { bubbles: true }));

            console.log('Contenteditable field filled successfully');
          } else {
            inputElement.value = content;
            inputElement.dispatchEvent(new Event('input', { bubbles: true }));
            inputElement.dispatchEvent(new Event('change', { bubbles: true }));
            const eventOptions = { bubbles: true, cancelable: true };
            inputElement.dispatchEvent(new KeyboardEvent('keydown', eventOptions));
            inputElement.dispatchEvent(new KeyboardEvent('keypress', eventOptions));
            inputElement.dispatchEvent(new KeyboardEvent('keyup', eventOptions));

            console.log('Input field filled successfully with simulated events');
          }
          inputElement.focus();
          return { success: true };
        } else {
          console.error('Input element not found:', selector);
          return { success: false, error: 'Input element not found' };
        }
      },
      args: [selector, content]
    });

    if (fillResult && fillResult[0] && fillResult[0].result) {
      console.log('Input field filled via executeScript:', selector);
      return fillResult[0].result;
    } else {
      return { success: false, error: 'Failed to fill input via executeScript' };
    }
  } catch (scriptingError) {
    console.error('Error executing script to fill input:', scriptingError);
    return { success: false, error: scriptingError.message };
  }
};

// 根据索引获取提示词
async function getPromptByIndex(index, sendResponse) {
  if (!authToken) {
    sendResponse({ success: false, error: 'No authentication token' });
    return;
  }

  try {
    // 使用正确的API端点获取提示词列表，按照使用次数降序排列，与侧边面板中的排序一致
    const response = await fetch(baseUrl + '/api/prompts/list?page=1&limit=100&sortBy=useCount&sortOrder=desc', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      }
    });

    const result = await response.json();
    handlePromptResponse(result, index, sendResponse);
  } catch (error) {
    console.error('Error fetching prompts by index:', error);
    sendResponse({ success: false, error: error.message });
  }
}

// 处理API响应结果的辅助函数
function handlePromptResponse(result, index, sendResponse) {
  if (result && result.prompts && Array.isArray(result.prompts)) {
    const prompts = result.prompts;
    if (index >= 0 && index < prompts.length) {
      // 返回指定索引的提示词内容
      console.log(`Sending prompt content for index ${index} (ID: ${prompts[index].id}): ${prompts[index].title}`);
      sendResponse({ success: true, content: prompts[index].content });
    } else {
      console.log(`Prompt index ${index} is out of range. Available range: 0-${prompts.length-1}`);
      sendResponse({ success: false, error: `Prompt index ${index} is out of range. Available range: 0-${prompts.length-1}` });
    }
  } else if (result && result.data && Array.isArray(result.data.prompts)) {
    // 处理另一种API响应格式
    const prompts = result.data.prompts;
    if (index >= 0 && index < prompts.length) {
      // 返回指定索引的提示词内容
      console.log(`Sending prompt content for index ${index} (ID: ${prompts[index].id}): ${prompts[index].title}`);
      sendResponse({ success: true, content: prompts[index].content });
    } else {
      console.log(`Prompt index ${index} is out of range. Available range: 0-${prompts.length-1}`);
      sendResponse({ success: false, error: `Prompt index ${index} is out of range. Available range: 0-${prompts.length-1}` });
    }
  } else {
    console.error('Failed to retrieve prompts from API:', result);
    sendResponse({ success: false, error: 'Failed to retrieve prompts from API' });
  }
}