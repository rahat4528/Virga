# Virga — Considered Fashion & Living (`virga-store`)

A full-stack editorial e-commerce platform and Studio workspace built with **Next.js 15**, **React 19**, **TypeScript**, **MongoDB**, and **TailwindCSS v4**.

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript 5 (Strict) |
| UI | React 19 + Radix UI + shadcn/ui + Recharts |
| Styling | TailwindCSS v4 (OKLCH Light/Dark tokens) |
| Database | MongoDB + Mongoose `^8.18.2` |
| Auth | Auth.js v5 (Credentials + Edge/Node RBAC split) |
| Validation | Zod `3.25.67` |
| Fonts | Bricolage Grotesque + Manrope + JetBrains Mono |

## Getting Started

### 1. Clone and install

```bash
git clone https://github.com/rahat4528/Virga.git
cd Virga/modo-web
pnpm install
```

### 2. Set up environment variables

Copy `.env.example` to `.env.local` and configure your credentials:

```bash
cp .env.example .env.local
```

See `.env.example` for all supported variables (`VIRGA_DATABASE_URL`, `AUTH_SECRET`, `NEXT_PUBLIC_SITE_URL`, plus optional Stripe, Cloudinary, Resend, Upstash Redis, Sentry, and LLM keys).

### 3. Seed database

```bash
pnpm db:seed
```

Seeded demo credentials (default password `Password123!`):
- Owner: `owner@virga.store`
- Staff: `staff@virga.store`
- Client: `sophia@example.com`

### 4. Run the development server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) for the storefront or [http://localhost:3000/studio](http://localhost:3000/studio) for Virga Studio.

## Scripts

| Script | Description |
|---|---|
| `pnpm dev` | Start development server |
| `pnpm build` | Build production bundle |
| `pnpm start` | Start production server |
| `pnpm lint` | Run ESLint check |
| `pnpm typecheck` | Run TypeScript type checking (`tsc --noEmit`) |
| `pnpm db:seed` | Populate database with realistic Virga demo data |
| `pnpm test` | Run Vitest unit & security test suite |
| `pnpm test:e2e` | Run Playwright end-to-end tests |

## Project Architecture

```text
modo-web/
├── app/                      # Next.js App Router pages & REST API
│   ├── api/                  # /api/catalog, /api/collections, /api/orders, /api/reviews, /api/promos, /api/me/*, /api/studio/*
│   ├── studio/               # Virga Studio admin workspace (catalog, orders, clients, stock, exchanges, campaigns, content, insights, settings, page-builder, bulk-import)
│   ├── me/                   # Client portal (/me, /me/orders, /me/addresses, /me/wishlist, /me/rewards, /me/settings)
│   ├── shop/                 # Catalog browsing & piece detail (/shop, /shop/[slug])
│   ├── collections/          # Curated collection views (/collections/[slug])
│   ├── bag/ & checkout/      # Shopping bag, multi-step checkout & confirmation
│   ├── journal/ & lookbook/  # Editorial essays & interactive shoppable lookbook
│   └── track/[orderNo]/      # Public order tracking
├── components/               # Storefront & Studio UI components
├── lib/                      # Shared utilities (db.ts, cn.ts, env.ts, api.ts, commerce.ts, bag.ts, auth-guards.ts, rate-limit.ts)
├── models/                   # Mongoose schemas (Item, Collection, Blocks, HomeLayout, JournalEntry, Look, Order, Bag, Wishlist, PromoCode, Campaign, Exchange, Review, Inquiry, Subscriber, StoreSettings, User)
├── types/                    # TypeScript DTOs and Zod validation schemas
├── scripts/                  # Database seeding script (seed.ts)
└── tests/                    # Vitest suites (virga.test.ts, security.test.ts)
```

## License

MIT
