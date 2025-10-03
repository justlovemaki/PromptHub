// 简单的渲染进程脚本，用于加载React UI组件
const { createRoot } = require('react-dom/client');
const React = require('react');
const CommandPalette = require('./Palette').default;

// 在DOM准备好后渲染UI
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}

function initApp() {
  const container = document.getElementById('root');
  if (container) {
    const root = createRoot(container);
    root.render(React.createElement(CommandPalette));
  }
}