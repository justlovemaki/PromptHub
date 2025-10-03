/**
 * Electron Builder 配置文件
 * 用于构建跨平台的桌面应用程序
 */
const config = {
  appId: 'com.promptmanager.desktop',
  productName: 'Prompt Manager Desktop',
  directories: {
    output: 'dist-electron'
  },
  files: [
    'dist/**/*',
    'node_modules/**/*',
    'package.json'
  ],
  extraResources: [
    {
      from: 'assets/',
      to: 'assets/',
      filter: ['**/*']
    }
  ],
  win: {
    target: [
      {
        target: 'nsis',
        arch: ['x64']
      }
    ],
    icon: 'assets/icon.png',
    publisherName: 'PromptHub'
  },
  mac: {
    target: [
      {
        target: 'dmg',
        arch: ['x64', 'arm64']
      },
      {
        target: 'zip',
        arch: ['x64', 'arm64']
      }
    ],
    icon: 'assets/icon.png',  // electron-builder 会自动转换为 .icns
    category: 'public.app-category.productivity',
    hardenedRuntime: true,
    gatekeeperAssess: false,
    entitlements: './build/entitlements.mac.plist',
    entitlementsInherit: './build/entitlements.mac.plist'
  },
  linux: {
    target: [
      {
        target: 'AppImage',
        arch: ['x64']
      },
      {
        target: 'deb',
        arch: ['x64']
      },
      {
        target: 'rpm',
        arch: ['x64']
      }
    ],
    icon: 'assets/icon.png',
    category: 'Utility'
  },
  dmg: {
    sign: false,
    contents: [
      {
        x: 410,
        y: 150,
        type: 'link',
        path: '/Applications'
      },
      {
        x: 130,
        y: 150,
        type: 'file'
      }
    ]
  },
  nsis: {
    oneClick: false,
    perMachine: false,
    allowElevation: true,
    allowToChangeInstallationDirectory: true,
    createDesktopShortcut: true,
    createStartMenuShortcut: true,
    shortcutName: 'PromptHub'
  }
};

module.exports = config;