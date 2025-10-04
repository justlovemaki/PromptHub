import { contextBridge, ipcRenderer } from 'electron'

// 暴露给渲染进程的 API
contextBridge.exposeInMainWorld('electron', {
  // IPC 通信
  ipcRenderer: {
    send: (channel: string, ...args: any[]) => {
      ipcRenderer.send(channel, ...args)
    },
    invoke: (channel: string, ...args: any[]) => {
      return ipcRenderer.invoke(channel, ...args)
    },
    on: (channel: string, func: (...args: any[]) => void) => {
      ipcRenderer.on(channel, (event, ...args) => func(...args))
    },
    removeAllListeners: (channel: string) => {
      ipcRenderer.removeAllListeners(channel)
    }
  },
  // Shell API
  shell: {
    openExternal: (url: string) => {
      return ipcRenderer.invoke('shell-open-external', url)
    }
  },
  // 日志 API
  log: {
    getLogPath: () => {
      return ipcRenderer.invoke('get-log-path')
    },
    openLogDirectory: () => {
      return ipcRenderer.invoke('open-log-directory')
    }
  },
  // API 请求代理（避免 CORS）
  api: {
    request: (options: {
      url: string;
      method: string;
      headers?: Record<string, string>;
      body?: any;
    }) => {
      return ipcRenderer.invoke('api-request', options)
    }
  }
})