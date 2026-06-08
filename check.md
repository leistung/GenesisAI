# GenesisAI Project Check Report

## Scope

Page-by-page feature review, checking frontend/backend implementation status, noting bugs and optimization suggestions.

---

## 1. Page Feature Check

### 1. Home Page `/` (page.tsx)

| Feature | Frontend | Backend | Status |
|---------|----------|---------|--------|
| Hero section | OK | - | Normal |
| Gallery display | OK | OK GET /api/images?public=true | Normal |
| Style template cards | OK | - | Normal |
| Use cases section | OK | - | Normal |
| Features section | OK | - | Normal |
| Testimonials | OK | - | Normal |
| FAQ | OK | - | Normal |

**Issues:**
- Gallery display may load too many images without pagination — should limit query

---

### 2. Sign In / Sign Up Pages `/signin`, `/signup` (SignInContent.tsx)

| Feature | Frontend | Backend | Status |
|---------|----------|---------|--------|
| Sign in form | OK | OK NextAuth signIn | Normal |
| Sign up form | OK | OK POST /api/auth/register | Normal |
| Mode switch (sign in / sign up) | OK | - | Normal |
| Error toast | OK | - | Normal |
| Success toast | OK | - | Normal |
| URL error param parsing | OK | - | Normal |
| Google OAuth | OK | OK NextAuth Google Provider | Normal |
| Password show/hide | OK | - | Normal |
| Client-side form validation | OK | - | Normal |

**Issues:**
- None currently

---

### 3. Dashboard `/dashboard` (DashboardPage)

| Feature | Frontend | Backend | Status |
|---------|----------|---------|--------|
| Stats cards (images/credits/tier) | OK | OK GET /api/credits, GET /api/images | Normal |
| Image grid display | OK | OK GET /api/images | Normal |
| Cursor pagination load more | OK | OK cursor param | Normal |
| Download image | OK | - | Normal |
| Delete image | OK | OK DELETE /api/images/:id | Normal |
| Manage subscription | OK | OK POST /api/creem/portal | Normal |
| Upgrade plan link | OK | - | Normal |

**Issues:**
- Total Images shows currently loaded count only — shows "20+" when more exist
- manageSubscription shows toast error when Creem Portal call fails

---

### 4. Community Gallery `/community` (CommunityPage)

| Feature | Frontend | Backend | Status |
|---------|----------|---------|--------|
| Style filtering | OK | OK style param | Normal |
| Image grid display | OK | OK GET /api/images?public=true | Normal |
| Download image | OK | - | Normal |
| Like | OK | OK POST /api/v1/images/:id/like | Normal |
| Bookmark | OK | OK POST /api/v1/bookmarks | Normal |
| Paginated load more | OK | OK cursor param | Normal |

**Issues:**
- Some images have `style: null`, filtered out by style filter — fixed with OR query including null

---

### 5. Pricing Page `/pricing` (PricingPage)

| Feature | Frontend | Backend | Status |
|---------|----------|---------|--------|
| Plan display | OK | OK GET /api/creem/products | Normal |
| Monthly/yearly toggle | OK | - | Normal |
| Current plan indicator | OK | OK session.subscriptionTier | Normal |
| Creem checkout redirect | OK | OK POST /api/creem/checkout | Normal |
| Unauthenticated redirect to sign in | OK | - | Normal |

**Issues:**
- Yearly plans may not have Creem Product IDs — needs Creem dashboard configuration
- Free tier "Get Started Free" button redirects to `/signin`, no effect for logged-in users

---

### 6. Settings Page `/settings` (SettingsPage)

| Feature | Frontend | Backend | Status |
|---------|----------|---------|--------|
| Change name | OK | OK PATCH /api/v1/user/profile | Normal |
| Display email (read-only) | OK | - | Normal |
| Change password | OK | OK PATCH /api/v1/user/password | Normal |
| Toast notifications | OK | - | Normal (auto-dismiss in 5s) |
| Password show/hide | OK | - | Normal |
| Hide password for OAuth users | OK | OK GET /api/v1/user/has-password | Normal |

**Issues:**
- None currently

---

### 7. Auth Error Page `/auth/error` (AuthError)

| Feature | Frontend | Backend | Status |
|---------|----------|---------|--------|
| Error message display | OK | - | Normal |
| Retry button | OK | - | Normal |
| Back to home | OK | - | Normal |

**No Issues**

---

### 8. Image Generation Pages `/generate/*` (StyleGeneratorPage)

| Feature | Frontend | Backend | Status |
|---------|----------|---------|--------|
| Prompt input | OK | OK POST /api/generate | Normal |
| Negative prompt | OK | OK negativePrompt | Normal |
| Model selection | OK | OK model param | Normal |
| Aspect ratio selection | OK | OK aspectRatio | Normal |
| Reference image upload | OK | OK Stability AI supports | Normal |
| SSE progress display | OK | OK text/event-stream | Normal |
| Credits display | OK | OK GET /api/credits | Normal |
| Publish to community | OK | OK PATCH /api/images/:id | Normal |
| Community works display | OK | OK GET /api/images?public=true | Normal |
| Random prompt | OK | - | Normal |
| Download generated image | OK | - | Normal |
| Like community works | OK | OK POST /api/v1/images/:id/like | Normal |

**Issues:**
- Community works section has no pagination — only loads limit=12

---

## 2. Backend API Bug Check

### 1. `/api/generate` — Image Generation

| Issue | Severity | Description |
|-------|----------|-------------|
| Premium user credits returns Infinity | Medium | `checkAndConsumeCredits` returns `remainingCredits: Infinity` for premium users, `JSON.stringify(Infinity)` becomes `null` — fixed: returns 999999 |
| Credit refund not transactional | Medium | Credit deduction and refund are not atomic; if refund fails, user loses credits |
| Replicate polling may block SSE | Low | Replicate polling up to 120s, SSE connection may timeout |

### 2. `/api/images` — Image List

| Issue | Severity | Description |
|-------|----------|-------------|
| Public image style filter misses null | Medium | Many images have `style: null`, `where: { style: "anime" }` misses them — fixed with OR query |
| User images no style filter | Low | User mode doesn't support style filtering |

### 3. `/api/credits` — Credits

| Issue | Severity | Description |
|-------|----------|-------------|
| addCreditsToUser no upper bound check | Low | Admin can add unlimited credits |

### 4. `/api/creem/webhook` — Payment Webhook

| Issue | Severity | Description |
|-------|----------|-------------|
| Creem amount unit uncertain | Medium | Code assumes Creem amounts are in cents (divides by 100), but Creem docs may use different units |
| checkout.completed and subscription.active may double-process | Medium | If checkout is subscription type, both events fire — fixed with subscriptionId dedup check |
| subscription.paid creemOrderId format is synthetic | Low | `sub_${data.id}_paid_${Date.now()}` is not a real Creem order ID, may conflict with `@unique` constraint |

### 5. `/api/creem/checkout` — Checkout

| Issue | Severity | Description |
|-------|----------|-------------|
| Creem API URL may be incorrect | Medium | `https://api.creem.io/v1/checkouts` needs confirmation |

### 6. `/api/v1/bookmarks` — Bookmarks

| Issue | Severity | Description |
|-------|----------|-------------|
| No pagination | Low | Bookmark list has no pagination, performance issue with large datasets |

### 7. `/api/v1/images/:id/like` — Likes

| Issue | Severity | Description |
|-------|----------|-------------|
| Duplicate like prevention | Fixed | Added Like model with composite unique constraint + transactional toggle logic |

---

## 3. Cross-Page / Global Issues

### 1. Middleware

| Issue | Severity | Description |
|-------|----------|-------------|
| Session Token Cookie name mismatch risk | Medium | NextAuth v5 default cookie is `authjs.session-token`, but may vary by version |

### 2. Authentication (auth.ts)

| Issue | Severity | Description |
|-------|----------|-------------|
| JWT token credits may be stale | Medium | Token credits are snapshot from login; after image generation, credits change but token doesn't update — frontend calls /api/credits for fresh data |

### 3. Database Schema

| Issue | Severity | Description |
|-------|----------|-------------|
| Image.style may be null | Low | Many images have null style, filtered out in community filter — fixed with OR query |

### 4. Frontend General

| Issue | Severity | Description |
|-------|----------|-------------|
| Home page Gallery no pagination | Low | May load too many images |

---

## 4. Bug Fix Priority

### P0 — Must Fix Immediately

1. ~~**Prompt double concatenation**~~ — Fixed: frontend no longer concatenates systemPrompt, backend handles it
2. ~~**Download button no function**~~ — Fixed: added handleDownload function and onClick
3. ~~**Like/bookmark frontend not connected**~~ — Fixed: community page and generation page both connected

### P1 — Should Fix Soon

4. ~~**Community page no pagination**~~ — Fixed: added cursor pagination and "Load More" button
5. ~~**Premium user credits returns Infinity**~~ — Fixed: returns 999999
6. ~~**Duplicate likes no limit**~~ — Fixed: added Like model + transactional toggle logic
7. ~~**OAuth user change password**~~ — Fixed: added has-password API, OAuth users hide password form
8. ~~**Dashboard Total Images inaccurate**~~ — Fixed: shows "Images" + "+" suffix indicating more exist

### P2 — Suggested Fixes

9. ~~**Reference image upload not sent to backend**~~ — Fixed: frontend sends referenceImage, backend Stability AI supports it
10. **Yearly plans no Product ID** — Yearly checkout unavailable (needs Creem dashboard configuration)
11. ~~**Plan data hardcoded**~~ — Fixed: fetches from /api/creem/products first, falls back to hardcoded
12. ~~**checkout.completed and subscription.active double processing**~~ — Fixed: added subscriptionId dedup check
13. ~~**Settings Toast no auto-dismiss**~~ — Fixed: added 5s auto-dismiss
14. ~~**Login success loading not reset**~~ — Fixed: setLoading(false) called after successful login

### Other Fixed

15. ~~**Dashboard manageSubscription no error feedback**~~ — Fixed: added Toast error feedback
16. ~~**Public image style filter misses null**~~ — Fixed: OR query includes style=null images
17. ~~**Unauthenticated user Sign In only supports Google**~~ — Fixed: changed to Link redirect to /signin
18. ~~**Login mode password minLength=6 restriction**~~ — Fixed: only register mode restricts minLength

---

## 5. Feature Completeness Matrix

| Feature | Frontend | Backend | Database | Status |
|---------|----------|---------|----------|--------|
| Email/password sign in | OK | OK | OK | Complete |
| Google sign in | OK | OK | OK | Complete |
| User registration | OK | OK | OK | Complete |
| Image generation | OK | OK | OK | Complete |
| Image download | OK | - | - | Complete |
| Image delete | OK | OK | OK | Complete |
| Image publish/unpublish | OK | OK | OK | Complete |
| Community browsing | OK | OK | OK | Complete |
| Community pagination | OK | OK | - | Complete |
| Style filtering | OK | OK | - | Complete |
| Like | OK | OK | OK | Complete (Like model prevents duplicates) |
| Bookmark | OK | OK | OK | Complete |
| Credits system | OK | OK | OK | Complete |
| Credits top-up | OK | OK | OK | Complete (admin only) |
| Creem checkout | OK | OK | - | Complete |
| Creem Webhook | - | OK | OK | Complete |
| Manage subscription | OK | OK | OK | Complete |
| Update profile | OK | OK | OK | Complete |
| Change password | OK | OK | OK | Complete (hidden for OAuth users) |
| Reference image upload | OK | OK | - | Complete (Stability AI supports) |
| S3/R2 storage | - | OK | - | Complete |
| Rate limiting | - | OK | - | Complete |
| Logging | - | OK | - | Complete |
| Middleware guard | OK | OK | - | Complete |
