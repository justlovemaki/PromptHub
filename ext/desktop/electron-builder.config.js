/**
 * Electron Builder 配置文件
 * 用于构建跨平台的桌面应用程序
 */
const config = {
  appId: "com.prompthub.desktop",
  productName: "PromptHub Desktop",
  directories: {
    output: 'dist-electron'
  },
  files: [
    'out/**/*'
  ],
  extraResources: [
    {
      from: 'resources/',
      to: './',
      filter: ['**/*']
    },
    {
      from: 'resources/',
      to: 'resources/',
      filter: ['**/*']
    }
  ],
  asarUnpack: [
    'resources/**'
  ],
  win: {
    target: [
      {
        target: 'nsis',
        arch: ['x64']
      }
    ],
    icon: 'resources/icon.png',
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
    icon: 'resources/icon.png',  // electron-builder 会自动转换为 .icns
    category: 'public.app-category.productivity',
    hardenedRuntime: true,
    gatekeeperAssess: false,
    entitlements: 'resources/build/entitlements.mac.plist',
    entitlementsInherit: 'resources/build/entitlements.mac.plist'
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
    icon: 'resources/icon.png',
    category: 'Utility',
    maintainer: 'PromptHub <justlikemaki@foxmail.com>'
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