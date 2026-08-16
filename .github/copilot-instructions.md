# GitHub Copilot Instructions — SmartRent Pro

## Project Overview
SmartRent Pro is a property management application for Indian landlords to track buildings, units, tenants, leases, rent payments, and maintenance expenses. It is a Vanilla JS SPA built with Vite, backed by Supabase (PostgreSQL + Auth), and packaged as an Android app via Capacitor.

---

## Tech Stack
| Layer | Technology |
|---|---|
| Frontend | Vanilla JS (ES Modules), Vite 5 |
| Styling | Tailwind CSS (utility-first, no component library) |
| Data Grid | Grid.js (`gridjs` + `gridjs/dist/theme/mermaid.css`) |
| Backend | Supabase (PostgreSQL + Row Level Security + Auth) |
| Mobile | Capacitor 8 (Android) |
| Hosting | Vercel (SPA fallback via `vercel.json`) |

---

## Architecture Patterns

### DB Adapter (`src/db/database.js`)
- All DB access goes through `getDB()` which returns a `dbWrapper`.
- The wrapper auto-converts **camelCase (JS) ↔ snake_case (DB)** on every read/write.
- Never bypass the adapter; do not call `supabase.from()` directly in components.
- Available methods: `getAll(table)`, `get(table, id)`, `add(table, data)`, `put(table, data)`, `delete(table, id)`.

### Component Pattern
- Each view is a **class** in `src/components/` with a `constructor(container)` that calls `this.render()`.
- Components manage their own DOM inside the passed `container` element.
- Do not use frameworks (React, Vue, etc.). Keep components as plain JS classes.
- Use `innerHTML` for initial render, then attach event listeners with `querySelector`.

### View Routing
- The router is in `src/main.js` — a simple `switch` on a `view` string.
- To add a new view: add a case in `handleViewChange()`, add a nav button in `Navbar.js`, and create a new component class.

---

## Coding Conventions

### Naming
- **JS variables/properties**: camelCase (`buildingId`, `rentAmount`, `paymentPeriod`)
- **DB columns**: snake_case (`building_id`, `rent_amount`, `payment_period`)
- **CSS classes**: Tailwind utilities only; avoid writing custom CSS unless in `src/styles/`

### Currency & Locale
- Always display amounts with the Rupee symbol: `₹`
- Format numbers with `toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })`
- Financial year runs **April–March** (FY 2025 = Apr 2025 – Mar 2026)

### Dates
- Store dates as ISO strings (`YYYY-MM-DD`) in the DB
- `payment_period` column stores first day of the month (`YYYY-MM-01`)
- Display using `toLocaleString('en-IN', { dateStyle: 'medium' })`

### Form Drafts
- Payment form drafts: localStorage key `smartRent_paymentDraft`
- Maintenance form drafts: localStorage key `smartRent_maintenanceDraft`
- Do not save file inputs (e.g., receipt) in localStorage — skip those keys

### Error Handling
- Throw errors from the DB adapter up to the component
- Show errors via `alert()` for user-facing failures (simple app, no toast library)
- Log unexpected errors with `console.error()`

---

## Database Tables (snake_case in DB, camelCase in JS)

| Table | Key Fields |
|---|---|
| `buildings` | `id`, `name`, `address`, `show_when_dashboard_is_loaded` |
| `units` | `id`, `building_id`, `unit_number`, `status` (Vacant/Occupied/Maintenance) |
| `tenants` | `id`, `name`, `contact`, `email` |
| `leases` | `id`, `unit_id`, `tenant_id`, `rent_amount`, `start_date`, `end_date` |
| `payments` | `id`, `lease_id`, `amount`, `type`, `payment_period`, `date`, `notes` |
| `expenses` | `id`, `link_type` (unit/building), `link_target`, `category`, `amount`, `vendor`, `status`, `receipt_image`, `notes`, `date` |

---

## Environment Variables
- `VITE_SUPABASE_URL` — Supabase project URL
- `VITE_SUPABASE_ANON_KEY` — Supabase anon/public key
- Never hardcode these values; always use `import.meta.env.VITE_*`

---

## Security Rules
- Supabase Row Level Security (RLS) must be enabled on all tables
- Auth is email/password via `supabase.auth.signInWithPassword()`
- Never expose the Supabase service role key in client-side code
- Sanitize any user-generated content rendered via `innerHTML`

---

## Migration Workflow
- New DB schema changes go in `migrations/` as `.sql` files
- Name format: `add_<feature>.sql` or `alter_<table>_<change>.sql`
- Run migrations manually in the Supabase SQL editor

---

## Do Not
- Do not use `any` type annotations or TypeScript in `.js` files (TypeScript files like `.tsx` are kept separate for future migration)
- Do not add third-party UI libraries (Bootstrap, MUI, etc.)
- Do not call Supabase directly in components — always use `getDB()`
- Do not store sensitive data in localStorage
