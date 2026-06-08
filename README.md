# GenesisAI

> 专业的全栈 AI 图片生成平台，支持多风格艺术创作、社区分享和订阅付费系统。

<div align="center">

[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-blue?logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-38bdf8?logo=tailwindcss)](https://tailwindcss.com/)
[![Prisma](https://img.shields.io/badge/Prisma-6-2d3748?logo=prisma)](https://www.prisma.io/)
[![NextAuth](https://img.shields.io/badge/NextAuth-v5-8b5cf6)](https://authjs.dev/)
[![Creem](https://img.shields.io/badge/Payment-Creem-00c389)](https://creem.io/)
[![License](https://img.shields.io/badge/License-MIT-green)](./LICENSE)

</div>

---

## 功能特性

### AI 智能生成
- **5 种艺术风格** — 动漫、肖像增强、风景增强、创意艺术、产品图
- **隐藏系统提示词** — 每种风格有优化的系统提示词，确保专业效果
- **多模型支持** — 每种风格可配置不同 AI 模型（Stability AI / Replicate / OpenAI）
- **实时进度** — SSE 流式传输，实时展示生成状态
- **参考图上传** — 上传参考图引导 AI 生成

### 用户系统
- **邮箱 & Google OAuth 登录** — 支持邮箱密码或 Google 账号安全登录
- **积分系统** — 每日免费积分 + 高级订阅积分
- **用户仪表盘** — 查看、下载、删除生成的图片
- **生成历史** — 完整的生成记录，含提示词和时间戳

### 社区
- **公开画廊** — 与社区分享你的作品
- **风格筛选** — 按艺术风格浏览社区作品
- **点赞 & 收藏** — 点赞和收藏社区图片
- **一键发布** — 在公开和私密之间切换图片状态

### 商业化
- **订阅套餐** — Free、Premium、Ultimate 三档
- **Creem 支付** — MoR（税务代扣），支持 Webhook 验证
- **月付/年付** — 灵活的计费周期，年付享折扣

### 安全
- **服务端 API 密钥** — AI 密钥不暴露给客户端
- **NextAuth 会话** — 加密 JWT 认证
- **Creem 签名验证** — HMAC-SHA256 Webhook 验证，防时序攻击
- **限流保护** — API 防滥用（Upstash Redis / 内存回退）
- **Zod 校验** — 基于 Schema 的输入验证
- **用户授权** — 用户只能访问自己的数据

---

## 快速开始

### 前置要求

- **Node.js** 18+
- **npm** 9+
- **Docker**（用于 PostgreSQL）

### 1. 克隆 & 安装

```bash
git clone <your-repo-url>
cd GenesisAI
npm install
```

### 2. 环境配置

```bash
cp .env.example .env.local
```

编辑 `.env.local`，填入你的配置：

```env
# 数据库（通过 Docker 运行 PostgreSQL）
DATABASE_URL="postgresql://genesis_user:genesis_password@localhost:5433/genesisai"

# NextAuth v5
AUTH_SECRET="your-secret-here"

# Google OAuth
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# Creem 支付
CREEM_API_KEY="your-creem-api-key"
CREEM_WEBHOOK_SECRET="your-creem-webhook-secret"

# AI 提供商: "placeholder" | "stability" | "replicate" | "openai"
AI_PROVIDER="placeholder"
STABILITY_API_KEY=""
OPENAI_API_KEY=""
REPLICATE_API_TOKEN=""

# Upstash Redis（可选，生产环境限流）
UPSTASH_REDIS_REST_URL=""
UPSTASH_REDIS_REST_TOKEN=""

# S3/R2 存储（可选，图片持久化）
S3_ENDPOINT=""
S3_ACCESS_KEY_ID=""
S3_SECRET_ACCESS_KEY=""
S3_BUCKET_NAME="genesisai-images"
S3_REGION="auto"
S3_PUBLIC_URL=""
```

### 3. 数据库初始化

```bash
# 启动 PostgreSQL（Docker）
docker compose up -d

# 推送 Schema 到数据库
npm run db:push

# 填充默认套餐数据
npm run db:seed
```

### 4. 启动开发服务器

```bash
npm run dev
```

浏览器打开 [http://localhost:3000](http://localhost:3000)。

---

## 项目结构

```
GenesisAI/
├── assets/                        # 截图和静态资源
├── prisma/
│   ├── schema.prisma              # 数据库 Schema（User, Image, Order, Plan, Like, Bookmark）
│   ├── seed.ts                    # 数据库种子
│   └── seed-ai-models.ts          # AI 模型种子
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── auth/
│   │   │   │   ├── [...nextauth]/ # NextAuth v5 处理器
│   │   │   │   └── register/      # 用户注册 API
│   │   │   ├── credits/           # 积分管理 API
│   │   │   ├── creem/
│   │   │   │   ├── checkout/      # Creem 结账会话
│   │   │   │   ├── portal/        # Creem 客户门户
│   │   │   │   ├── products/      # Creem 产品列表
│   │   │   │   └── webhook/       # Creem Webhook 处理
│   │   │   ├── generate/          # SSE 图片生成 API
│   │   │   ├── images/
│   │   │   │   ├── route.ts       # 图片 CRUD + 社区查询
│   │   │   │   └── [id]/route.ts  # 图片发布/删除
│   │   │   ├── models/            # AI 模型 API
│   │   │   └── v1/
│   │   │       ├── bookmarks/     # 收藏列表 / 添加 / 取消
│   │   │       ├── images/[id]/like/  # 点赞 / 取消点赞
│   │   │       └── user/          # 资料与密码修改
│   │   ├── auth/error/            # 认证错误页
│   │   ├── community/             # 社区画廊页
│   │   ├── dashboard/             # 用户仪表盘页
│   │   ├── generate/
│   │   │   ├── anime/             # 动漫风格生成
│   │   │   ├── portrait/          # 肖像增强
│   │   │   ├── landscape/         # 风景增强
│   │   │   ├── creative/          # 创意艺术生成
│   │   │   └── product/           # 产品图生成
│   │   ├── pricing/               # 订阅定价页
│   │   ├── settings/              # 用户设置页
│   │   ├── signin/                # 登录页
│   │   ├── signup/                # 注册页
│   │   ├── layout.tsx             # 根布局
│   │   └── page.tsx               # 首页
│   ├── components/
│   │   ├── providers/             # SessionProvider
│   │   ├── Header.tsx             # 全局导航栏
│   │   ├── Footer.tsx             # 全局页脚
│   │   ├── StyleGeneratorPage.tsx # 共享生成页组件
│   │   └── ...                    # 其他 UI 组件
│   ├── lib/
│   │   ├── ai-service.ts          # AI 提供商抽象层
│   │   ├── auth.ts                # NextAuth v5 配置
│   │   ├── credits.ts             # 积分检查/消耗/充值逻辑
│   │   ├── db.ts                  # Prisma Client 单例
│   │   ├── logger.ts              # 结构化日志
│   │   ├── rate-limit.ts          # 限流工具
│   │   ├── storage.ts             # S3/R2 存储客户端
│   │   └── styles.ts              # 风格配置 & 系统提示词
│   └── middleware.ts              # 认证路由守卫
├── .env.example                   # 环境变量模板
├── docker-compose.yml             # PostgreSQL Docker 配置
├── next.config.ts                 # Next.js 配置
├── package.json
└── tsconfig.json
```

---

## 风格配置

每种 AI 生成风格在 [src/lib/styles.ts](./src/lib/styles.ts) 中有独立优化配置：

| 风格 | 路由 | 系统提示词主题 | 配色 |
|------|------|--------------|------|
| 动漫 | `/generate/anime` | 高质量动漫插画 | 粉 → 紫 |
| 肖像 | `/generate/portrait` | 专业肖像增强 | 玫红 → 粉 |
| 风景 | `/generate/landscape` | 自然风景增强 | 翠绿 → 青绿 |
| 创意 | `/generate/creative` | 艺术创意表达 | 紫 → 靛蓝 |
| 产品 | `/generate/product` | 电商产品摄影 | 蓝 → 青色 |

---

## 数据库模型

| 模型 | 说明 |
|------|------|
| **User** | 用户账号，含积分、订阅等级、OAuth 信息 |
| **Image** | 生成的图片，含提示词、风格、URL、发布状态 |
| **Order** | Creem 支付交易记录 |
| **Plan** | 订阅套餐定义（Free / Premium / Ultimate） |
| **Like** | 点赞关系（防止重复点赞） |
| **Bookmark** | 收藏关系（用户 ↔ 图片） |
| **Account** | NextAuth OAuth 提供商账号 |
| **Session** | NextAuth 用户会话 |
| **VerificationToken** | NextAuth 验证令牌 |

---

## 可用脚本

| 脚本 | 说明 |
|------|------|
| `npm run dev` | 启动开发服务器（0.0.0.0:3000，Turbopack） |
| `npm run build` | 生成 Prisma Client + 生产构建 |
| `npm run start` | 启动生产服务器 |
| `npm run lint` | 运行 ESLint |
| `npm run db:push` | 推送 Schema 到数据库 |
| `npm run db:studio` | 打开 Prisma Studio GUI |
| `npm run db:migrate` | 创建并应用迁移 |
| `npm run db:seed` | 填充默认套餐数据 |

---

## 外部服务配置

### Google OAuth
1. 访问 [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. 创建 OAuth 2.0 凭据
3. 添加回调 URI：`http://localhost:3000/api/auth/callback/google`
4. 将 Client ID 和 Secret 复制到 `.env.local`

### Creem 支付
1. 在 [Creem](https://creem.io) 注册账号
2. 从控制台获取 API Key
3. 创建月付/年付产品
4. 配置 Webhook：`https://your-domain.com/api/creem/webhook`
5. 设置 Webhook Secret 用于 HMAC-SHA256 签名验证

### AI API
- **[Stability AI](https://platform.stability.ai)** — 推荐用于通用图片生成
- **[Replicate](https://replicate.com)** — 多样化模型选择
- **[OpenAI DALL·E](https://platform.openai.com)** — DALL·E 图片生成

---

## 部署

### Vercel（推荐）
```bash
vercel deploy
```
在 Vercel 控制台设置所有环境变量，将 `DATABASE_URL` 改为生产 PostgreSQL 连接。

### 自托管
```bash
npm run build
npm run start
```
生产环境需要 PostgreSQL 数据库。

---

## 许可证

MIT © GenesisAI
