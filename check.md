# GenesisAI 项目检查报告

## 检查范围

逐页面梳理功能点，检查前端/后端实现状态，标注 Bug 和优化建议。

---

## 一、页面功能检查

### 1. 首页 `/` (page.tsx)

| 功能点 | 前端 | 后端 | 状态 |
|--------|------|------|------|
| Hero 展示 | ✅ | - | 正常 |
| Gallery 展示 | ✅ | ✅ GET /api/images?public=true | 正常 |
| 风格模板卡片 | ✅ | - | 正常 |
| 用例展示 | ✅ | - | 正常 |
| 功能特性展示 | ✅ | - | 正常 |
| 用户评价 | ✅ | - | 正常 |
| FAQ | ✅ | - | 正常 |

**Bug：**
- ⚠️ **Gallery 展示未使用分页** — 首页 Gallery 组件可能请求大量图片，应限制 limit

---

### 2. 登录/注册页 `/signin` (SignInContent.tsx)

| 功能点 | 前端 | 后端 | 状态 |
|--------|------|------|------|
| 登录表单 | ✅ | ✅ NextAuth signIn | 正常 |
| 注册表单 | ✅ | ✅ POST /api/auth/register | 正常 |
| Tab 切换登录/注册 | ✅ | - | 正常 |
| 错误提示 Toast | ✅ | - | 正常 |
| 成功提示 Toast | ✅ | - | 正常 |
| URL 错误参数解析 | ✅ | - | 正常 |
| Google OAuth | ✅ | ✅ NextAuth Google Provider | 正常 |
| 注册后自动登录 | ✅ | ✅ signIn("credentials") | 正常 |
| 密码显示/隐藏 | ✅ | - | 正常 |
| 客户端表单验证 | ✅ | - | 正常 |

**Bug：**
- 🐛 **登录成功后 loading 状态未重置** — `signIn` 成功后直接 `router.push()`，但 `setLoading(false)` 没有被调用，如果路由跳转慢，按钮会一直转圈
- ⚠️ **注册时登录模式密码 minLength=6 限制** — 登录模式的密码输入框也有 `minLength={6}`，但用户可能密码不足 6 位（如旧数据），导致无法登录

---

### 3. 仪表盘 `/dashboard` (DashboardPage)

| 功能点 | 前端 | 后端 | 状态 |
|--------|------|------|------|
| 统计卡片（图片数/积分/套餐） | ✅ | ✅ GET /api/credits, GET /api/images | 正常 |
| 图片网格展示 | ✅ | ✅ GET /api/images | 正常 |
| 游标分页加载更多 | ✅ | ✅ cursor 参数 | 正常 |
| 下载图片 | ✅ | - | 正常 |
| 删除图片 | ✅ | ✅ DELETE /api/images/:id | 正常 |
| 管理订阅 | ✅ | ✅ POST /api/creem/portal | 正常 |
| 升级套餐链接 | ✅ | - | 正常 |

**Bug：**
- 🐛 **Total Images 只显示当前加载的数量** — `images.length` 只是已加载的图片数，不是总数。用户有 100 张图但只加载了 20 张时显示 "20" 误导
- 🐛 **删除图片后积分不刷新** — 删除图片不涉及积分，但如果未来添加"删除退积分"功能需注意
- ⚠️ **manageSubscription 无错误提示** — 如果 Creem Portal 调用失败（如用户无订阅），用户看不到任何反馈

---

### 4. 社区画廊 `/community` (CommunityPage)

| 功能点 | 前端 | 后端 | 状态 |
|--------|------|------|------|
| 风格筛选 | ✅ | ✅ style 参数 | 正常 |
| 图片网格展示 | ✅ | ✅ GET /api/images?public=true | 正常 |
| 下载图片 | ✅ | - | 正常 |
| 点赞 | ❌ | ✅ POST /api/v1/images/:id/like | **前端未接入** |
| 收藏 | ❌ | ✅ POST /api/v1/bookmarks | **前端未接入** |
| 分页加载更多 | ❌ | ✅ cursor 参数 | **前端未接入** |

**Bug：**
- 🐛 **没有分页** — 请求 `limit=50` 但没有"加载更多"，超过 50 张图片就看不到了
- 🐛 **likes 数据展示但无交互** — 社区图片展示了 likes 数，但点击心形图标没有点赞功能
- ⚠️ **style 筛选可能为 null** — 很多图片的 style 字段为 null，筛选时会被遗漏

---

### 5. 定价页 `/pricing` (PricingPage)

| 功能点 | 前端 | 后端 | 状态 |
|--------|------|------|------|
| 套餐展示 | ✅ | - | 正常（硬编码） |
| 月付/年付切换 | ✅ | - | 正常 |
| 当前套餐标识 | ✅ | ✅ session.subscriptionTier | 正常 |
| Creem 结账跳转 | ✅ | ✅ POST /api/creem/checkout | 正常 |
| 未登录跳转登录 | ✅ | - | 正常 |

**Bug：**
- 🐛 **年付套餐无 Creem Product ID** — 只有月付的 `creemProductId`，年付无法结账
- 🐛 **套餐数据硬编码** — 没有从 `GET /api/creem/products` 获取，如果数据库里的 Plan 变了，前端不会更新
- ⚠️ **Free 按钮点击逻辑** — 点击 Free 的 "Get Started Free" 跳转到 `/signin`，但已登录用户点这个没意义

---

### 6. 设置页 `/settings` (SettingsPage)

| 功能点 | 前端 | 后端 | 状态 |
|--------|------|------|------|
| 修改姓名 | ✅ | ✅ PATCH /api/v1/user/profile | 正常 |
| 显示邮箱（只读） | ✅ | - | 正常 |
| 修改密码 | ✅ | ✅ PATCH /api/v1/user/password | 正常 |
| Toast 提示 | ✅ | - | 正常 |
| 密码显示/隐藏 | ✅ | - | 正常 |

**Bug：**
- 🐛 **OAuth 用户看不到"修改密码"区域** — Google 登录的用户密码为 null，修改密码会返回 400 错误，但前端仍然显示修改密码表单
- ⚠️ **Toast 不会自动消失** — Settings 页面的 Toast 没有 setTimeout 自动关闭

---

### 7. 认证错误页 `/auth/error` (AuthError)

| 功能点 | 前端 | 后端 | 状态 |
|--------|------|------|------|
| 错误信息展示 | ✅ | - | 正常 |
| 重试按钮 | ✅ | - | 正常 |
| 返回首页 | ✅ | - | 正常 |

**无 Bug**

---

### 8. 图片生成页 `/generate/*` (StyleGeneratorPage)

| 功能点 | 前端 | 后端 | 状态 |
|--------|------|------|------|
| Prompt 输入 | ✅ | ✅ POST /api/generate | 正常 |
| 负向 Prompt | ✅ | ✅ negativePrompt | 正常 |
| 模型选择 | ✅ | ✅ model 参数 | 正常 |
| 宽高比选择 | ✅ | ✅ aspectRatio | 正常 |
| 参考图上传 | ✅ | ❌ | **后端未处理参考图** |
| SSE 进度展示 | ✅ | ✅ text/event-stream | 正常 |
| 积分显示 | ✅ | ✅ GET /api/credits | 正常 |
| 发布到社区 | ✅ | ✅ PATCH /api/images/:id | 正常 |
| 社区作品展示 | ✅ | ✅ GET /api/images?public=true | 正常 |
| 随机 Prompt | ✅ | - | 正常 |
| 下载生成图片 | ❌ | - | **下载按钮无 onClick** |
| 点赞社区作品 | ❌ | ✅ POST /api/v1/images/:id/like | **前端未接入** |

**Bug：**
- 🐛 **参考图上传后未传给后端** — 前端可以上传参考图并预览，但 `handleGenerate` 的请求体中没有包含 referenceImage，后端也不处理
- 🐛 **下载按钮无功能** — 生成结果区域的下载按钮 `<button className="p-2 ...">` 没有 onClick 事件
- 🐛 **Prompt 拼接重复** — 前端发送 `prompt: style.systemPrompt + userPrompt`，后端又拼接 `styleConfig.systemPrompt + prompt`，导致 systemPrompt 被拼接两次
- ⚠️ **社区作品无分页** — 只请求 limit=12，无法加载更多
- ⚠️ **未登录用户生成后提示"Sign In Now"只支持 Google** — 按钮只调用 `signIn("google")`，没有邮箱登录选项

---

## 二、后端 API Bug 检查

### 1. `/api/generate` — 图片生成

| 问题 | 严重度 | 说明 |
|------|--------|------|
| 🐛 Prompt 双重拼接 | **高** | 前端已经拼接了 `style.systemPrompt + prompt`，后端又根据 style 查 styleConfigs 再拼接一次，导致 systemPrompt 出现两次 |
| 🐛 Premium 用户积分返回 Infinity | **中** | `checkAndConsumeCredits` 对 premium 用户返回 `remainingCredits: Infinity`，JSON.stringify(Infinity) 会变成 `null` |
| ⚠️ 生成失败后积分退还无事务保护 | **中** | 扣积分和退积分不是原子操作，如果退还失败，用户丢失积分 |
| ⚠️ Replicate 轮询可能阻塞 SSE | **低** | Replicate 轮询最长 120 秒，期间 SSE 连接可能超时 |

### 2. `/api/images` — 图片列表

| 问题 | 严重度 | 说明 |
|------|--------|------|
| 🐛 公开图片 style 筛选遗漏 | **中** | 很多图片 style 为 null，`where: { style: "anime" }` 会遗漏这些图片 |
| ⚠️ 用户图片无 style 筛选 | **低** | 用户模式不支持 style 筛选，功能不统一 |

### 3. `/api/credits` — 积分

| 问题 | 严重度 | 说明 |
|------|--------|------|
| 🐛 Premium 用户 getUserCredits 不重置 | **中** | `getUserCredits` 中 `if (!user.subscriptionTier)` 判断，subscriptionTier 为 "premium" 时不进入重置逻辑，但也不返回正确的积分（直接返回 user.credits，可能是旧值） |
| ⚠️ addCreditsToUser 无上限检查 | **低** | 管理员可以无限加积分 |

### 4. `/api/creem/webhook` — 支付回调

| 问题 | 严重度 | 说明 |
|------|--------|------|
| 🐛 Creem 金额单位不确定 | **中** | 代码假设 Creem 金额为分（除以 100），但 Creem 文档中金额可能是元，需确认 |
| ⚠️ checkout.completed 与 subscription.active 可能重复处理 | **中** | 如果 checkout 是订阅类型，`checkout.completed` 和 `subscription.active` 都会触发，可能重复加积分 |
| ⚠️ subscription.paid 的 creemOrderId 格式自造 | **低** | `sub_${data.id}_paid_${Date.now()}` 不是 Creem 的真实订单 ID，与 `@unique` 约束可能冲突 |

### 5. `/api/creem/checkout` — 结账

| 问题 | 严重度 | 说明 |
|------|--------|------|
| ⚠️ Creem API URL 可能不正确 | **中** | `https://api.creem.io/v1/checkouts` 需确认是否为正确的 Creem API 端点 |

### 6. `/api/v1/bookmarks` — 收藏

| 问题 | 严重度 | 说明 |
|------|--------|------|
| ⚠️ 无分页 | **低** | 收藏列表没有分页，数据量大时有性能问题 |

### 7. `/api/v1/images/:id/like` — 点赞

| 问题 | 严重度 | 说明 |
|------|--------|------|
| 🐛 无防重复点赞 | **中** | 同一用户可以无限次调用 POST 点赞，每次 likes +1，没有 LikeRelation 表来记录谁点过赞 |

---

## 三、跨页面/全局问题

### 1. Middleware

| 问题 | 严重度 | 说明 |
|------|--------|------|
| ⚠️ Session Token Cookie 名称可能不匹配 | **中** | NextAuth v5 默认 cookie 名是 `authjs.session-token`，但不同版本可能不同，需确认 |
| ⚠️ `/settings` 路由未在 middleware 的 protectedRoutes 中 | **低** | 已包含，正常 |

### 2. 认证 (auth.ts)

| 问题 | 严重度 | 说明 |
|------|--------|------|
| ⚠️ JWT token 中的 credits 可能过期 | **中** | token 中的 credits 是登录时的快照，用户生成图片后 credits 变了但 token 没更新，前端显示的 credits 可能不准 |

### 3. 数据库 Schema

| 问题 | 严重度 | 说明 |
|------|--------|------|
| ⚠️ Image.style 可能为 null | **低** | 很多图片 style 为 null，社区筛选时被遗漏 |
| ⚠️ 缺少 LikeRelation 模型 | **中** | 无法追踪谁点过赞，导致可以重复点赞 |

### 4. 前端通用

| 问题 | 严重度 | 说明 |
|------|--------|------|
| 🐛 社区页面和生成页面的点赞/收藏功能前端未接入 | **高** | 后端 API 已实现但前端没有调用 |
| 🐛 生成页面的下载按钮无功能 | **高** | 按钮存在但没有 onClick |
| ⚠️ 首页 Gallery 没有分页 | **低** | 可能加载过多图片 |

---

## 四、Bug 修复优先级排序

### P0 — 必须立即修复

1. ~~**Prompt 双重拼接**~~ — ✅ 已修复：前端不再拼接 systemPrompt，由后端统一处理
2. ~~**下载按钮无功能**~~ — ✅ 已修复：添加了 handleDownload 函数和 onClick 事件
3. ~~**点赞/收藏前端未接入**~~ — ✅ 已修复：社区页和生成页均已接入点赞/收藏

### P1 — 应尽快修复

4. ~~**社区页面无分页**~~ — ✅ 已修复：添加了游标分页和"加载更多"按钮
5. ~~**Premium 用户积分返回 Infinity**~~ — ✅ 已修复：改为返回 999999
6. ~~**重复点赞无限制**~~ — ✅ 已修复：添加 Like 模型 + 事务性 toggle 逻辑
7. ~~**OAuth 用户修改密码**~~ — ✅ 已修复：添加 has-password API，OAuth 用户隐藏修改密码表单
8. ~~**Dashboard Total Images 不准确**~~ — ✅ 已修复：改为 "Images" + "+" 后缀表示还有更多

### P2 — 建议修复

9. ~~**参考图上传未传给后端**~~ — ✅ 已修复：前端传 referenceImage，后端 Stability AI 支持
10. **年付套餐无 Product ID** — 年付无法结账（需 Creem 后台配置）
11. ~~**套餐数据硬编码**~~ — ✅ 已修复：优先从 /api/creem/products 获取，回退到硬编码
12. ~~**checkout.completed 与 subscription.active 重复处理**~~ — ✅ 已修复：添加 subscriptionId 去重检查
13. ~~**Settings Toast 不自动消失**~~ — ✅ 已修复：添加 5 秒自动消失
14. ~~**登录成功 loading 未重置**~~ — ✅ 已修复：登录成功后调用 setLoading(false)

### 其他已修复

15. ~~**Dashboard manageSubscription 无错误提示**~~ — ✅ 已修复：添加 Toast 错误提示
16. ~~**公开图片 style 筛选遗漏 null**~~ — ✅ 已修复：OR 查询包含 style=null 的图片
17. ~~**未登录用户生成后 Sign In 只支持 Google**~~ — ✅ 已修复：改为 Link 跳转到 /signin
18. ~~**登录模式密码 minLength=6 限制**~~ — ✅ 已修复：仅注册模式限制 minLength

---

## 五、功能完整性矩阵

| 功能 | 前端 | 后端 | 数据库 | 状态 |
|------|------|------|--------|------|
| 邮箱密码登录 | ✅ | ✅ | ✅ | 完整 |
| Google 登录 | ✅ | ✅ | ✅ | 完整 |
| 用户注册 | ✅ | ✅ | ✅ | 完整 |
| 图片生成 | ✅ | ✅ | ✅ | 完整 |
| 图片下载 | ✅ | - | - | 完整 |
| 图片删除 | ✅ | ✅ | ✅ | 完整 |
| 图片发布/取消发布 | ✅ | ✅ | ✅ | 完整 |
| 社区浏览 | ✅ | ✅ | ✅ | 完整 |
| 社区分页 | ✅ | ✅ | - | 完整 |
| 风格筛选 | ✅ | ✅ | - | 完整 |
| 点赞 | ✅ | ✅ | ✅ | 完整（Like 模型防重复） |
| 收藏 | ✅ | ✅ | ✅ | 完整 |
| 积分系统 | ✅ | ✅ | ✅ | 完整 |
| 积分充值 | ✅ | ✅ | ✅ | 完整（限管理员） |
| Creem 结账 | ✅ | ✅ | - | 完整 |
| Creem Webhook | - | ✅ | ✅ | 完整 |
| 管理订阅 | ✅ | ✅ | ✅ | 完整 |
| 修改资料 | ✅ | ✅ | ✅ | 完整 |
| 修改密码 | ✅ | ✅ | ✅ | 完整（OAuth 用户隐藏） |
| 参考图上传 | ✅ | ✅ | - | 完整（Stability AI 支持） |
| S3/R2 存储 | - | ✅ | - | 完整 |
| 限流 | - | ✅ | - | 完整 |
| 日志 | - | ✅ | - | 完整 |
| Middleware 守卫 | ✅ | ✅ | - | 完整 |
