// Chrome 扩展 API 类型定义

declare namespace chrome {
  // Storage API
  namespace storage {
    interface StorageArea {
      get(keys?: string | string[] | null): Promise<{ [key: string]: any }>;
      set(items: { [key: string]: any }): Promise<void>;
      remove(keys: string | string[]): Promise<void>;
    }
    
    const local: StorageArea;
  }

  // Runtime API
  namespace runtime {
    function sendMessage(message: any): Promise<any>;
    function sendMessage(
      extensionId: string,
      message: any
    ): Promise<any>;
    function sendMessage(
      message: any,
      responseCallback: (response: any) => void
    ): void;
    function sendMessage(
      extensionId: string,
      message: any,
      responseCallback: (response: any) => void
    ): void;
    
    interface OnMessage {
      addListener(callback: (message: any, sender: any, sendResponse: (response?: any) => void) => boolean | void): void;
      removeListener(callback: (message: any, sender: any, sendResponse: (response?: any) => void) => boolean | void): void;
    }
    
    const onMessage: OnMessage;
  }

  // Tabs API
  namespace tabs {
    interface CreateProperties {
      url?: string;
      active?: boolean;
    }
    
    function create(createProperties: CreateProperties): Promise<any>;
  }

  // Context Menus API
  namespace contextMenus {
    interface OnClickData {
      menuItemId: string;
      selectionText?: string;
    }
    
    function create(createProperties: any): void;
    
    const onClicked: {
      addListener(callback: (info: OnClickData, tab: any) => void): void;
    };
  }

  // Side Panel API
  namespace sidePanel {
    interface GetPanelOptions {
      tabId: number;
    }
    
    interface PanelOptions {
      enabled?: boolean;
      path?: string;
    }
    
    function getOptions(options: GetPanelOptions): Promise<PanelOptions>;
    function open(options: { tabId: number }): Promise<void>;
  }

  // Commands API
  namespace commands {
    const onCommand: {
      addListener(callback: (command: string) => void): void;
    };
  }

  // Action API
  namespace action {
    const onClicked: {
      addListener(callback: () => void): void;
    };
  }
}