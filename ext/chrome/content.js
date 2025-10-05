// 内容脚本 - 用于与网页交互，目前主要用于支持未来的扩展功能

console.log('AI PromptHub content script loaded');

// 监听来自 background 或 side panel 的消息
if (chrome && chrome.runtime && chrome.runtime.onMessage) {
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log('Received message in content script:', message);
    handleIncomingMessage(message, sender, sendResponse);
    // 对于异步响应，需要返回 true
    return true; // 保持消息通道开放以支持异步响应
  });
}

// 监听输入框的键盘事件，捕获/p1指令
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeCommandListener);
} else {
  initializeCommandListener();
}

// 用于存储输入框的定时器，防止重复请求
const inputTimers = new Map();

function initializeCommandListener() {
  // 监听输入框的输入事件
  document.addEventListener('input', handleInputEvent, true);
  // 监听表单提交事件，以便在某些网站上也能响应
  document.addEventListener('keydown', handleKeyDownEvent, true);
}

function handleInputEvent(event) {
  if (event.target && (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA' || event.target.isContentEditable)) {
    const inputText = event.target.value || event.target.innerText || '';
    // 清除之前的定时器
    const targetId = event.target.id || event.target.name || event.target.tagName + event.target.className;
    if (inputTimers.has(targetId)) {
      clearTimeout(inputTimers.get(targetId));
    }
    // 设置新的定时器，等待200ms后再检查命令
    const timer = setTimeout(() => {
      checkForCommand(inputText, event.target);
      inputTimers.delete(targetId);
    }, 200);
    inputTimers.set(targetId, timer);
  }
}

function handleKeyDownEvent(event) {
  if (event.key === 'Enter' && (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA' || event.target.isContentEditable)) {
    const inputText = event.target.value || event.target.innerText || '';
    // 清除之前的定时器
    const targetId = event.target.id || event.target.name || event.target.tagName + event.target.className;
    if (inputTimers.has(targetId)) {
      clearTimeout(inputTimers.get(targetId));
      inputTimers.delete(targetId);
    }
    // 立即检查命令，因为用户按了回车
    checkForCommand(inputText, event.target);
  }
}

function checkForCommand(inputText, targetElement) {
  if (typeof inputText !== 'string') return;

  // 匹配 /p<number> 格式的命令，例如 /p1, /p2, /p12 等，出现在文本末尾
  const commandRegex = /\/p(\d+)$/;
  const match = inputText.match(commandRegex);

  if (match) {
    const promptIndex = parseInt(match[1]) - 1; // 将数字转换为数组索引（从0开始）
    console.log('Found command /p' + (promptIndex + 1) + ', index: ' + promptIndex);

    // 停止输入事件，防止命令显示在输入框中
    setTimeout(() => {
      // 移除输入框中的命令
      if (targetElement.tagName === 'INPUT' || targetElement.tagName === 'TEXTAREA') {
        targetElement.value = inputText.replace(commandRegex, '');
        // 触发input事件，以便页面能正确响应变化
        targetElement.dispatchEvent(new Event('input', { bubbles: true }));
      } else if (targetElement.isContentEditable) {
        targetElement.innerText = inputText.replace(commandRegex, '');
        // 触发input事件，以便页面能正确响应变化
        targetElement.dispatchEvent(new Event('input', { bubbles: true }));
      }

      // 确保DOM更新后再获取提示词（此时已无输入延迟，直接执行）
      setTimeout(() => {
        // 向 background script 发送消息获取指定索引的提示词
        if (chrome && chrome.runtime && chrome.runtime.sendMessage) {
          chrome.runtime.sendMessage({
            action: 'getPromptByIndex',
            index: promptIndex
          }, (response) => {
            if (response && response.success && response.content) {
              console.log('Received prompt content for index ' + promptIndex + ':', response.content.substring(0, 50) + '...');
              // 用获取到的内容填充当前输入框
              if (targetElement.id) {
                fillInputField('#' + targetElement.id, response.content);
              } else if (targetElement.name) {
                fillInputField('[name="' + targetElement.name + '"]', response.content);
              } else {
                // 如果没有id或name，尝试直接在当前元素填充
                if (targetElement.isContentEditable) {
                  targetElement.innerText = response.content;
                } else {
                  targetElement.value = response.content;
                }
                // 触发事件确保框架更新
                targetElement.dispatchEvent(new Event('input', { bubbles: true }));
                targetElement.dispatchEvent(new Event('change', { bubbles: true }));
                const eventOptions = { bubbles: true, cancelable: true };
                targetElement.dispatchEvent(new KeyboardEvent('keydown', eventOptions));
                targetElement.dispatchEvent(new KeyboardEvent('keypress', eventOptions));
                targetElement.dispatchEvent(new KeyboardEvent('keyup', eventOptions));
                targetElement.focus();
              }
            } else {
              console.log('No prompt found for index:', promptIndex, 'Response:', response);
              // 在这里可以考虑显示错误信息或提示
            }
          });
        }
      }, 0);
    }, 0);
  }
}


// 处理消息的核心函数
function handleIncomingMessage(message, sender, sendResponse) {
  switch (message.action) {
    case 'fillInput':
      fillInputField(message.selector, message.content);
      break;
    case 'getSelectedText':
      const selectedText = window.getSelection().toString().trim();
      sendResponse({ selectedText: selectedText });
      break;
    default:
      console.log('Unknown action received in content script:', message.action);
      sendResponse({ error: 'Unknown action: ' + message.action });
  }
}

// 填充输入框的函数（用于未来功能）
function fillInputField(selector, content) {
  const inputElement = document.querySelector(selector);
  if (inputElement) {
    if (inputElement.isContentEditable) {
      // 处理 contenteditable 元素
      inputElement.innerText = content;
      // 触发相关事件，如 input 和 change
      inputElement.dispatchEvent(new Event('input', { bubbles: true }));
      inputElement.dispatchEvent(new Event('change', { bubbles: true }));
      console.log('Contenteditable field filled successfully');
    } else {
      // 处理普通 input/textarea 元素
      inputElement.value = content;
      // 触发输入事件，确保 React 等框架能检测到变化
      inputElement.dispatchEvent(new Event('input', { bubbles: true }));
      inputElement.dispatchEvent(new Event('change', { bubbles: true }));

      // 尝试模拟键盘事件，以确保某些框架（如 Angular）能够检测到值的变化
      // 注意：这些事件通常不会修改 DOM，但会触发框架的事件监听器
      const eventOptions = { bubbles: true, cancelable: true };
      inputElement.dispatchEvent(new KeyboardEvent('keydown', eventOptions));
      inputElement.dispatchEvent(new KeyboardEvent('keypress', eventOptions));
      inputElement.dispatchEvent(new KeyboardEvent('keyup', eventOptions));
      
      console.log('Input field filled successfully with simulated events');
    }
    inputElement.focus(); // 聚焦输入框
    sendResponse({ success: true });
  } else {
    console.error('Input element not found:', selector);
    sendResponse({ success: false, error: 'Input element not found' });
  }
}