# 安装指南

## 🚀 快速开始

### 前置要求

- Node.js 18+ 
- Git
- Windows 10/11 (本指南针对Windows环境优化)

### 1. 克隆项目

```bash
git clone <your-repository-url>
cd prompt-manager
```

### 2. 依赖安装 (重要)

由于 Windows 环境下 `better-sqlite3` 的原生模块编译问题，我们提供了以下解决方案：

#### 🎯 推荐方案：使用 Bun

Bun 具有更好的原生模块处理能力，可以避免编译问题：

```bash
# 安装 Bun 包管理器
npm install -g bun

# 使用 Bun 安装依赖
bun install

# 信任并运行必要的后安装脚本
bun pm trust --all
```

**优势**：
- ✅ 避开 node-gyp 编译问题
- ✅ 更快的安装速度
- ✅ 内置更好的二进制文件处理
- ✅ 完美支持 better-sqlite3

#### 🔄 备用方案1：配置npm镜像源

如果您必须使用 npm：

```bash
# 清理缓存
npm cache clean --force

# 配置国内镜像源
npm config set registry https://registry.npmmirror.com

# 设置 better-sqlite3 二进制文件镜像
$env:BETTER_SQLITE3_BINARY_HOST="https://npmmirror.com/mirrors/better-sqlite3"

# 重新安装
npm install
```

#### 🔄 备用方案2：使用 Yarn

```bash
# 安装 Yarn
npm install -g yarn

# 使用 Yarn 安装依赖
yarn install
```

### 3. 环境配置

```bash
# 复制环境变量模板
cp .env.example .env
```

编辑 `.env` 文件，填入必要配置：

```env
# 数据库配置
DB_FILE_NAME=sqlite.db

# JWT 密钥 (必须)
JWT_SECRET=your-super-secret-jwt-key-at-least-32-characters

# OAuth 配置 (可选)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GITHUB_CLIENT_ID=your-github-client-id  
GITHUB_CLIENT_SECRET=your-github-client-secret

# Stripe 配置 (可选)
STRIPE_SECRET_KEY=sk_test_your-stripe-secret-key
STRIPE_WEBHOOK_SECRET=whsec_your-webhook-secret

# Next.js 配置
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-nextauth-secret
```

### 4. 数据库初始化

```bash
# 生成数据库迁移文件
npm run db:generate
# 或使用 Bun
bun run db:generate

# 执行数据库迁移
npm run db:migrate  
# 或使用 Bun
bun run db:migrate
```

### 5. 启动开发服务器

```bash
# 使用 npm
npm run dev

# 或使用 Bun (推荐)
bun run dev
```

🎉 现在访问 http://localhost:3000 即可开始使用！

## ❌ 常见问题解决

### better-sqlite3 安装失败

**错误信息**：
```
gyp ERR! configure error
subprocess.CalledProcessError: Command returned non-zero exit status 1
```

**解决方案**：
1. **首选**：切换到 Bun - `npm install -g bun && bun install`
2. **备选**：使用镜像源和环境变量配置
3. **最后**：切换到 Yarn - `yarn install`

### Node.js 版本问题

确保使用 Node.js 18 或更高版本：

```bash
node --version  # 应显示 v18.x.x 或更高
```

如果版本过低，请升级 Node.js。

### 端口占用问题

如果 3000 端口被占用：

```bash
# 查找占用端口的进程
netstat -ano | findstr :3000

# 终止进程 (替换 PID)
taskkill /PID <进程ID> /F

# 或使用不同端口启动
npm run dev -- -p 3001
```

### 环境变量问题

确保 `.env` 文件：
- 位于项目根目录
- 包含必需的 `JWT_SECRET` 和 `DB_FILE_NAME`
- 没有多余的引号或空格

### 数据库权限问题

Windows 下确保：
- 项目目录有写权限
- SQLite 文件可以创建在指定位置
- 防火墙不阻止本地连接

## 🔧 开发环境验证

安装完成后，验证以下功能：

### 1. API 接口测试

```bash
# 健康检查
curl http://localhost:3000/api/health

# 应返回 {"status": "ok"}
```

### 2. 数据库连接测试

检查 SQLite 文件是否正确创建：

```bash
# Windows
dir *.db

# 应显示 sqlite.db 文件
```

### 3. 页面访问测试

访问以下URL确认工作正常：
- http://localhost:3000 - 主页
- http://localhost:3000/en - 英文版
- http://localhost:3000/zh-CN - 中文版

## 🚀 生产环境部署

### Vercel 部署

```bash
# 安装 Vercel CLI
npm install -g vercel

# 部署到生产环境
vercel --prod
```

### Docker 部署

```bash
# 构建镜像
docker build -t prompt-manager .

# 运行容器
docker run -p 3000:3000 -e JWT_SECRET=your-secret prompt-manager
```

### 环境变量配置

生产环境必须配置：
- `JWT_SECRET` - 随机生成的强密钥
- `DB_FILE_NAME` - 生产数据库路径
- `NEXTAUTH_URL` - 生产域名
- 其他第三方服务密钥

## 📞 获取帮助

如果遇到问题：

1. **检查错误日志**：查看终端输出的详细错误信息
2. **清理重装**：删除 `node_modules` 和 lock 文件，重新安装
3. **环境检查**：确认 Node.js 版本和环境变量配置
4. **切换工具**：尝试不同的包管理器 (npm → Bun → yarn)

---

## ✅ 安装检查清单

- [ ] Node.js 18+ 已安装
- [ ] 项目代码已克隆
- [ ] 依赖包安装成功 (推荐使用 Bun)
- [ ] `.env` 文件已配置
- [ ] 数据库迁移已执行
- [ ] 开发服务器启动成功
- [ ] 能够访问 http://localhost:3000
- [ ] API 健康检查通过
- [ ] 数据库文件正确创建

恭喜！您的 AI 提示词管理平台已经准备就绪！🎉