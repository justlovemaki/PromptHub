// 内容脚本 - 用于与网页交互，目前主要用于支持未来的扩展功能

console.log('AI Prompt Manager content script loaded');

// 监听来自 background 或 side panel 的消息
if (chrome && chrome.runtime && chrome.runtime.onMessage) {
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log('Received message in content script:', message);
    handleIncomingMessage(message, sender, sendResponse);
    // 对于异步响应，需要返回 true
    return true; // 保持消息通道开放以支持异步响应
  });
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