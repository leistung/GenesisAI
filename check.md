# GenesisAI 项目全面排查报告

> 检查日期：2026-06-09  
> 项目名称：GenesisAI — AI 图像生成平台  
> 技术栈：Next.js 16 + TypeScript + Prisma + NextAuth v5 + Tailwind CSS v4 + PostgreSQL

---

## 一、项目概览

| 统计项 | 数量 |
|--------|------|
| 页面路由 | 13 |
| React 组件 | 12 |
| API 路由 | 17 |
| 库/服务文件 | 8 |
| 配置文件 | 5 |
| 总文件数 | 55+ |

---

## 二、页面功能点总览

### 2.1 首页 (`/`) — `/src/app/page.tsx`

| 功能点 | 前端实现 | 后端API | 状态 |
|--------|:--------:|:-------:|:----:|
| Hero 首屏展示 | ✅ | — | ✅ 完成 |
| 风格模板展示 (StyleTemplates) | ✅ | — | ⚠️ 卡片无 onClick 跳转 |
| 社区画廊 (Gallery) | ✅ Mock 数据 | ❌ 未接 API | ⚠️ 纯 Mock |
| 用例展示 (UseCases) | ✅ | — | ✅ 完成 |
| 功能特性 (Features) | ✅ | — | ✅ 完成 |
| 用户评价 (Testimonials) | ✅ | — | ✅ 完成 |
| FAQ | ✅ | — | ⚠️ 品牌名不一致 |

### 2.2 登录页 (`/signin`) — `/src/app/signin/`

| 功能点 | 前端实现 | 后端API | 状态 |
|--------|:--------:|:-------:|:----:|
| Email + 密码登录 | ✅ | NextAuth Credentials | ✅ 完成 |
| Google OAuth 登录 | ✅ | NextAuth Google | ✅ 完成 |
| 新用户注册 | ✅ | `POST /api/auth/register` | ✅ 完成 |
| 表单验证（前端） | ✅ | Zod 验证（后端） | ✅ 完成 |
| Toast 消息提示 | ✅ | — | ✅ 完成 |
| URL 错误参数处理 | ✅ | — | ✅ 完成 |

### 2.3 注册页 (`/signup`) — `/src/app/signup/page.tsx`

| 功能点 | 前端实现 | 后端API | 状态 |
|--------|:--------:|:-------:|:----:|
| 复用 SignInContent (mode="register") | ✅ | `POST /api/auth/register` | ✅ 完成 |

### 2.4 仪表盘 (`/dashboard`) — `/src/app/dashboard/page.tsx`

| 功能点 | 前端实现 | 后端API | 状态 |
|--------|:--------:|:-------:|:----:|
| 认证守卫 | ✅ | Middleware | ✅ 完成 |
| 统计面板（图片数/积分/计划） | ✅ | `GET /api/credits` | ✅ 完成 |
| 用户图片画廊 | ✅ | `GET /api/images` | ✅ 完成 |
| 游标分页加载 | ✅ | — | ✅ 完成 |
| 图片下载 | ✅ | — | ✅ 完成 |
| 图片删除 | ✅ | `DELETE /api/images/:id` | ⚠️ 存储删除失败不阻塞DB删除 |
| 订阅管理入口 | ✅ | `POST /api/creem/portal` | ✅ 完成 |

### 2.5 设置页 (`/settings`) — `/src/app/settings/page.tsx`

| 功能点 | 前端实现 | 后端API | 状态 |
|--------|:--------:|:-------:|:----:|
| 认证守卫 | ✅ | Middleware | ✅ 完成 |
| 用户名修改 | ✅ | `PATCH /api/v1/user/profile` | ✅ 完成 |
| 修改密码（非OAuth） | ✅ | `PATCH /api/v1/user/password` | ⚠️ 前端缺少 currentPassword 空值校验 |
| OAuth 用户检测 | ✅ | `GET /api/v1/user/has-password` | ✅ 完成 |
| Toast 通知 | ⚠️ Bug | — | 🐛 error 也显示 ✓ 图标 |

### 2.6 定价页 (`/pricing`) — `/src/app/pricing/page.tsx`

| 功能点 | 前端实现 | 后端API | 状态 |
|--------|:--------:|:-------:|:----:|
| 三档定价展示 | ✅ | `GET /api/creem/products` | ✅ 完成 |
| 月度/年度切换 | ⚠️ UI 有、逻辑无 | — | 🐛 切换不改变价格 |
| 付费订阅跳转 | ✅ | `POST /api/creem/checkout` | ⚠️ successUrl 无验证 |
| 当前计划检测 | ✅ | — | ✅ 完成 |
| 未登录引导 | ✅ | — | ✅ 完成 |

### 2.7 社区画廊 (`/community`) — `/src/app/community/page.tsx`

| 功能点 | 前端实现 | 后端API | 状态 |
|--------|:--------:|:-------:|:----:|
| 公开图片展示 | ✅ | `GET /api/images?public=true` | ✅ 完成 |
| 风格过滤 | ✅ | `?style=xxx` | ⚠️ style=null 也被返回 |
| 游标分页 | ✅ | — | ✅ 完成 |
| 下载图片 | ✅ | — | ✅ 完成 |
| 点赞/取消点赞 | ✅ | `POST /api/v1/images/:id/like` | ⚠️ 初始状态未同步 |
| 收藏/取消收藏 | ✅ | `POST/DELETE /api/v1/bookmarks` | ⚠️ 初始状态未同步 |

### 2.8 认证错误页 (`/auth/error`) — `/src/app/auth/error/page.tsx`

| 功能点 | 前端实现 | 后端API | 状态 |
|--------|:--------:|:-------:|:----:|
| 错误提示展示 | ✅ | — | ✅ 完成 |
| 重试/回首页导航 | ✅ | — | ✅ 完成 |

### 2.9~2.13 五大生成专区

| 路由 | 前端组件 | 状态 |
|------|---------|:----:|
| `/generate/anime` | StyleGeneratorPage (anime 配置) | ✅ 完成 |
| `/generate/creative` | StyleGeneratorPage (creative 配置) | ✅ 完成 |
| `/generate/landscape` | StyleGeneratorPage (landscape 配置) | ✅ 完成 |
| `/generate/portrait` | StyleGeneratorPage (portrait 配置) | ✅ 完成 |
| `/generate/product` | StyleGeneratorPage (product 配置) | ✅ 完成 |

**共用组件 StyleGeneratorPage 功能点：**

| 功能点 | 前端实现 | 后端API | 状态 |
|--------|:--------:|:-------:|:----:|
| Prompt 输入（2000字符限制） | ✅ | — | ⚠️ placeholder 缺空格 |
| 随机灵感填充 | ✅ | — | ✅ 完成 |
| Negative Prompt | ✅ | — | ✅ 完成 |
| 模型选择 | ✅ | `GET /api/models` | ✅ 完成 |
| 画幅比例选择 | ✅ | — | ✅ 完成 |
| 参考图上传 | ✅ | — | ⚠️ base64 大图内存风险 |
| SSE 流式生成 | ✅ | `POST /api/generate` | ⚠️ SSE 解析可能截断 |
| 进度条展示 | ✅ | — | ⚠️ 假进度（硬编码） |
| 结果下载 | ✅ | — | ✅ 完成 |
| 发布到社区 | ✅ | `PATCH /api/images/:id` | ⚠️ 缺少成功反馈 |
| 社区作品展示 | ✅ | `GET /api/images?style=xxx&public=true` | ✅ 完成 |
| 社区作品点赞 | ✅ | `POST /api/v1/images/:id/like` | ✅ 完成 |
| 积分查询 | ✅ | `GET /api/credits` | ✅ 完成 |

---

## 三、组件清单

| 组件 | 用途 | 类型 | 状态 |
|------|------|------|:----:|
| Header | 全局导航 | 客户端 | ✅ 完成 |
| Footer | 全局页脚 | 服务端 | ⚠️ 法律链接占位 |
| Hero | 首屏展示 | 服务端 | ✅ 完成 |
| Features | 功能卡片 | 服务端 | ✅ 完成 |
| UseCases | 用例轮播 | 客户端 | ⚠️ 初始滚动状态未检测 |
| StyleTemplates | 风格轮播 | 客户端 | 🐛 卡片无点击行为 |
| Gallery | 画廊分页 | 客户端 | ⚠️ 纯 Mock 数据 |
| Testimonials | 用户评价 | 服务端 | ✅ 完成 |
| FAQ | 常见问题 | 客户端 | ⚠️ 品牌名不一致 |
| ImageGenerator | 通用图像生成 | 客户端 | 🐛 下拉菜单定位错误 / referenceImage 未发送 |
| StyleGeneratorPage | 风格专用生成 | 客户端 | 🐛 多个问题（见下文） |
| SessionProvider | Auth Provider 封装 | 客户端 | ⚠️ 未暴露 session prop |

---

## 四、API 路由清单

| 端点 | 方法 | 用途 | 认证 | 状态 |
|------|:----:|------|:----:|:----:|
| `/api/auth/*` | GET/POST | NextAuth 认证 | — | ✅ 完成 |
| `/api/auth/register` | POST | 用户注册 | ❌ | ⚠️ 无速率限制 |
| `/api/generate` | POST | AI 图像生成 (SSE) | 可选 | 🐛 匿名无限生成 |
| `/api/models` | GET | 获取模型列表 | ❌ | ⚠️ 无缓存 |
| `/api/images` | GET | 获取图片列表 | 私有需认证 | ⚠️ style=null 过滤异常 |
| `/api/images/[id]` | DELETE/PATCH | 删除/更新图片 | ✅ | ⚠️ PATCH 无验证 |
| `/api/v1/images/[id]/like` | POST | 点赞切换 | ✅ | ⚠️ 额外DB查询 |
| `/api/credits` | GET/POST | 积分查询/管理 | ✅/Admin | ⚠️ amount 无上限 |
| `/api/v1/bookmarks` | GET/POST | 书签管理 | ✅ | ⚠️ GET 无分页 |
| `/api/v1/bookmarks/[id]` | DELETE | 删除书签 | ✅ | ✅ 完成 |
| `/api/v1/user/profile` | PATCH | 更新用户资料 | ✅ | ✅ 完成 |
| `/api/v1/user/password` | PATCH | 修改密码 | ✅ | 🐛 修改后未失效会话 |
| `/api/v1/user/has-password` | GET | 检查密码状态 | ✅ | ⚠️ 缺 try-catch |
| `/api/creem/webhook` | POST | Creem 支付回调 | HMAC | 🐛 积分覆盖而非叠加 |
| `/api/creem/checkout` | POST | 创建支付会话 | ✅ | 🐛 successUrl 无白名单 |
| `/api/creem/portal` | POST | 客户管理门户 | ✅ | ✅ 完成 |
| `/api/creem/products` | GET | 获取套餐列表 | ❌ | ⚠️ 并发种子风险 |

---

## 五、库/服务文件清单

| 文件 | 用途 | 状态 |
|------|------|:----:|
| `auth.ts` | NextAuth v5 配置 | ✅ 完成 |
| `ai-service.ts` | AI 生成核心服务 | 🐛 API Key 明文存DB / ImageID 不一致 |
| `db.ts` | Prisma 单例 | ✅ 完成 |
| `credits.ts` | 积分管理 | ⚠️ 竞态条件 / 逻辑不一致 |
| `storage.ts` | S3/R2 对象存储 | ⚠️ 预签名URL 7天过期 / 无重试 |
| `rate-limit.ts` | 速率限制 | ⚠️ 多进程不共享 |
| `logger.ts` | 结构化日志 | ✅ 完成 |
| `styles.ts` | 五大风格配置 | ⚠️ 硬编码 / 模型名可能过期 |

---

## 六、严重 Bug 清单

### 🔴 严重 (High)

| # | 文件 | 问题 | 影响 |
|---|------|------|------|
| H1 | `api/generate/route.ts` | **匿名用户可无限免费生成图像**。第 77 行 `if (userId)` 导致未登录用户完全跳过积分检查和扣除 | 业务损失：任何人都可不付费无限使用 |
| H2 | `lib/ai-service.ts` | **API Key 明文存储在数据库**。第 52 行从 DB 读取 `model.apiKey` 并在内存中明文使用 | 安全风险：数据库泄漏 = 所有 AI 服务 API Key 泄漏 |
| H3 | `api/creem/webhook/route.ts` | **订阅积分覆盖而非叠加**。第 195-202 行 `subscription.active` 和第 229-232 行 `subscription.paid` 将 credits 设为绝对值而非增量，用户原有积分被覆盖丢失 | 用户数据丢失 |
| H4 | `api/creem/checkout/route.ts` | **successUrl/cancelUrl 无白名单验证**。攻击者可构造钓鱼链接，用户支付后被重定向到恶意网站 | 安全风险：钓鱼攻击向量 |

### 🟡 中等 (Medium)

| # | 文件 | 问题 | 影响 |
|---|------|------|------|
| M1 | `lib/storage.ts` | 预签名 URL 7 天后过期，数据库中的图片链接失效 | 历史图片无法访问 |
| M2 | `lib/ai-service.ts` | 第 432 行 `imageId` 使用 `crypto.randomUUID()`，但数据库使用 Prisma 自增ID，导致存储 key 与 DB 记录不匹配 | 文件管理混乱 |
| M3 | `api/v1/user/password/route.ts` | 修改密码后未失效现有 JWT 会话 | 旧 token 仍可访问 |
| M4 | `middleware.ts` | 仅检查 cookie 是否存在，不验证 token 有效性和过期时间 | 伪造 cookie 可绕过认证 |
| M5 | `lib/rate-limit.ts` | 内存限流器在多进程/Serverless 环境下不共享 | 实际限流失效 |
| M6 | `api/images/[id]/route.ts` | 删除时存储删除失败不阻塞数据库删除，产生 S3 孤立文件 | 存储费用浪费 |
| M7 | `api/creem/webhook/route.ts` | 开发环境跳过 webhook 签名验证 (`CREEM_WEBHOOK_SECRET` 未设置时) | 生产误配置风险 |
| M8 | `api/creem/webhook/route.ts` | 退款 webhook 无实际处理逻辑（仅日志） | 退款不扣积分 |

### 🟢 轻微 (Low)

| # | 文件 | 问题 |
|---|------|------|
| L1 | `api/generate/route.ts` | `fastMode` 参数已校验但从未使用 |
| L2 | `api/generate/route.ts` | SSE 进度（10%/20%/40%/80%）为硬编码假值 |
| L3 | `components/StyleGeneratorPage.tsx` | Prompt placeholder 缺少空格：`"Describe the Animeimage..."` 应为 `"Describe the Anime image..."` |
| L4 | `app/settings/page.tsx` | Toast 错误信息也显示 ✓ CheckCircle 图标 |
| L5 | `components/ImageGenerator.tsx` | referenceImage 已上传但未在 API 请求中发送 |
| L6 | `components/ImageGenerator.tsx` | 模型下拉菜单缺少 `relative` 父容器导致定位错误 |
| L7 | `components/StyleTemplates.tsx` / `UseCases.tsx` | 初始 `canScrollRight` 为 `true`，挂载时未验证 |
| L8 | `components/StyleTemplates.tsx` | 风格卡片为 `<button>` 但无 onClick 处理 |
| L9 | `globals.css` | 缺少 `animate-shimmer` 和 `scrollbar-hide` 的 CSS 定义 |
| L10 | `app/community/page.tsx` | 点赞/收藏初始状态未从后端同步 |
| L11 | `app/pricing/page.tsx` | billingCycle 切换不改变价格显示 |
| L12 | `components/FAQ.tsx` | 品牌名使用 `raphael.app` 而非 `genesisai` |
| L13 | `app/auth/error/page.tsx` | 不必要的 `"use client"` 指令 |
| L14 | `package.json` | `@paddle/paddle-js` 和 `langchain` 未使用的依赖 |

---

## 七、前后端未对齐清单

| 功能 | 前端 | 后端 | 差距 |
|------|:----:|:----:|------|
| 图库（Gallery） | Mock 数据 | `/api/images?public=true` 已实现 | 前端硬编码数据，未接 API |
| 风格模板点击 | 无 onClick | 对应路由存在 | 功能缺口 |
| 年度定价 | UI 有切换 | 无对应逻辑 | 死代码 |
| referenceImage | UI 支持上传 | generate API 未接收 | 前端传了但后端未处理 |
| 点赞/收藏持久化 | 本地 Set | API 已实现 | 初始状态未从 API 加载 |
| TOAST 错误图标 | 始终 ✓ 图标 | 正常返回 400/500 | 前端 UI bug |
| 匿名生成 | 无限制 | 无积分消耗 | 应明确策略 |
| Legal 页面 | Footer 链接 `#` | 无对应页面 | 未开发 |

---

## 八、优化建议

### 8.1 立即修复 (P0)

1. **H1**: `generate/route.ts` — 未登录用户也需消耗积分或限制每日次数
2. **H2**: `ai-service.ts` — 将 API Key 移至环境变量，不存储在 DB
3. **H3**: `creem/webhook/route.ts` — 积分改用 `increment` 而非 `set`
4. **H4**: `creem/checkout/route.ts` — successUrl/cancelUrl 加同源白名单校验

### 8.2 短期修复 (P1)

5. **M4**: middleware.ts — 调用 `auth()` 验证 token 而非仅检查 cookie
6. **M3**: 修改密码后调用 session destroy / 强制重新登录
7. **M6**: 数据库删除与存储删除改为事务或补偿逻辑
8. **L3**: StyleGeneratorPage.tsx 第 ~400 行 placeholder 加空格
9. **L4**: settings/page.tsx Toast 图标区分 success/error
10. **L5**: ImageGenerator.tsx handleGenerate 中传入 referenceImage
11. **L6**: ImageGenerator.tsx 模型下拉父容器加 `relative`
12. **L9**: globals.css 补充 `@keyframes shimmer` 和 `.scrollbar-hide` 定义
13. **L8**: StyleTemplates.tsx 卡片添加 onClick 跳转到对应生成页
14. **L10**: community/page.tsx 初始化时加载用户点赞/收藏状态
15. **L14**: package.json 清理未使用依赖

### 8.3 长期优化 (P2)

16. Gallery 组件接入真实 API 替代 Mock 数据
17. pricing billingCycle 实现实际折扣计算
18. SSE 解析改为带缓冲区的逐行解析
19. 数据库 API Key 全部迁移到环境变量
20. 使用 Prisma JSON 字段替代 `JSON.stringify` 存储 features
21. 所有 `img` 标签迁移到 Next.js `Image` 组件
22. FAQ 品牌名统一为 GenesisAI
23. Footer Legal 链接指向实际页面
24. 风格配置从硬编码迁移到数据库管理
25. 内存限流器添加定期清理机制

---

## 九、项目架构总结

```
GenesisAI/
├── src/
│   ├── app/                     # Next.js App Router
│   │   ├── page.tsx             # 首页 (组合6个子组件)
│   │   ├── layout.tsx           # 根布局 (Header + Footer)
│   │   ├── signin/              # 登录 (复用 SignInContent)
│   │   ├── signup/              # 注册 (复用 SignInContent)
│   │   ├── dashboard/           # 仪表盘 (需认证)
│   │   ├── settings/            # 设置 (需认证)
│   │   ├── pricing/             # 定价
│   │   ├── community/           # 社区画廊
│   │   ├── auth/error/          # 认证错误页
│   │   ├── generate/            # 五大生成专区
│   │   │   ├── anime/
│   │   │   ├── creative/
│   │   │   ├── landscape/
│   │   │   ├── portrait/
│   │   │   └── product/
│   │   └── api/                 # 17 个 API 路由
│   ├── components/              # 12 个 React 组件
│   │   └── providers/           # SessionProvider
│   ├── lib/                     # 8 个服务库
│   ├── middleware.ts            # 认证中间件
│   └── globals.css              # 全局样式
├── assets/                      # 静态资源
├── docker-compose.yml           # PostgreSQL
├── .env.example                 # 环境变量模板
└── package.json                 # 依赖 (Next.js 16)
```

**总体评价**：前端页面结构完整，UI 覆盖全面，后端 API 核心流程可用。但存在 **4 个严重安全/业务 Bug**（匿名免费生成、API Key 明文存储、积分覆盖、URL 无验证）和若干中轻度问题。建议按 P0 → P1 → P2 优先级逐项修复。