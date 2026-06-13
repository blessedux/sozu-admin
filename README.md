# Sozu Network Intelligence

**admin.sozu.capital** — Internal operational dashboard for the Sozu payment network.

This is the Network Intelligence Layer: a real-time view of every wallet, merchant, orb, transaction, referral, settlement, and credit event across the Sozu network. Built for SozuCapital team and investor demos (invest.sozu.capital).

## Surfaces

| Surface | URL | User |
|---------|-----|------|
| Wallet | app.sozu.capital | Consumers |
| Commerce Layer | pay.sozu.capital | Merchants, NGOs, Orbs |
| Credit Layer | credit.sozu.capital | Borrowers, Liquidity Providers |
| **Network Intelligence** | **admin.sozu.capital** | **Internal Team** |

## Local setup

```bash
cd SozuAdmin_dashboard
cp .env.example .env.local
# Set SOZU_ADMIN_EMAILS and AUTH_MOCK=true for local dev
npm install
npm run dev
```

Open [http://localhost:3001](http://localhost:3001).

## Auth

- **Admin access**: email must be in `SOZU_ADMIN_EMAILS` (comma-separated). Session cookie `sozu_admin_session`.
- **Dev shortcut**: `AUTH_MOCK=true` skips login.
- **Investor mode**: `/invest` is public read-only — no PII, aggregate metrics only.

## Architecture

```
src/
├── app/
│   ├── dashboard/          # Admin pages (protected)
│   ├── invest/             # Investor mode (public)
│   └── api/
│       ├── auth/           # Login / logout
│       └── network/        # Metrics APIs
├── components/admin/       # Dashboard UI
└── lib/
    ├── auth/               # Session + allowlist
    └── network/            # Types + mock data (→ Supabase/Horizon)
```

Mock data in `src/lib/network/mock-data.ts` is the contract for wiring real aggregations from the shared Supabase project and Stellar Horizon.

## Related repos

| Repo | Role |
|------|------|
| [sozupay_mvp](https://github.com/blessedux/sozupay_mvp) | Commerce layer — pay.sozu.capital |
| [SozuCredit](https://github.com/blessedux/SozuCredit) | Wallet + credit — credit.sozu.capital |
| **sozu-admin** (this) | Network intelligence — admin.sozu.capital |

## Deploy

Target **Vercel** with custom domain `admin.sozu.capital`. Point `invest.sozu.capital` to `/invest` via rewrite or separate deployment.

```bash
# Required production env
SOZU_ADMIN_EMAILS=ops@sozu.capital,founder@sozu.capital
AUTH_SECRET=<random-32+-chars>
NEXT_PUBLIC_SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
```
