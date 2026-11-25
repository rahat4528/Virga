# Virga — Considered Fashion & Living

> **Repository:** **Virga** (`virga-store`)  
> **Brand Identity:** Minimal, editorial e-commerce storefront and studio operations workspace crafted for timeless fashion and refined living.

Virga is a full-stack e-commerce platform built with **Next.js 15 (App Router)**, **React 19**, **TypeScript (Strict)**, **TailwindCSS v4 (OKLCH design tokens)**, **MongoDB / Mongoose**, and **Auth.js v5**.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js `^15.5.4` (App Router) |
| Language | TypeScript `^5` (Strict) |
| UI & Components | React `^19.2.0`, Radix UI, shadcn/ui, `lucide-react`, `recharts`, `sonner` |
| Styling | TailwindCSS `^4.1.9` (`@tailwindcss/postcss`), OKLCH Sand / Ink / Clay / Moss theme (Light & Dark) |
| Typography | `Bricolage Grotesque`, `Manrope`, `JetBrains Mono` |
| Database & Validation | MongoDB + Mongoose `^8.18.2`, Zod `3.25.67` |
| Auth & Security | Auth.js v5 (`next-auth`), `bcryptjs`, Edge/Node split, CSP & HSTS headers, sliding-window rate limiter |
| Testing & CI | Vitest, Playwright, ESLint, Prettier, GitHub Actions |

---

## Quick Start

```bash
cd modo-web
pnpm install
cp .env.example .env.local
pnpm db:seed
pnpm dev
```

- **Customer Storefront:** [http://localhost:3000](http://localhost:3000)
- **Virga Studio (Admin):** [http://localhost:3000/studio](http://localhost:3000/studio)

For detailed package documentation, scripts, and route details, see [`modo-web/README.md`](modo-web/README.md).

---

## Key Capabilities

### Customer Storefront
- **Editorial Home & Page Builder:** Hero banner, collection showcase, and dynamic manual/rule-driven product blocks controlled from Studio.
- **Catalog & Search:** Multi-facet shop filtering (`/shop`), hierarchical collections (`/collections/[slug]`), product detail pages with `Product` JSON-LD, options stock, verified reviews, Q&A, and `/search` (`⌘K` shortcut).
- **Editorial Journal & Interactive Lookbook:** Long-form dispatches (`/journal`, `/journal/[slug]`) and shoppable lookbooks (`/lookbook`) with clickable garment coordinate pins and one-click *"Shop Complete Look"*.
- **Bag, Promos & Checkout:** Real-time synchronized bag (`virga_bag`), MongoDB-validated promo codes, server-computed totals/taxes/shipping, atomic stock decrement, and public order tracking (`/track/[orderNo]`).
- **Client Portal (`/me`):** Order history, address book management, saved wishlist (guest-to-account merge), computed loyalty tiers (`Ember`, `Clay`, `Atelier`), and profile settings.

### Virga Studio (`/studio`)
Protected by role-based access control (`staff`, `manager`, `owner`, `admin`):
- **Overview & Insights:** Live order KPIs, trailing 6-month revenue chart from MongoDB orders, date/status filters, and CSV export.
- **Catalog, Stock & Bulk CSV Import:** Create/edit pieces (`/studio/catalog`, `/studio/quick-add`), inline stock adjustment (`/studio/stock`), and CSV dry-run validation + batch import (`/studio/bulk-import`).
- **Orders & Exchanges:** Persistent fulfillment status transitions, tracking numbers, timeline notes (`/studio/orders/[id]`), and return/exchange workflows (`/studio/exchanges`).
- **Campaigns, Promos, CMS & Settings:** Promotional codes, email dispatches (`/studio/campaigns`), hero/block/journal/asset CMS (`/studio/content`), storefront layout builder (`/studio/page-builder`), and store policies (`/studio/settings`).

---

## Verification Gates

```bash
cd modo-web
pnpm typecheck
pnpm lint
pnpm test
pnpm build
```
