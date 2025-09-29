// 全局类型定义

declare global {
  interface Window {
    chrome: typeof chrome;
  }
}

export {};

// 定义 Vite 环境变量类型
interface ImportMetaEnv {
  readonly VITE_ENV_NAME: string;
  readonly VITE_WEB_APP_BASE_URL?: string;
  // 在这里添加其他环境变量
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}