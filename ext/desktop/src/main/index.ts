import { app, BrowserWindow, Tray, Menu, globalShortcut, ipcMain, clipboard, screen, shell, dialog } from 'electron';
import * as path from 'path';
import { keyboard, Key, mouse, Button } from '@nut-tree/nut-js';
import Store from 'electron-store';
import fetch from 'node-fetch';
import { getCurrentLanguageBaseUrl } from '../renderer/src/config';
import { initI18n, t, getCurrentLanguage } from './i18n';
import { writeLog, clearLog, getLogFilePath } from './logger';

// 获取资源路径
function getResourcePath(relativePath: string): string {
  if (!app.isPackaged) {
    writeLog(`Resource path dev: ${path.join(__dirname, '../../resources', relativePath)}`);
    return path.join(__dirname, '../../resources', relativePath);
  }
  writeLog(`Resource path prod  : ${path.join(process.resourcesPath, relativePath)}`);
  return path.join(process.resourcesPath, relativePath);
}

let tray: any;
let commandPaletteWindow: any;
let lastMousePosition: { x: number; y: number } | null = null;
const width= 400;
const height = 960;

// 创建系统托盘
function createTray() {
  try {
    // 初始化多语言
    writeLog('Initializing i18n...');
    initI18n();
    
    const iconPath = getResourcePath('icon.png');
    writeLog(`Tray icon path: ${iconPath}`);
    
    tray = new Tray(iconPath);
    writeLog('Tray created successfully');
  } catch (error: any) {
    writeLog(`Failed to create tray: ${error.message}`, 'ERROR');
    throw error;
  }

  // 创建托盘上下文菜单
  updateTrayMenu();

  // 设置托盘工具提示
  tray.setToolTip(t('appName'));
}

// 更新托盘菜单的函数
function updateTrayMenu() {
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
  try {
    writeLog('Creating BrowserWindow...');
    
    const iconPath = getResourcePath('icon.png');
    const preloadPath = path.join(__dirname, '../preload/index.js');
    
    writeLog(`Window icon path: ${iconPath}`);
    writeLog(`Preload script path: ${preloadPath}`);
    
    commandPaletteWindow = new BrowserWindow({
    width: width,
    height: height,
    show: false,
    frame: false,
    resizable: false,
    skipTaskbar: true,
    alwaysOnTop: false,
      icon: iconPath,
      webPreferences: {
        preload: preloadPath,
        nodeIntegration: false,
        contextIsolation: true,
      }
    });

    writeLog('BrowserWindow created');
  } catch (error: any) {
    writeLog(`Failed to create BrowserWindow: ${error.message}`, 'ERROR');
    throw error;
  }

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
  try {
    if (process.env.NODE_ENV === 'development') {
      writeLog('Loading dev URL...');
      commandPaletteWindow.loadURL('http://localhost:5173');
      commandPaletteWindow.webContents.openDevTools();
    } else {
      const htmlPath = path.join(__dirname, '../renderer/index.html');
      writeLog(`Loading production HTML: ${htmlPath}`);
      commandPaletteWindow.loadFile(htmlPath);
    }
    
    writeLog('UI loaded successfully');
  } catch (error: any) {
    writeLog(`Failed to load UI: ${error.message}`, 'ERROR');
    throw error;
  }

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
    commandPaletteWindow.hide();
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
  // 清空旧日志并开始记录新日志
  clearLog();
  writeLog('=== Application Starting ===');
  writeLog(`NODE_ENV: ${process.env.NODE_ENV}`);
  writeLog(`Platform: ${process.platform}`);
  writeLog(`__dirname: ${__dirname}`);
  writeLog(`process.resourcesPath: ${process.resourcesPath}`);
  writeLog(`App path: ${app.getAppPath()}`);
  writeLog(`User data path: ${app.getPath('userData')}`);
  writeLog(`Log file path: ${getLogFilePath()}`);

  // 设置错误处理（在 app ready 之后）
  process.on('uncaughtException', (error) => {
    writeLog(`Uncaught Exception: ${error.message}\n${error.stack}`, 'ERROR');
  });

  process.on('unhandledRejection', (reason, promise) => {
    writeLog(`Unhandled Rejection: ${reason}`, 'ERROR');
  });

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

  // 创建 store 实例
  const store = new Store();

  // 从electron-store获取认证Token
  ipcMain.handle('get-auth-token', async () => {
    return store.get('authToken');
  });

  // 存储认证Token
  ipcMain.handle('set-auth-token', async (event: any, token: string) => {
    store.set('authToken', token);
  });

  // 获取语言设置
  ipcMain.handle('get-language', async () => {
    return store.get('language');
  });

  // 设置语言
  ipcMain.handle('set-language', async (event: any, language: string) => {
    store.set('language', language);
    // 语言更改后，重新初始化多语言并更新托盘菜单
    await initI18n(language as any);
    updateTrayMenu();
  });

  // 打开外部链接
  ipcMain.handle('shell-open-external', async (event: any, url: string) => {
    await shell.openExternal(url);
  });

  // 获取日志文件路径
  ipcMain.handle('get-log-path', async () => {
    return getLogFilePath();
  });

  // 打开日志文件所在目录
  ipcMain.handle('open-log-directory', async () => {
    const logPath = getLogFilePath();
    const logDir = path.dirname(logPath);
    await shell.openPath(logDir);
  });

  // API 请求代理（避免 CORS 问题）
  ipcMain.handle('api-request', async (event: any, options: {
    url: string;
    method: string;
    headers?: Record<string, string>;
    body?: any;
  }) => {
    try {
      const { url, method, headers, body } = options;
      
      const response = await fetch(url, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
      });
      
      const data = await response.json();
      
      return {
        ok: response.ok,
        status: response.status,
        statusText: response.statusText,
        data,
      };
    } catch (error: any) {
      console.error('API request failed:', error);
      return {
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        data: { success: false, error: { message: error.message } },
      };
    }
  });

  // 初始化应用
  try {
    writeLog('Creating tray...');
    createTray();
    
    writeLog('Registering global shortcut...');
    registerGlobalShortcut();
    
    writeLog('Creating command palette window...');
    createCommandPaletteWindow();
    
    writeLog('Application initialized successfully');
  } catch (error: any) {
    writeLog(`Failed to initialize application: ${error.message}\n${error.stack}`, 'ERROR');
    throw error;
  }

  // macOS特殊处理
  if (process.platform === 'darwin') {
    app.dock.hide();
  }
}).catch((error) => {
  writeLog(`App ready failed: ${error.message}\n${error.stack}`, 'ERROR');
  // 显示错误对话框
  dialog.showErrorBox(
    'Application Startup Error',
    `Failed to start application.\n\nLog file location:\n${getLogFilePath()}\n\nError: ${error.message}`
  );
  app.quit();
});

// 应用退出处理
app.on('window-all-closed', () => {
  // 桌面应用不需要在关闭所有窗口时退出（托盘应用）
  // 注释掉默认退出行为
  // if (process.platform !== 'darwin') {
  //   app.quit();
  // }
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});

// 当应用激活时（macOS）
app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createCommandPaletteWindow();
  }
});