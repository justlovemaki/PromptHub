import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import { viteStaticCopy } from 'vite-plugin-static-copy';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    viteStaticCopy({
      targets: [
        {
          src: 'manifest.json',
          dest: './',
        },
        {
          src: '../../src/tags',
          dest: './',
        }
      ],
    }),
  ],
  build: {
    rollupOptions: {
      input: {
        sidepanel: resolve(__dirname, 'sidepanel.html'),
        background: resolve(__dirname, 'background.js'),
        content: resolve(__dirname, 'content.js'),
      },
      output: {
        entryFileNames: (chunkInfo) => {
          // 根据入口点名称设置输出文件名
          if (chunkInfo.name === 'background' || chunkInfo.name === 'content') {
            return '[name].js';
          }
          return 'assets/[name].[hash].js';
        },
        chunkFileNames: 'assets/[name].[hash].js',
        assetFileNames: (assetInfo) => {
          if (assetInfo.name.endsWith('.html')) {
            return '[name].[ext]';
          }
          return 'assets/[name].[hash].[ext]';
        },
        // 确保输出到 dist 目录，便于加载扩展
        dir: 'dist'
      }
    }
  },
  publicDir: 'public', // 使用 public 目录来存放静态资源，这里不再需要，因为通过 viteStaticCopy 处理了
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
  // 为开发模式配置服务器
  server: {
    port: 5173,
    strictPort: true,
  },
});