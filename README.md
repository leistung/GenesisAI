# GenesisAI

> A professional, full-stack AI image generation platform with multi-style artistic creation, community sharing, and subscription-based payment system.

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

## Features

### AI-Powered Generation
- **5 Artistic Styles** — Anime, Portrait Enhancement, Landscape Enhancement, Creative Art, Product Image
- **Hidden System Prompts** — Each style has optimized system prompts for professional results
- **Multiple Models** — Configurable AI models per style (Stability AI / Replicate / OpenAI)
- **Real-time Progress** — SSE streaming for live generation status updates
- **Reference Images** — Upload reference images to guide AI generation

### User System
- **Email & Google OAuth Login** — Secure sign in with email/password or Google accounts
- **Credit System** — Free daily credits + premium subscription credits
- **User Dashboard** — View, download, delete generated images
- **Image History** — Full generation history with prompts and timestamps

### Community
- **Public Gallery** — Share your generations with the community
- **Style Filtering** — Browse community works by artistic style
- **Likes & Bookmarks** — Like and bookmark community images
- **One-Click Publish** — Toggle images between private and public

### Monetization
- **Subscription Plans** — Free, Premium, and Ultimate tiers
- **Creem Payments** — MoR (Merchant of Record) with webhook verification
- **Monthly/Yearly Billing** — Flexible billing cycles with annual discount

### Security
- **Server-side API Keys** — AI keys never exposed to client
- **NextAuth Sessions** — Encrypted JWT-based authentication
- **Creem Signature Verification** — HMAC-SHA256 webhook validation with timing-safe comparison
- **Rate Limiting** — API protection against abuse (Upstash Redis / memory fallback)
- **Zod Validation** — Schema-based input validation
- **User Authorization** — Users can only access their own data

---

## Quick Start

### Prerequisites

- **Node.js** 18+
- **npm** 9+
- **Docker** (for PostgreSQL)

### 1. Clone & Install

```bash
git clone <your-repo-url>
cd GenesisAI
npm install
```

### 2. Environment Setup

```bash
cp .env.example .env.local
```

Edit `.env.local` with your credentials:

```env
# Database (PostgreSQL via Docker)
DATABASE_URL="postgresql://genesis_user:genesis_password@localhost:5433/genesisai"

# NextAuth v5
AUTH_SECRET="your-secret-here"

# Google OAuth
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# Creem Payments
CREEM_API_KEY="your-creem-api-key"
CREEM_WEBHOOK_SECRET="your-creem-webhook-secret"

# AI Provider: "placeholder" | "stability" | "replicate" | "openai"
AI_PROVIDER="placeholder"
STABILITY_API_KEY=""
OPENAI_API_KEY=""
REPLICATE_API_TOKEN=""

# Upstash Redis (optional, for production rate limiting)
UPSTASH_REDIS_REST_URL=""
UPSTASH_REDIS_REST_TOKEN=""

# S3/R2 Storage (optional, for image persistence)
S3_ENDPOINT=""
S3_ACCESS_KEY_ID=""
S3_SECRET_ACCESS_KEY=""
S3_BUCKET_NAME="genesisai-images"
S3_REGION="auto"
S3_PUBLIC_URL=""
```

### 3. Database Setup

```bash
# Start PostgreSQL via Docker
docker compose up -d

# Push schema to database
npm run db:push

# Seed with default plans
npm run db:seed
```

### 4. Start Dev Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Project Structure

```
GenesisAI/
├── assets/                        # Screenshots and static assets
├── prisma/
│   ├── schema.prisma              # Database schema (User, Image, Order, Plan, Like, Bookmark)
│   ├── seed.ts                    # Database seeder
│   └── seed-ai-models.ts          # AI model seeder
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── auth/
│   │   │   │   ├── [...nextauth]/ # NextAuth v5 handler
│   │   │   │   └── register/      # User registration API
│   │   │   ├── credits/           # Credits management API
│   │   │   ├── creem/
│   │   │   │   ├── checkout/      # Creem checkout session
│   │   │   │   ├── portal/        # Creem customer portal
│   │   │   │   ├── products/      # Creem product listings
│   │   │   │   └── webhook/       # Creem webhook handler
│   │   │   ├── generate/          # SSE image generation API
│   │   │   ├── images/
│   │   │   │   ├── route.ts       # Image CRUD + community query
│   │   │   │   └── [id]/route.ts  # Image publish/delete
│   │   │   ├── models/            # AI models API
│   │   │   └── v1/
│   │   │       ├── bookmarks/     # Bookmark list / add / remove
│   │   │       ├── images/[id]/like/  # Like / unlike
│   │   │       └── user/          # Profile & password update
│   │   ├── auth/error/            # Auth error page
│   │   ├── community/             # Community gallery page
│   │   ├── dashboard/             # User dashboard page
│   │   ├── generate/
│   │   │   ├── anime/             # Anime style generation
│   │   │   ├── portrait/          # Portrait enhancement
│   │   │   ├── landscape/         # Landscape enhancement
│   │   │   ├── creative/          # Creative art generation
│   │   │   └── product/           # Product photography
│   │   ├── pricing/               # Subscription pricing page
│   │   ├── settings/              # User settings page
│   │   ├── signin/                # Sign in page
│   │   ├── signup/                # Sign up page
│   │   ├── layout.tsx             # Root layout
│   │   └── page.tsx               # Home page
│   ├── components/
│   │   ├── providers/             # SessionProvider
│   │   ├── Header.tsx             # Global navigation bar
│   │   ├── Footer.tsx             # Global footer
│   │   ├── StyleGeneratorPage.tsx # Shared generation page component
│   │   └── ...                    # Other UI components
│   ├── lib/
│   │   ├── ai-service.ts          # AI provider abstraction
│   │   ├── auth.ts                # NextAuth v5 configuration
│   │   ├── credits.ts             # Credit check/consume/refill logic
│   │   ├── db.ts                  # Prisma client singleton
│   │   ├── logger.ts              # Structured logger
│   │   ├── rate-limit.ts          # Rate limiting utility
│   │   ├── storage.ts             # S3/R2 storage client
│   │   └── styles.ts              # Style configurations & system prompts
│   └── middleware.ts              # Auth route guards
├── .env.example                   # Environment template
├── docker-compose.yml             # PostgreSQL Docker config
├── next.config.ts                 # Next.js configuration
├── package.json
└── tsconfig.json
```

---

## Style Configurations

Each AI generation style has its own optimized configuration defined in [src/lib/styles.ts](./src/lib/styles.ts):

| Style | Route | System Prompt Theme | Color |
|-------|-------|-------------------|-------|
| Anime | `/generate/anime` | High-quality anime illustration | Pink → Purple |
| Portrait | `/generate/portrait` | Professional portrait enhancement | Rose → Pink |
| Landscape | `/generate/landscape` | Natural landscape enhancement | Emerald → Teal |
| Creative | `/generate/creative` | Artistic creative expression | Purple → Indigo |
| Product | `/generate/product` | E-commerce product photography | Blue → Cyan |

---

## Database Models

| Model | Description |
|-------|-------------|
| **User** | User accounts with credits, subscription tier, and OAuth info |
| **Image** | Generated images with prompt, style, URL, and publish status |
| **Order** | Payment transaction records from Creem |
| **Plan** | Subscription plan definitions (Free / Premium / Ultimate) |
| **Like** | Like relationships (prevents duplicate likes) |
| **Bookmark** | Bookmark relationships (user ↔ image) |
| **Account** | NextAuth OAuth provider accounts |
| **Session** | NextAuth user sessions |
| **VerificationToken** | NextAuth verification tokens |

---

## Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server on 0.0.0.0:3000 with Turbopack |
| `npm run build` | Generate Prisma client + build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run db:push` | Push schema to database |
| `npm run db:studio` | Open Prisma Studio GUI |
| `npm run db:migrate` | Create and apply migrations |
| `npm run db:seed` | Seed database with default plans |

---

## External Services Setup

### Google OAuth
1. Visit [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Create OAuth 2.0 credentials
3. Add redirect URI: `http://localhost:3000/api/auth/callback/google`
4. Copy Client ID and Secret to `.env.local`

### Creem Payments
1. Sign up at [Creem](https://creem.io)
2. Get API Key from dashboard settings
3. Create products with monthly/yearly pricing
4. Configure webhook: `https://your-domain.com/api/creem/webhook`
5. Set webhook secret for HMAC-SHA256 signature verification

### AI APIs
- **[Stability AI](https://platform.stability.ai)** — Recommended for general image generation
- **[Replicate](https://replicate.com)** — Alternative with diverse model options
- **[OpenAI DALL·E](https://platform.openai.com)** — DALL·E image generation

---

## Deployment

### Vercel (Recommended)
```bash
vercel deploy
```
Set all environment variables in Vercel dashboard. Change `DATABASE_URL` to a production PostgreSQL connection.

### Self-Hosted
```bash
npm run build
npm run start
```
Requires PostgreSQL for production database.

---

## License

MIT © GenesisAI
