export interface ElectronAPI {
  ipcRenderer: {
    send: (channel: string, ...args: any[]) => void
    invoke: (channel: string, ...args: any[]) => Promise<any>
    on: (channel: string, func: (...args: any[]) => void) => void
    removeAllListeners: (channel: string) => void
  }
  shell: {
    openExternal: (url: string) => Promise<void>
  }
  api: {
    request: (options: {
      url: string;
      method: string;
      headers?: Record<string, string>;
      body?: any;
    }) => Promise<{
      ok: boolean;
      status: number;
      statusText: string;
      data: any;
    }>
  }
}

declare global {
  interface Window {
    electron: ElectronAPI
  }
}