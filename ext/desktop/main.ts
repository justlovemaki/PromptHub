const { app, BrowserWindow, Tray, Menu, globalShortcut, ipcMain, clipboard, screen, shell } = require('electron');
import * as path from 'path';
import { keyboard, Key, mouse, Button } from '@nut-tree/nut-js';
import { API_CONFIG, getCurrentLanguageBaseUrl } from './config';
import { initI18n, t, getCurrentLanguage } from './utils/i18n';

let tray: any;
let commandPaletteWindow: any;
let lastMousePosition: { x: number; y: number } | null = null;
const width= 1280;
const height = 800;

// 创建系统托盘
function createTray() {
  // 初始化多语言
  initI18n();
  
  tray = new Tray(path.join(__dirname, 'assets', 'icon.png'));

  const contextMenu = Menu.buildFromTemplate([
    {
      label: t('openPanel'),
      click: () => {
        // 显示命令面板窗口
        const mousePos = screen.getCursorScreenPoint();
        const display = screen.getDisplayNearestPoint(mousePos);

        // 计算窗口位置（屏幕中央）
        const x = Math.floor(display.bounds.x + (display.bounds.width - width) / 2);
        const y = Math.floor(display.bounds.y + (display.bounds.height - height) / 2);

        commandPaletteWindow.setPosition(x, y);
        commandPaletteWindow.setSize(width, height);

        // 显示并聚焦命令面板
        commandPaletteWindow.show();
        commandPaletteWindow.focus();
      }
    },
    {
      label: t('settings'),
      click: () => {
        // 打开Web端用户设置页面
        const { shell } = require('electron');
        const currentLang = getCurrentLanguage();
        const baseUrl = getCurrentLanguageBaseUrl(currentLang);
        shell.openExternal(baseUrl + '/account');
      }
    },
    {
      label: t('quit'),
      click: () => {
        app.quit();
      }
    }
  ]);

  tray.setContextMenu(contextMenu);
  tray.setToolTip(t('appName'));
}

// 创建隐藏的命令面板窗口
function createCommandPaletteWindow() {
  commandPaletteWindow = new BrowserWindow({
    width: width,
    height: height,
    show: false,
    frame: false,
    resizable: false,
    skipTaskbar: false,
    alwaysOnTop: false,
    icon: path.join(__dirname, 'assets', 'icon.png'), // 添加窗口图标
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    }
  });

  // 禁用 DevTools 中的 Autofill 警告
  commandPaletteWindow.webContents.on('devtools-opened', () => {
    commandPaletteWindow.webContents.devToolsWebContents?.executeJavaScript(`
      console.warn = (function(originalWarn) {
        return function(...args) {
          const msg = args[0] || '';
          if (typeof msg === 'string' && msg.includes('Autofill')) {
            return;
          }
          originalWarn.apply(console, args);
        };
      })(console.warn);
    `).catch(() => {});
  });

  // 加载命令面板UI
  commandPaletteWindow.loadFile(path.join(__dirname, 'index.html'));

  // 当窗口获得焦点时保存鼠标位置（从其他窗口切换过来时）
  commandPaletteWindow.on('focus', async () => {
    // if (!lastMousePosition) {
      try {
        const currentMousePos = await mouse.getPosition();
        lastMousePosition = { x: currentMousePos.x, y: currentMousePos.y };
        console.log('[Main] 窗口聚焦时已保存鼠标位置:', lastMousePosition);
      } catch (error) {
        console.error('[Main] 获取鼠标位置失败:', error);
      }
    // }
  });

  // 当窗口失去焦点时自动隐藏
  commandPaletteWindow.on('blur', () => {
    // commandPaletteWindow.hide();
  });
}

// 注册全局快捷键
function registerGlobalShortcut() {
  const ret = globalShortcut.register('CmdOrCtrl+Shift+P', async () => {
    // 切换窗口显示/隐藏状态
    if (commandPaletteWindow.isVisible()) {
      commandPaletteWindow.hide();
    } else {
      // 保存当前鼠标位置（用于后续返回）
      // try {
      //   const currentMousePos = await mouse.getPosition();
      //   lastMousePosition = { x: currentMousePos.x, y: currentMousePos.y };
      //   console.log('[Main] 已保存鼠标位置:', lastMousePosition);
      // } catch (error) {
      //   console.error('[Main] 获取鼠标位置失败:', error);
      // }

      // 获取鼠标所在屏幕的尺寸
      const mousePos = screen.getCursorScreenPoint();
      const display = screen.getDisplayNearestPoint(mousePos);

      // 计算窗口位置（屏幕中央）
      const x = Math.floor(display.bounds.x + (display.bounds.width - width) / 2);
      const y = Math.floor(display.bounds.y + (display.bounds.height - height) / 2);

      commandPaletteWindow.setPosition(x, y);
      commandPaletteWindow.setSize(width, height);

      // 显示并聚焦命令面板
      commandPaletteWindow.show();
      commandPaletteWindow.focus();
    }
  });

  if (!ret) {
    console.log('全局快捷键注册失败');
  }
}

// IPC通信处理
app.whenReady().then(() => {
  ipcMain.on('copy-to-active-window', (event: any, content: string) => {
    console.log('[Main] 收到 copy-to-active-window 事件, 内容长度:', content.length);
    
    // 写入剪贴板
    clipboard.writeText(content);
    console.log('[Main] 已写入剪贴板');

    // 隐藏面板
    commandPaletteWindow.hide();
    console.log('[Main] 已隐藏面板窗口');

    // 等待窗口隐藏和焦点切换完成后，移动鼠标到之前位置并点击，然后粘贴
    setTimeout(async () => {
      try {
        // 如果有保存的鼠标位置，移动鼠标回去
        if (lastMousePosition) {
          console.log('[Main] 移动鼠标到之前位置:', lastMousePosition);
          await mouse.setPosition({ x: lastMousePosition.x, y: lastMousePosition.y });
          
          // 等待鼠标移动完成
          await new Promise(resolve => setTimeout(resolve, 100));
          
          // 点击鼠标左键以激活输入框焦点
          console.log('[Main] 点击鼠标左键');
          await mouse.click(Button.LEFT);
          
          // 等待点击生效
          await new Promise(resolve => setTimeout(resolve, 100));
        }

        console.log('[Main] 开始模拟粘贴操作, 平台:', process.platform);
        if (process.platform === 'darwin') {
          // macOS: Cmd+V
          await keyboard.pressKey(Key.LeftSuper);
          await keyboard.pressKey(Key.V);
          await keyboard.releaseKey(Key.V);
          await keyboard.releaseKey(Key.LeftSuper);
        } else {
          // Windows/Linux: Ctrl+V
          await keyboard.pressKey(Key.LeftControl);
          await keyboard.pressKey(Key.V);
          await keyboard.releaseKey(Key.V);
          await keyboard.releaseKey(Key.LeftControl);
        }
        console.log('[Main] 粘贴操作完成');
      } catch (error) {
        console.error('[Main] 模拟操作失败:', error);
      }
    }, 200);
  });

  ipcMain.on('hide-window', () => {
    commandPaletteWindow.hide();
  });

  // 切换窗口置顶状态
  ipcMain.handle('toggle-always-on-top', async () => {
    const currentState = commandPaletteWindow.isAlwaysOnTop();
    commandPaletteWindow.setAlwaysOnTop(!currentState);
    return !currentState;
  });

  // 从electron-store获取认证Token
  ipcMain.handle('get-auth-token', async () => {
    const Store = require('electron-store');
    const store = new Store();
    return store.get('authToken');
  });

  // 存储认证Token
  ipcMain.handle('set-auth-token', async (event: any, token: string) => {
    const Store = require('electron-store');
    const store = new Store();
    store.set('authToken', token);
  });

  // 不创建主窗口
  createTray();
  registerGlobalShortcut();
  createCommandPaletteWindow();

  // macOS特殊处理
  if (process.platform === 'darwin') {
    app.dock.hide();
  }
});

// 应用退出处理
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});