# GenesisAI Development Documentation — Routes & API Design

## 1. Tech Stack Overview

| Layer | Technology | Description |
|-------|-----------|-------------|
| Framework | Next.js 16 (App Router) | Based on React 19, using Turbopack |
| Language | TypeScript | Full-stack type safety |
| Database | PostgreSQL + Prisma ORM | Running via Docker |
| Auth | NextAuth.js v5 (Auth.js) | Credentials + Google OAuth |
| Payment | Creem (creem.io) | Subscription & one-time purchase, Merchant of Record |
| Storage | S3/R2 compatible | Image persistence |
| Rate Limiting | @upstash/ratelimit + Redis | Production rate limiting, memory fallback in dev |
| Styling | Tailwind CSS v4 | Atomic CSS |
| Validation | Zod | Request body schema validation |
| Logging | Custom logger | Structured logging, API request tracing |

---

## 2. Frontend Routes

### Route Structure

```
src/app/
├── layout.tsx                    # Root layout (SessionProvider + Header + Footer)
├── page.tsx                      # Home page /
├── signin/
│   ├── page.tsx                  # Sign in page /signin
│   └── SignInContent.tsx         # Sign in/register client component
├── signup/
│   └── page.tsx                  # Sign up page /signup (reuses SignInContent)
├── auth/
│   └── error/
│       └── page.tsx              # Auth error page /auth/error
├── dashboard/
│   └── page.tsx                  # User dashboard /dashboard (auth required, paginated)
├── community/
│   └── page.tsx                  # Community gallery /community (public, paginated)
├── pricing/
│   └── page.tsx                  # Pricing page /pricing (public, Creem checkout)
├── settings/
│   └── page.tsx                  # User settings /settings (auth required, password/profile)
└── generate/
    ├── anime/page.tsx            # Anime style generation /generate/anime
    ├── portrait/page.tsx         # Portrait style generation /generate/portrait
    ├── landscape/page.tsx        # Landscape style generation /generate/landscape
    ├── creative/page.tsx         # Creative style generation /generate/creative
    └── product/page.tsx          # Product style generation /generate/product
```

### Page Details

| Route | Auth | Component | Description |
|-------|------|-----------|-------------|
| `/` | No | Hero + Gallery + StyleTemplates + UseCases + Features + Testimonials + FAQ | Home page |
| `/signin` | No (redirects if logged in) | SignInContent | Sign in page |
| `/signup` | No (redirects if logged in) | SignInContent (register mode) | Sign up page |
| `/auth/error` | No | AuthError | Auth error page |
| `/dashboard` | Yes (Middleware guard) | DashboardPage | Dashboard with credits/subscription/images, paginated |
| `/community` | No | CommunityPage | Community gallery, paginated |
| `/pricing` | No | PricingPage | Pricing page, Creem Checkout redirect |
| `/settings` | Yes (Middleware guard) | SettingsPage | Change password/profile |
| `/generate/*` | No | StyleGeneratorPage | 5 style AI image generation |

### Design Notes

- **Middleware server-side guards**: `/dashboard` and `/settings` intercept unauthenticated requests server-side, preventing client-side flash
- **Logged-in users accessing `/signin` or `/signup` are automatically redirected** to `/dashboard`
- **5 generation pages share the StyleGeneratorPage component**, differentiated via `styleConfigs`
- **Root layout provides SessionProvider**, all pages share session state

---

## 3. Backend API Design

### API Structure

```
src/app/api/
├── auth/
│   ├── [...nextauth]/route.ts    # NextAuth auth endpoints
│   └── register/route.ts         # User registration
├── generate/
│   └── route.ts                  # AI image generation (SSE streaming, multi-provider)
├── images/
│   ├── route.ts                  # Image list (cursor pagination)
│   └── [id]/route.ts             # Single image operations (update/delete, incl. S3 delete)
├── credits/
│   └── route.ts                  # Credits query (user) / top-up (admin only)
├── creem/
│   ├── webhook/route.ts          # Creem payment webhook
│   ├── checkout/route.ts         # Create Creem checkout session
│   ├── products/route.ts         # Creem products/plans list
│   └── portal/route.ts           # Creem customer portal (manage subscriptions)
├── models/
│   └── route.ts                  # Available AI models
└── v1/
    ├── user/
    │   ├── profile/route.ts      # Update user profile
    │   ├── password/route.ts     # Change password
    │   └── has-password/route.ts # Check if user has password (OAuth users don't)
    ├── bookmarks/
    │   ├── route.ts              # Bookmark list / add bookmark
    │   └── [id]/route.ts         # Remove bookmark
    └── images/
        └── [id]/
            └── like/route.ts     # Like / unlike
```

### API Details

---

#### 1. Authentication Module

##### `POST /api/auth/register` — User Registration

| Item | Description |
|------|-------------|
| Auth | None |
| Body | `{ name: string, email: string, password: string }` |
| Validation | Zod: name 1-50 chars, email format, password >= 6 chars |
| Success | `201 { message, user: { id, email, name } }` |
| Failure | `400` validation failed / `409` email exists / `500` server error |

##### `GET|POST /api/auth/[...nextauth]` — NextAuth Authentication

| Item | Description |
|------|-------------|
| Function | Login, logout, OAuth callback, session retrieval |
| Providers | Google OAuth + Credentials (email/password) |
| Session | JWT strategy |
| Custom fields | token carries id, credits, subscriptionTier, creemCustomerId, role |

---

#### 2. Image Generation Module

##### `POST /api/generate` — AI Image Generation

| Item | Description |
|------|-------------|
| Auth | Optional (unauthenticated users can generate, images marked public) |
| Rate limit | 10 req/min (Upstash Redis / memory fallback) |
| Body | `{ prompt, negativePrompt?, model?, aspectRatio?, style?, color?, lighting?, composition?, fastMode? }` |
| Validation | Zod: prompt 1-2000 chars, negativePrompt <= 1000 chars |
| Response | SSE (text/event-stream) streaming |
| Credits | Authenticated users consume 1 credit, `402` if insufficient; auto-refund on failure |
| AI Provider | Selected via `AI_PROVIDER` env: `placeholder` / `stability` / `replicate` / `openai` |
| Storage | Auto-upload to S3/R2 if configured |

**Supported AI Providers:**

| Provider | Env Variable | Description |
|----------|-------------|-------------|
| placeholder | `AI_PROVIDER="placeholder"` | Dev mode, returns picsum placeholder |
| Stability AI | `AI_PROVIDER="stability"` + `STABILITY_API_KEY` | Stable Image API |
| Replicate | `AI_PROVIDER="replicate"` + `REPLICATE_API_TOKEN` | SDXL models, polling |
| OpenAI | `AI_PROVIDER="openai"` + `OPENAI_API_KEY` | DALL-E 3 |

---

#### 3. Image Management Module

##### `GET /api/images` — Get Image List (Cursor Pagination)

| Item | Description |
|------|-------------|
| Auth | Public images: none; User images: required |
| Params | `?public=true&style=anime&limit=20&cursor=last_image_id` |
| Pagination | Cursor-based, default 20/page, max 50 |
| Success | `200 { images: [...], nextCursor: string\|null }` |
| Failure | `401` unauthorized / `500` server error |

##### `PATCH /api/images/:id` — Update Image

| Item | Description |
|------|-------------|
| Auth | Required (own images only) |
| Body | `{ isPublic: boolean }` |
| Success | `200 { success: true, image }` |

##### `DELETE /api/images/:id` — Delete Image

| Item | Description |
|------|-------------|
| Auth | Required (own images only) |
| Storage | Also deletes from S3/R2 if configured |
| Success | `200 { success: true }` |

---

#### 4. Credits Module

##### `GET /api/credits` — Query Credits

| Item | Description |
|------|-------------|
| Auth | Required |
| Success | `200 { credits, subscriptionTier }` |

##### `POST /api/credits` — Top Up Credits (Admin Only)

| Item | Description |
|------|-------------|
| Auth | Required, `role === "admin"` |
| Body | `{ userId: string, amount: number }` |
| Note | Regular user credit additions happen via Creem Webhook automatically |
| Failure | `403` not admin |

---

#### 5. Creem Payment Module

##### `POST /api/creem/checkout` — Create Checkout Session

| Item | Description |
|------|-------------|
| Auth | Required |
| Body | `{ productId, successUrl?, cancelUrl? }` |
| Success | `200 { checkoutUrl, checkoutId }` |
| Note | Frontend redirects to `checkoutUrl` for Creem hosted payment |

##### `GET /api/creem/products` — Get Products/Plans

| Item | Description |
|------|-------------|
| Auth | None |
| Success | `200 { plans: [...] }` |

##### `POST /api/creem/portal` — Create Customer Portal Session

| Item | Description |
|------|-------------|
| Auth | Required (and must have Creem subscription) |
| Success | `200 { portalUrl }` |
| Note | Users can manage subscriptions, cancel, update payment methods |

##### `POST /api/creem/webhook` — Creem Payment Webhook

| Item | Description |
|------|-------------|
| Auth | Creem signature verification (`creem-signature` header, HMAC-SHA256) |
| Security | `timingSafeEqual` prevents timing attacks |
| Dev mode | Skips verification when secret is missing |

**Handled Webhook Events:**

| Event | Processing Logic |
|-------|-----------------|
| `checkout.completed` | Create order, add credits for one-time purchase, link Creem customer ID |
| `subscription.active` | Activate subscription, update tier and credits |
| `subscription.paid` | Renewal success, refresh credits, create payment order |
| `subscription.canceled` | Downgrade to free, reset credits |
| `subscription.scheduled_cancel` | Log, maintain current benefits until period end |
| `subscription.past_due` | Log warning, can notify user |
| `subscription.expired` | Downgrade to free |
| `refund.created` | Log, can deduct credits |

---

#### 6. V1 API (New Features)

##### `PATCH /api/v1/user/profile` — Update Profile

| Item | Description |
|------|-------------|
| Auth | Required |
| Body | `{ name?: string }` |
| Success | `200 { user: { id, name, email } }` |

##### `PATCH /api/v1/user/password` — Change Password

| Item | Description |
|------|-------------|
| Auth | Required (Credentials users only) |
| Body | `{ currentPassword, newPassword }` |
| Validation | Verify current password, new password >= 6 chars |
| Failure | `400` wrong current password / OAuth accounts not supported |

##### `GET /api/v1/user/has-password` — Check if User Has Password

| Item | Description |
|------|-------------|
| Auth | Required |
| Success | `200 { hasPassword: boolean }` |
| Note | OAuth users (Google login) have no password |

##### `GET /api/v1/bookmarks` — Get Bookmark List

| Item | Description |
|------|-------------|
| Auth | Required |
| Success | `200 { images: [...] }` |

##### `POST /api/v1/bookmarks` — Add Bookmark

| Item | Description |
|------|-------------|
| Auth | Required |
| Body | `{ imageId: string }` |
| Note | Idempotent (upsert), duplicate bookmarks don't error |

##### `DELETE /api/v1/bookmarks/:id` — Remove Bookmark

| Item | Description |
|------|-------------|
| Auth | Required |
| Param | `:id` is the image ID |

##### `POST /api/v1/images/:id/like` — Like

| Item | Description |
|------|-------------|
| Auth | Required |
| Success | `200 { likes: number }` |

##### `DELETE /api/v1/images/:id/like` — Unlike

| Item | Description |
|------|-------------|
| Auth | Required |
| Success | `200 { likes: number }` |

---

## 4. Utility Modules (src/lib/)

| Module | File | Description |
|--------|------|-------------|
| Auth | `auth.ts` | NextAuth v5 config, JWT callbacks, Session type extensions (incl. role, creemCustomerId) |
| Database | `db.ts` | Prisma Client singleton |
| Credits | `credits.ts` | Credit check/consume/refill/daily reset logic |
| Rate Limiting | `rate-limit.ts` | Upstash Redis rate limiting (prod) + memory fallback (dev), 10 req/min |
| Storage | `storage.ts` | S3/R2 compatible storage client, upload/delete/key generation |
| Logging | `logger.ts` | Structured logging, API request tracing (method, path, status, duration) |
| Styles | `styles.ts` | 5 image style configs (system prompts, models, use cases, tips) |
| AI Service | `ai-service.ts` | AI provider abstraction layer |

---

## 5. Middleware (src/middleware.ts)

| Function | Description |
|----------|-------------|
| Route guard | `/dashboard` and `/settings` redirect unauthenticated to `/signin?callbackUrl=...` |
| Logged-in redirect | `/signin` and `/signup` redirect authenticated users to `/dashboard` |
| Skip rules | API routes, static files, NextAuth internal routes bypass middleware |
| Session detection | Compatible with multiple NextAuth v5 cookie names |

---

## 6. Data Models (Prisma Schema)

```
User ──< Account        (NextAuth OAuth accounts)
User ──< Session        (NextAuth sessions)
User ──< Image          (Generated images)
User ──< Order          (Payment orders)
User ──< Bookmark       (Image bookmarks)

Image ──< Bookmark      (Bookmarked by users)
Image ──< Like          (Liked by users)

Plan                    (Pricing plans, seed data, incl. creemProductId)
```

**User Key Fields:**
- `role`: User role ("user" | "admin")
- `credits` + `creditsResetAt`: Credits and daily reset
- `subscriptionTier`: Subscription tier (free/premium/ultimate)
- `creemCustomerId` + `creemSubscriptionId`: Creem payment association

**Image Key Fields:**
- `likes`: Like count (default 0)
- `bookmarks`: Bookmark relationships

**Order Key Fields:**
- `creemOrderId` + `creemTransactionId`: Creem order association

**Plan Key Fields:**
- `creemProductId`: Creem product ID for checkout session creation

**Bookmark Model:**
- `userId` + `imageId`: Composite unique constraint, prevents duplicate bookmarks

**Like Model:**
- `userId` + `imageId`: Composite unique constraint, prevents duplicate likes

---

## 7. Environment Variables

```bash
# Database
DATABASE_URL="postgresql://..."

# NextAuth v5
AUTH_SECRET="..."

# Google OAuth
GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."

# Creem Payment
CREEM_API_KEY="..."
CREEM_WEBHOOK_SECRET="..."

# AI Provider: "placeholder" | "stability" | "replicate" | "openai"
AI_PROVIDER="placeholder"
STABILITY_API_KEY=""
OPENAI_API_KEY=""
REPLICATE_API_TOKEN=""

# Upstash Redis (optional, production rate limiting)
UPSTASH_REDIS_REST_URL=""
UPSTASH_REDIS_REST_TOKEN=""

# S3/R2 Storage (optional, image persistence)
S3_ENDPOINT=""
S3_ACCESS_KEY_ID=""
S3_SECRET_ACCESS_KEY=""
S3_BUCKET_NAME="genesisai-images"
S3_REGION="auto"
S3_PUBLIC_URL=""
```

---

## 8. Design Principles

### 1. API Design Principles

**RESTful Style + Pragmatism**

- Resource-based routes: `/api/images`, `/api/credits`, `/api/creem/products`
- HTTP methods for verbs: `GET` query, `POST` create/action, `PATCH` partial update, `DELETE` delete
- Non-CRUD operations use noun+verb: `/api/generate` (generation isn't simple CRUD), `/api/creem/webhook` (third-party callback)
- New features use versioned paths: `/api/v1/user/profile`, `/api/v1/bookmarks`

**Unified Response Format:**

```typescript
// Success
{ data: T } or { success: true, ... }

// Failure
{ error: string }           // 4xx/5xx
{ error: string, details }  // 400 with Zod error details
```

**HTTP Status Code Convention:**

| Code | Meaning | Use Case |
|------|---------|----------|
| 200 | Success | GET/PATCH/DELETE success |
| 201 | Created | Registration success |
| 400 | Bad Request | Zod validation failed |
| 401 | Unauthorized | Missing authentication |
| 402 | Payment Required | Insufficient credits |
| 403 | Forbidden | Non-admin operation / accessing others' resources |
| 404 | Not Found | Resource ID doesn't exist |
| 409 | Conflict | Email already registered |
| 429 | Too Many Requests | Rate limited |
| 500 | Server Error | Uncaught exception |

### 2. Authentication & Authorization Design

- **JWT strategy** over database sessions: reduces DB queries, suitable for stateless API
- **Custom JWT fields**: credits, subscriptionTier, creemCustomerId, role stored in token
- **Middleware server-side guards**: prevents client-side flash of unauthorized content
- **Admin role**: `role` field distinguishes regular users from admins; sensitive operations like credit top-up are admin-only

### 3. Security Design

- **Zod validation**: All API entry points validate request body
- **CSRF protection**: NextAuth handles automatically
- **Webhook signature verification**: Creem callback uses `creem-signature` header + HMAC-SHA256 + timingSafeEqual
- **Production rate limiting**: Upstash Redis + memory fallback
- **Authorization isolation**: Image operations verify `userId` consistency; credit top-up is admin-only

### 4. SSE Streaming Design

Image generation uses SSE because:
- Generation takes time (3-30s), requires real-time progress feedback
- Frontend can show progress bar
- Avoids request timeout
- Auto-refund credits on generation failure

### 5. Cursor Pagination Design

Image lists use cursor-based pagination instead of offset-based:
- Stable performance: `WHERE id < cursor` is much faster than `OFFSET N` with large datasets
- Data consistency: New/deleted data doesn't cause duplicates or gaps
- Response includes `nextCursor`, frontend loads next page accordingly

### 6. Multi AI Provider Design

Switch via `AI_PROVIDER` env variable, unified return format `{ success, imageUrl?, imageBuffer?, error? }`:
- Dev environment uses `placeholder` for zero-cost testing
- Production selects Stability AI / Replicate / OpenAI as needed
- When `imageBuffer` is returned, auto-upload to S3/R2 storage

### 7. Creem Payment Integration Design

Creem as Merchant of Record (tax withholding), integration flow:
1. Frontend calls `POST /api/creem/checkout` to get checkout URL
2. Redirects to Creem hosted payment page
3. After payment, Creem sends Webhook to `POST /api/creem/webhook`
4. Webhook processes subscription activation / credit top-up / order recording
5. Users can manage subscriptions via `POST /api/creem/portal`

---

## 9. Future Improvements

1. **Image editing/variation API** — Currently only generation, no edit/variation for existing images
2. **Email verification** — No email verification after registration, should add emailVerified flow
3. **OAuth account linking** — Merge Google login and email/password login accounts
4. **Image moderation** — Community public images lack content moderation
5. **WebSocket real-time notifications** — Real-time push for credit changes, subscription status updates
6. **Batch operations** — Batch delete images, batch download
7. **Sentry error monitoring** — Connect logger.error to Sentry reporting
8. **API rate quotas** — Different rate limiting strategies per subscription tier
