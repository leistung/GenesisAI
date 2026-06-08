# GenesisAI 开发文档 — 路由与 API 设计

## 一、技术栈概览

| 层级 | 技术 | 说明 |
|------|------|------|
| 框架 | Next.js 16 (App Router) | 基于 React 19，使用 Turbopack |
| 语言 | TypeScript | 全栈类型安全 |
| 数据库 | PostgreSQL + Prisma ORM | 通过 Docker 运行 |
| 认证 | NextAuth.js v5 (Auth.js) | 支持 Credentials + Google OAuth |
| 支付 | Creem (creem.io) | 订阅与一次性购买，Merchant of Record |
| 存储 | S3/R2 兼容 | 图片持久化存储 |
| 限流 | @upstash/ratelimit + Redis | 生产级限流，开发环境内存回退 |
| 样式 | Tailwind CSS v4 | 原子化 CSS |
| 验证 | Zod | 请求体 schema 校验 |
| 日志 | 自定义 logger | 结构化日志，API 请求追踪 |

---

## 二、前端路由设计

### 路由结构总览

```
src/app/
├── layout.tsx                    # 根布局（SessionProvider + Header + Footer）
├── page.tsx                      # 首页 /
├── signin/
│   ├── page.tsx                  # 登录/注册页 /signin
│   └── SignInContent.tsx         # 登录/注册客户端组件
├── auth/
│   └── error/
│       └── page.tsx              # 认证错误页 /auth/error
├── dashboard/
│   └── page.tsx                  # 用户仪表盘 /dashboard（需登录，分页加载）
├── community/
│   └── page.tsx                  # 社区画廊 /community（公开，分页加载）
├── pricing/
│   └── page.tsx                  # 定价页 /pricing（公开，Creem 结账）
├── settings/
│   └── page.tsx                  # 用户设置 /settings（需登录，修改密码/资料）
└── generate/
    ├── anime/page.tsx            # 动漫风格生成 /generate/anime
    ├── portrait/page.tsx         # 肖像风格生成 /generate/portrait
    ├── landscape/page.tsx        # 风景风格生成 /generate/landscape
    ├── creative/page.tsx         # 创意风格生成 /generate/creative
    └── product/page.tsx          # 产品风格生成 /generate/product
```

### 页面详细说明

| 路由 | 认证 | 组件 | 说明 |
|------|------|------|------|
| `/` | 否 | Hero + Gallery + StyleTemplates + UseCases + Features + Testimonials + FAQ | 首页 |
| `/signin` | 否（已登录重定向） | SignInContent | 登录/注册页 |
| `/auth/error` | 否 | AuthError | 认证错误提示页 |
| `/dashboard` | 是（Middleware 守卫） | DashboardPage | 仪表盘，积分/订阅/图片，分页加载 |
| `/community` | 否 | CommunityPage | 社区画廊，分页加载 |
| `/pricing` | 否 | PricingPage | 定价页，Creem Checkout 跳转 |
| `/settings` | 是（Middleware 守卫） | SettingsPage | 修改密码/资料 |
| `/generate/*` | 否 | StyleGeneratorPage | 5 种风格 AI 图片生成 |

### 设计要点

- **Middleware 服务端守卫**：`/dashboard` 和 `/settings` 在服务端拦截未认证请求，避免客户端闪现
- **已登录用户访问 `/signin` 自动重定向**到 `/dashboard`
- **5 个生成页面共用 StyleGeneratorPage 组件**，通过 `styleConfigs` 配置差异化
- **根布局统一提供 SessionProvider**，所有页面共享会话状态

---

## 三、后端 API 设计

### API 结构总览

```
src/app/api/
├── auth/
│   ├── [...nextauth]/route.ts    # NextAuth 认证端点
│   └── register/route.ts         # 用户注册
├── generate/
│   └── route.ts                  # AI 图片生成（SSE 流式，多 AI 提供商）
├── images/
│   ├── route.ts                  # 图片列表（游标分页）
│   └── [id]/route.ts             # 单张图片操作（更新/删除，含 S3 删除）
├── credits/
│   └── route.ts                  # 积分查询（用户）/ 充值（仅管理员）
├── creem/
│   ├── webhook/route.ts          # Creem 支付回调
│   ├── checkout/route.ts         # 创建 Creem 结账会话
│   ├── products/route.ts         # Creem 产品/套餐列表
│   └── portal/route.ts           # Creem 客户门户（管理订阅）
└── v1/
    ├── user/
    │   ├── profile/route.ts      # 修改用户资料
    │   └── password/route.ts     # 修改密码
    ├── bookmarks/
    │   ├── route.ts              # 收藏列表 / 添加收藏
    │   └── [id]/route.ts         # 取消收藏
    └── images/
        └── [id]/
            └── like/route.ts     # 点赞 / 取消点赞
```

### API 详细说明

---

#### 1. 认证模块

##### `POST /api/auth/register` — 用户注册

| 项目 | 说明 |
|------|------|
| 认证 | 无需 |
| 请求体 | `{ name: string, email: string, password: string }` |
| 校验 | Zod: name 1-50字符, email 格式, password ≥ 6字符 |
| 成功 | `201 { message, user: { id, email, name } }` |
| 失败 | `400` 校验失败 / `409` 邮箱已存在 / `500` 服务器错误 |

##### `GET|POST /api/auth/[...nextauth]` — NextAuth 认证

| 项目 | 说明 |
|------|------|
| 功能 | 登录、登出、OAuth 回调、Session 获取 |
| Providers | Google OAuth + Credentials (邮箱密码) |
| Session | JWT 策略 |
| 自定义字段 | token 携带 id, credits, subscriptionTier, creemCustomerId, role |

---

#### 2. 图片生成模块

##### `POST /api/generate` — AI 图片生成

| 项目 | 说明 |
|------|------|
| 认证 | 可选（未登录也可生成，但图片标记为公开） |
| 限流 | 10 次/分钟（Upstash Redis / 内存回退） |
| 请求体 | `{ prompt, negativePrompt?, model?, aspectRatio?, style?, color?, lighting?, composition?, fastMode? }` |
| 校验 | Zod: prompt 1-2000字符, negativePrompt ≤ 1000字符 |
| 响应 | SSE (text/event-stream) 流式返回 |
| 积分 | 登录用户消耗 1 积分，不足返回 `402`；失败自动退还 |
| AI 提供商 | 通过 `AI_PROVIDER` 环境变量选择：`placeholder` / `stability` / `replicate` / `openai` |
| 存储 | 如配置 S3/R2，生成图片自动上传 |

**支持的 AI 提供商：**

| 提供商 | 环境变量 | 说明 |
|--------|----------|------|
| placeholder | `AI_PROVIDER="placeholder"` | 开发模式，返回 picsum 占位图 |
| Stability AI | `AI_PROVIDER="stability"` + `STABILITY_API_KEY` | Stable Image API |
| Replicate | `AI_PROVIDER="replicate"` + `REPLICATE_API_TOKEN` | SDXL 等模型，轮询等待 |
| OpenAI | `AI_PROVIDER="openai"` + `OPENAI_API_KEY` | DALL-E 3 |

---

#### 3. 图片管理模块

##### `GET /api/images` — 获取图片列表（游标分页）

| 项目 | 说明 |
|------|------|
| 认证 | 公开图片无需认证；用户图片需要认证 |
| 参数 | `?public=true&style=anime&limit=20&cursor=last_image_id` |
| 分页 | 游标分页（cursor-based），默认 20 条/页，最多 50 条 |
| 成功 | `200 { images: [...], nextCursor: string|null }` |
| 失败 | `401` 未认证 / `500` 服务器错误 |

##### `PATCH /api/images/:id` — 更新图片

| 项目 | 说明 |
|------|------|
| 认证 | 需要（仅能更新自己的图片） |
| 请求体 | `{ isPublic: boolean }` |
| 成功 | `200 { success: true, image }` |

##### `DELETE /api/images/:id` — 删除图片

| 项目 | 说明 |
|------|------|
| 认证 | 需要（仅能删除自己的图片） |
| 存储 | 同时从 S3/R2 删除图片文件（如已配置） |
| 成功 | `200 { success: true }` |

---

#### 4. 积分模块

##### `GET /api/credits` — 查询积分

| 项目 | 说明 |
|------|------|
| 认证 | 需要 |
| 成功 | `200 { credits, subscriptionTier }` |

##### `POST /api/credits` — 充值积分（仅管理员）

| 项目 | 说明 |
|------|------|
| 认证 | 需要，且 `role === "admin"` |
| 请求体 | `{ userId: string, amount: number }` |
| 说明 | 普通用户积分增加通过 Creem Webhook 自动触发 |
| 失败 | `403` 非管理员 |

---

#### 5. Creem 支付模块

##### `POST /api/creem/checkout` — 创建结账会话

| 项目 | 说明 |
|------|------|
| 认证 | 需要 |
| 请求体 | `{ productId, successUrl?, cancelUrl? }` |
| 成功 | `200 { checkoutUrl, checkoutId }` |
| 说明 | 前端跳转到 `checkoutUrl` 完成 Creem 托管支付 |

##### `GET /api/creem/products` — 获取产品/套餐列表

| 项目 | 说明 |
|------|------|
| 认证 | 无需 |
| 成功 | `200 { plans: [...] }` |

##### `POST /api/creem/portal` — 创建客户门户会话

| 项目 | 说明 |
|------|------|
| 认证 | 需要（且已有 Creem 订阅） |
| 成功 | `200 { portalUrl }` |
| 说明 | 用户可管理订阅、取消、更新支付方式 |

##### `POST /api/creem/webhook` — Creem 支付回调

| 项目 | 说明 |
|------|------|
| 认证 | Creem 签名验证（`creem-signature` 头，HMAC-SHA256） |
| 安全 | `timingSafeEqual` 防止时序攻击 |
| 开发模式 | 缺少签名时跳过验证 |

**处理的 Webhook 事件：**

| 事件 | 处理逻辑 |
|------|----------|
| `checkout.completed` | 创建订单，一次性购买加积分，关联 Creem 客户 ID |
| `subscription.active` | 激活订阅，更新 tier 和积分 |
| `subscription.paid` | 续费成功，刷新积分，创建支付订单 |
| `subscription.canceled` | 降级为免费，重置积分 |
| `subscription.scheduled_cancel` | 记录日志，保持当前权益到期末 |
| `subscription.past_due` | 记录警告，可通知用户 |
| `subscription.expired` | 降级为免费 |
| `refund.created` | 记录日志，可扣减积分 |

---

#### 6. V1 API（新功能）

##### `PATCH /api/v1/user/profile` — 修改资料

| 项目 | 说明 |
|------|------|
| 认证 | 需要 |
| 请求体 | `{ name?: string }` |
| 成功 | `200 { user: { id, name, email } }` |

##### `PATCH /api/v1/user/password` — 修改密码

| 项目 | 说明 |
|------|------|
| 认证 | 需要（Credentials 用户） |
| 请求体 | `{ currentPassword, newPassword }` |
| 校验 | 验证当前密码，新密码 ≥ 6 字符 |
| 失败 | `400` 当前密码错误 / OAuth 账户不支持 |

##### `GET /api/v1/bookmarks` — 获取收藏列表

| 项目 | 说明 |
|------|------|
| 认证 | 需要 |
| 成功 | `200 { images: [...] }` |

##### `POST /api/v1/bookmarks` — 添加收藏

| 项目 | 说明 |
|------|------|
| 认证 | 需要 |
| 请求体 | `{ imageId: string }` |
| 说明 | 幂等操作（upsert），重复收藏不报错 |

##### `DELETE /api/v1/bookmarks/:id` — 取消收藏

| 项目 | 说明 |
|------|------|
| 认证 | 需要 |
| 参数 | `:id` 为图片 ID |

##### `POST /api/v1/images/:id/like` — 点赞

| 项目 | 说明 |
|------|------|
| 认证 | 需要 |
| 成功 | `200 { likes: number }` |

##### `DELETE /api/v1/images/:id/like` — 取消点赞

| 项目 | 说明 |
|------|------|
| 认证 | 需要 |
| 成功 | `200 { likes: number }` |

---

## 四、辅助模块 (src/lib/)

| 模块 | 文件 | 说明 |
|------|------|------|
| 认证 | `auth.ts` | NextAuth v5 配置，JWT 回调，Session 类型扩展（含 role、creemCustomerId） |
| 数据库 | `db.ts` | Prisma Client 单例 |
| 积分 | `credits.ts` | 积分检查/消耗/充值/每日重置逻辑 |
| 限流 | `rate-limit.ts` | Upstash Redis 限流（生产）+ 内存回退（开发），10次/分钟 |
| 存储 | `storage.ts` | S3/R2 兼容存储客户端，支持上传/删除/生成 key |
| 日志 | `logger.ts` | 结构化日志，API 请求追踪（方法、路径、状态码、耗时） |
| 风格 | `styles.ts` | 5 种图片风格的配置（系统提示词、模型、用例、技巧） |

---

## 五、中间件 (src/middleware.ts)

| 功能 | 说明 |
|------|------|
| 路由守卫 | `/dashboard` 和 `/settings` 未登录重定向到 `/signin?callbackUrl=...` |
| 已登录重定向 | `/signin` 已登录用户自动跳转到 `/dashboard` |
| 跳过规则 | API 路由、静态文件、NextAuth 内部路由不经过中间件 |
| Session 检测 | 兼容 NextAuth v5 多种 cookie 名称 |

---

## 六、数据模型 (Prisma Schema)

```
User ──< Account        (NextAuth OAuth 账号)
User ──< Session        (NextAuth 会话)
User ──< Image          (生成的图片)
User ──< Order          (支付订单)
User ──< Bookmark       (图片收藏)

Image ──< Bookmark      (被收藏)

Plan                    (定价套餐，种子数据，含 creemProductId)
```

**User 关键字段：**
- `role`：用户角色（"user" | "admin"）
- `credits` + `creditsResetAt`：积分与每日重置
- `subscriptionTier`：订阅等级 (free/premium/ultimate)
- `creemCustomerId` + `creemSubscriptionId`：Creem 支付关联

**Image 关键字段：**
- `likes`：点赞数（默认 0）
- `bookmarks`：收藏关系

**Order 关键字段：**
- `creemOrderId` + `creemTransactionId`：Creem 订单关联

**Plan 关键字段：**
- `creemProductId`：Creem 产品 ID，用于创建结账会话

**Bookmark 模型：**
- `userId` + `imageId`：复合唯一约束，防止重复收藏

---

## 七、环境变量

```bash
# 数据库
DATABASE_URL="postgresql://..."

# NextAuth v5
AUTH_URL="http://localhost:3000"
AUTH_SECRET="..."

# Google OAuth
GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."

# Creem 支付
CREEM_API_KEY="..."
CREEM_WEBHOOK_SECRET="..."

# AI 提供商: "placeholder" | "stability" | "replicate" | "openai"
AI_PROVIDER="placeholder"
STABILITY_API_KEY=""
OPENAI_API_KEY=""
REPLICATE_API_TOKEN=""

# Upstash Redis（可选，生产限流）
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

---

## 八、设计思路与原则

### 1. API 设计原则

**RESTful 风格 + 实用主义**

- 资源型路由：`/api/images`, `/api/credits`, `/api/creem/products`
- 动词用 HTTP 方法区分：`GET` 查询, `POST` 创建/操作, `PATCH` 部分更新, `DELETE` 删除
- 非 CRUD 操作用名词+动词：`/api/generate`（生成不是简单 CRUD），`/api/creem/webhook`（第三方回调）
- 新功能使用版本化路径：`/api/v1/user/profile`, `/api/v1/bookmarks`

**统一响应格式：**

```typescript
// 成功
{ data: T } 或 { success: true, ... }

// 失败
{ error: string }           // 4xx/5xx
{ error: string, details }  // 400 校验失败时附带 Zod 错误详情
```

**HTTP 状态码规范：**

| 状态码 | 含义 | 使用场景 |
|--------|------|----------|
| 200 | 成功 | GET/PATCH/DELETE 成功 |
| 201 | 已创建 | 注册成功 |
| 400 | 请求错误 | Zod 校验失败 |
| 401 | 未认证 | 缺少登录态 |
| 402 | 余额不足 | 积分不够生成图片 |
| 403 | 无权限 | 非管理员操作 / 操作他人资源 |
| 404 | 不存在 | 资源 ID 不存在 |
| 409 | 冲突 | 邮箱已注册 |
| 429 | 限流 | 请求过于频繁 |
| 500 | 服务器错误 | 未捕获异常 |

### 2. 认证与权限设计

- **JWT 策略**而非数据库 Session：减少数据库查询，适合无状态 API
- **自定义 JWT 字段**：将 credits、subscriptionTier、creemCustomerId、role 放入 token
- **Middleware 服务端守卫**：避免客户端闪现未授权内容
- **管理员角色**：`role` 字段区分普通用户和管理员，积分充值等敏感操作限管理员

### 3. 安全设计

- **Zod 校验**：所有 API 入口校验请求体
- **CSRF 保护**：NextAuth 自动处理
- **Webhook 签名验证**：Creem 回调使用 `creem-signature` 头 + HMAC-SHA256 + timingSafeEqual
- **生产级限流**：Upstash Redis + 内存回退
- **权限隔离**：图片操作校验 `userId` 一致性，积分充值限管理员

### 4. SSE 流式设计

图片生成使用 SSE，原因：
- 生成耗时长（3-30秒），需要实时进度反馈
- 前端可展示进度条
- 避免请求超时
- 生成失败自动退还积分

### 5. 游标分页设计

图片列表使用游标分页（cursor-based）而非偏移分页（offset-based）：
- 性能稳定：大数据量时 `WHERE id < cursor` 比 `OFFSET N` 快得多
- 数据一致：新增/删除数据不会导致重复或遗漏
- 响应包含 `nextCursor`，前端据此加载下一页

### 6. 多 AI 提供商设计

通过 `AI_PROVIDER` 环境变量切换，统一返回 `{ success, imageUrl?, imageBuffer?, error? }`：
- 开发环境用 `placeholder` 零成本测试
- 生产环境按需选择 Stability AI / Replicate / OpenAI
- 返回 `imageBuffer` 时自动上传到 S3/R2 存储

### 7. Creem 支付集成设计

Creem 作为 Merchant of Record（税务代扣），集成流程：
1. 前端调用 `POST /api/creem/checkout` 获取结账 URL
2. 跳转到 Creem 托管支付页面
3. 支付完成后 Creem 发送 Webhook 到 `POST /api/creem/webhook`
4. Webhook 处理订阅激活/积分充值/订单记录
5. 用户可通过 `POST /api/creem/portal` 管理订阅

---

## 九、待完善项

### 后续可优化

1. **图片编辑/变体 API** — 当前只有生成，没有对已有图片的编辑/变体功能
2. **邮箱验证** — 注册后未验证邮箱，应添加 emailVerified 流程
3. **OAuth 账号关联** — Google 登录和邮箱密码登录的账号合并
4. **图片审核** — 社区公开图片缺少内容审核机制
5. **WebSocket 实时通知** — 积分变动、订阅状态变更等实时推送
6. **批量操作** — 批量删除图片、批量下载
7. **Sentry 错误监控** — 将 logger.error 对接 Sentry 上报
8. **API 速率配额** — 不同订阅等级不同限流策略
