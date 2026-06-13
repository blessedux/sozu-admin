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

## Settlements (SozuPay on/off-ramp)

Both apps share the same Supabase project. SozuPay merchants submit requests from `/dashboard/cashout`; ops manage them here.

### One-time setup

Run this migration in the Supabase SQL editor (table is not created yet in your project):

```
supabase/migrations/20250613000000_withdrawal_requests_ramp.sql
```

### Ops surfaces

| Route | Purpose |
|-------|---------|
| `/dashboard/settlements` | Queue counts (on-ramp + off-ramp) |
| `/dashboard/settlements/off-ramp` | SozuPay cashout inbox — fulfill or reject |
| `/dashboard/settlements/on-ramp` | Merchant checkout sessions + consumer deposit intents |

### APIs (admin session required)

| Method | Endpoint | Action |
|--------|----------|--------|
| GET | `/api/network/settlements/off-ramp` | List pending merchant withdrawals |
| POST | `/api/network/settlements/off-ramp/fulfill` | Mark CLP sent / complete |
| POST | `/api/network/settlements/off-ramp/reject` | Reject request |
| GET | `/api/network/settlements/on-ramp` | List open on-ramp requests |

**Off-ramp flow:** Merchant POST `/api/cashout` on SozuPay → row in `withdrawal_requests` → ops sends CLP → **Complete** in admin.

**On-ramp flow:** Merchant checkout → `checkout_sessions` (auto-completes via Ramp webhook) · Consumer wallet → `deposit_intents` (monitor in on-ramp queue).

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
