# 主题定制

本文档介绍如何定制 PromptHub 的视觉主题。

## 🎨 CSS 变量

### 配置文件

主题配置位于 [`src/app/globals.css`](../../src/app/globals.css)。

### 核心变量

```css
:root {
  /* 主色调 */
  --primary-100: #6A5ACD;  /* 主色 */
  --primary-200: #3F51B5;  /* 深色变体 */
  
  /* 强调色 */
  --accent-100: #d946ef;   /* 亮色强调 */
  --accent-200: #a21caf;   /* 深色强调 */
  
  /* 文字色 */
  --text-100: #1a1a1a;     /* 主文字 */
  --text-200: #4a4a4a;     /* 次要文字 */
  
  /* 背景色 */
  --bg-100: #ffffff;       /* 主背景 */
  --bg-200: #fafafa;       /* 次要背景 */
  --bg-300: #f0f0f0;       /* 第三层背景 */
  
  /* 状态色 */
  --error-500: #ff1d1d;    /* 错误 */
  --success-500: #15803d;  /* 成功 */
  --warning-500: #a16207;  /* 警告 */
  --info-500: #1e40af;     /* 信息 */
}
```

### 暗色模式

```css
.dark {
  --primary-100: #818cf8;
  --primary-200: #6366f1;
  
  --accent-100: #f0abfc;
  --accent-200: #e879f9;
  
  --text-100: #f5f5f5;
  --text-200: #a3a3a3;
  
  --bg-100: #171717;
  --bg-200: #262626;
  --bg-300: #404040;
}
```

## 🎭 预设配色方案

项目内置多套配色方案，位于 `src/app/` 目录：

| 文件 | 风格 |
|------|------|
| `globals.css` | 默认主题 |
| `globals - 高饱和高对比度蓝紫色系.css` | 高饱和蓝紫 |
| `globals - 孟菲斯蓝色系.css` | 孟菲斯蓝 |
| `globals - 莫兰迪蓝紫色系.css` | 莫兰迪蓝紫 |
| `globals - 青花瓷蓝色系.css` | 青花瓷蓝 |
| `globals - 雾蓝莫兰迪色系.css` | 雾蓝莫兰迪 |
| `globals - 现代蓝灰色系.css` | 现代蓝灰 |

### 切换配色方案

1. 备份当前的 `globals.css`
2. 复制你喜欢的配色方案文件内容
3. 粘贴到 `globals.css`

或者重命名文件：

```bash
# 备份当前主题
mv src/app/globals.css src/app/globals-backup.css

# 使用新主题
cp "src/app/globals - 莫兰迪蓝紫色系.css" src/app/globals.css
```

## 🖌️ 自定义配色

### 创建新配色方案

1. 复制 `globals.css` 作为模板
2. 修改 CSS 变量值
3. 保存为新文件（如 `globals - 你的主题.css`）

### 配色建议

#### 主色调选择

- **蓝色系**: 专业、可信赖
- **紫色系**: 创意、高端
- **绿色系**: 自然、健康
- **橙色系**: 活力、友好

#### 对比度要求

确保文字和背景有足够的对比度：

- 正文文字：至少 4.5:1
- 大标题：至少 3:1

推荐工具：[WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)

## 🧩 组件样式

### 按钮样式

```css
/* 主按钮 */
.btn-primary {
  @apply bg-[var(--primary-100)] text-white hover:bg-[var(--primary-200)];
}

/* 次要按钮 */
.btn-secondary {
  @apply bg-[var(--bg-200)] text-[var(--text-100)] hover:bg-[var(--bg-300)];
}

/* 危险按钮 */
.btn-danger {
  @apply bg-[var(--error-500)] text-white hover:opacity-90;
}
```

### 卡片样式

```css
.card {
  @apply bg-[var(--bg-100)] border border-[var(--bg-300)] rounded-lg shadow-sm;
}

.card-hover {
  @apply hover:shadow-md hover:border-[var(--primary-100)] transition-all;
}
```

### 输入框样式

```css
.input {
  @apply bg-[var(--bg-100)] border border-[var(--bg-300)] rounded-md;
  @apply focus:border-[var(--primary-100)] focus:ring-1 focus:ring-[var(--primary-100)];
}
```

## 🌈 渐变效果

### 背景渐变

```css
.gradient-bg {
  background: linear-gradient(
    135deg,
    var(--primary-100) 0%,
    var(--accent-100) 100%
  );
}
```

### 文字渐变

```css
.gradient-text {
  background: linear-gradient(
    90deg,
    var(--primary-100),
    var(--accent-100)
  );
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}
```

## ✨ 动画效果

### 过渡动画

```css
/* 全局过渡 */
* {
  @apply transition-colors duration-200;
}

/* 悬停效果 */
.hover-lift {
  @apply hover:-translate-y-1 hover:shadow-lg transition-all duration-300;
}
```

### 加载动画

```css
.loading-spin {
  @apply animate-spin;
}

.loading-pulse {
  @apply animate-pulse;
}
```

## 📱 响应式设计

### 断点

```css
/* Tailwind 默认断点 */
sm: 640px   /* 小屏幕 */
md: 768px   /* 中等屏幕 */
lg: 1024px  /* 大屏幕 */
xl: 1280px  /* 超大屏幕 */
2xl: 1536px /* 超超大屏幕 */
```

### 响应式示例

```tsx
<div className="
  px-4 sm:px-6 lg:px-8
  text-sm md:text-base lg:text-lg
  grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3
">
```

## 🔧 Tailwind 配置

### 扩展主题

编辑 `tailwind.config.js`：

```javascript
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: {
          100: 'var(--primary-100)',
          200: 'var(--primary-200)',
        },
        accent: {
          100: 'var(--accent-100)',
          200: 'var(--accent-200)',
        },
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['Fira Code', 'monospace'],
      },
    },
  },
};
```

## ✅ 主题定制检查清单

- [ ] 选择或创建配色方案
- [ ] 配置主色调和强调色
- [ ] 设置文字和背景色
- [ ] 配置状态色（成功、错误、警告）
- [ ] 测试暗色模式
- [ ] 检查对比度
- [ ] 测试响应式布局
- [ ] 验证动画效果

## 下一步

- 了解 [功能扩展](./extending.md)
- 阅读 [国际化扩展](./i18n.md)
- 查看 [品牌定制](./branding.md)