# HRPay — Multi-Tenant HR & Payroll SaaS Platform

A full-stack multi-tenant HR & Payroll SaaS. Companies subscribe (Free/Starter/Pro), admins register and invite staff, and a Super Admin manages all companies from a platform dashboard.

## Architecture

**Monorepo** managed with pnpm workspaces.

| Package | Role |
|---|---|
| `artifacts/hrpay` | React + Vite frontend (port 23888, preview path `/`) |
| `artifacts/api-server` | Express API backend (port 8080, path `/api`) |
| `lib/api-spec` | OpenAPI spec + Orval codegen config |
| `lib/api-client-react` | Generated React Query hooks |
| `lib/api-zod` | Generated Zod validation schemas |
| `lib/db` | Drizzle ORM + PostgreSQL schema |

## Key Commands

```bash
# Regenerate API client hooks + Zod schemas from OpenAPI spec
pnpm --filter @workspace/api-spec run codegen

# Push DB schema changes
pnpm --filter @workspace/db run push

# Typecheck everything
pnpm run typecheck

# Build API server (required before restart)
pnpm --filter @workspace/api-server run build
```

## Production Security (Hardened)

- **Helmet.js** — security headers on all responses (HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, etc.)
- **Rate limiting** — 300 req/15min general; 20 req/15min on auth endpoints (`/api/auth/login`, `/api/auth/change-password`, `/api/companies/register`)
- **CORS** — restricted to `*.replit.dev`, `*.repl.co`, and localhost; credentials enabled
- **Global error handler** — catches all unhandled Express errors, returns `{ error }` JSON without stack traces in production
- **Graceful shutdown** — SIGTERM/SIGINT close HTTP server + DB pool; 10s force-exit fallback
- **Uncaught exception / rejection handlers** — log and exit cleanly
- **DB health check** — `GET /api/healthz` runs `SELECT 1` and returns `db: "ok"` or `db: "error"` with 503

## Multi-Tenancy Data Isolation

Every data endpoint is scoped to the authenticated user's `companyId` from the JWT. No user can read another company's data:
- Employee-keyed tables (employees, departments): filtered by `employees.company_id = user.companyId`
- Employee-linked tables (leave, time, benefits, expenses, onboarding, performance, training): joined to employees and filtered by `employees.company_id`
- Payroll runs, announcements: have `company_id` column in DB, filtered directly
- Auth helpers: `getRequestUser()`, `requireAuth()`, `requireCompanyUser()`, `requireNonEmployee()`, `requireRoles()`

## Settings Persistence

Company settings are stored in `companies.settings` JSONB column. Fields persisted:
- `currency`, `timezone`, `dateFormat`, `payPeriod`
- `email`, `phone`, `address`, `website`, `registrationNumber`, `fiscalYearStart`
- `workingHoursPerDay`, `workingDaysPerWeek`

The frontend `CompanySettingsProvider` (`/src/components/company-settings-context.tsx`) exposes:
- `settings` — live company settings object
- `formatCurrency(amount)` — formats using `Intl.NumberFormat` with company currency
- `formatDate(date)` — respects company dateFormat (MM/DD/YYYY, DD/MM/YYYY, YYYY-MM-DD, DD-MM-YYYY, DD.MM.YYYY)

## Internationalization

Supported currencies: USD, EUR, GBP, CAD, AUD, INR, SGD, AED, JPY, CNY, NGN, ZAR, BRL, MXN, KRW, CHF, SEK, NOK, DKK

Supported timezones: UTC, Americas (LA, NY, Chicago, Toronto, Sao Paulo), Europe (London, Paris, Berlin, Amsterdam), Africa (Lagos, Johannesburg), Middle East (Dubai), Asia (Kolkata, Singapore, Shanghai, Tokyo), Australia (Sydney)

Date formats: MM/DD/YYYY, DD/MM/YYYY, YYYY-MM-DD, DD-MM-YYYY, DD.MM.YYYY

## React Error Boundary

`ErrorBoundary` component (`/src/components/error-boundary.tsx`) wraps:
1. The entire `App` at root level (catches provider errors)
2. Each `ProtectedRoute` page component (shows per-page error with "Try again" button)

## Database Schema (PostgreSQL via Drizzle ORM)

- `companies` — org profile, plan, `settings` JSONB (currency, timezone, dateFormat, `aiInsightsEnabled`, etc.), `feature_permissions` JSONB
- `company_insights` — AI-generated weekly HR insight reports; columns: `id, company_id, week_of, summary, score, insights JSONB, status, generated_at`
- `departments` — org structure, budget, manager; has `company_id`
- `employees` — full profile, compensation, employment status; has `company_id`, `employee_code` (EMP-XXXXXX)
- `payroll_runs` — bi-weekly runs with status lifecycle (draft → completed); has `company_id`
- `pay_stubs` — per-employee stub generated on payroll processing
- `time_entries` — clock in/out with approval workflow; linked to employee (company isolation via join)
- `leave_requests` — PTO/sick/personal with approval; linked to employee
- `leave_balances` — allocated/used/pending per employee/year
- `benefit_plans` — health, dental, vision, life, retirement
- `benefit_enrollments` — employee plan membership
- `onboarding_tasks` — grouped by employee with completion tracking
- `announcements` — company-scoped; has `company_id`
- `expense_claims` — per-employee expense with approval; linked to employee
- `assets` — asset inventory; linked to assigned employee
- `job_postings`, `applications` — recruitment pipeline
- `goals`, `performance_reviews` — performance management
- `courses`, `enrollments` — training/LMS

## Test Accounts

- `john@testcorp.com` / `Admin@123` — company_admin, companyId=1
- `superadmin@hrpay.com` / `Admin@123` — super_admin
- `samtsan6@gmail.com` / `Admin@123` — employee, companyId=1

## Frontend Pages

| Route | Page |
|---|---|
| `/` | Landing page |
| `/dashboard` | KPIs, payroll trend chart, headcount bar chart, leave pie chart |
| `/employees` | Directory with search, department/status filters, employee codes |
| `/employees/new` | Add employee form |
| `/employees/:id` | Full profile — pay history, leave balances, benefits, time entries |
| `/payroll` | Runs list — draft and completed sections |
| `/payroll/:id` | Run detail — process button, pay stubs table with tax breakdown |
| `/time` | Time entries with bulk pending approvals |
| `/leave` | Leave requests with approve/reject actions |
| `/benefits` | Plans grid + enrollments table |
| `/onboarding` | Tasks grouped by employee with progress bars |
| `/departments` | Cards with headcount, budget, CRUD |
| `/announcements` | Company-scoped announcements |
| `/expenses` | Expense claims with approval workflow |
| `/assets` | Asset inventory with employee assignment |
| `/recruitment` | Job postings + applicant pipeline |
| `/performance` | Goals + performance reviews |
| `/training` | Courses + enrollment tracking |
| `/org-chart` | Interactive hierarchy chart |
| `/reports` | Headcount, payroll summary, leave, attendance reports |
| `/settings` | Company settings (DB-persisted), locale, payroll config, security, notifications |
| `/permissions` | Role-based feature permission matrix |
| `/insights` | AI-powered weekly HR insights (company_admin only) |
| `/team` | Team management — invite, role assignment |
| `/super-admin` | Platform-level company, subscription, user management |

## Design System

- **Primary color**: Lime (`hsl(82 80% 48%)`)
- **Background**: `hsl(220 20% 96%)`
- **Sidebar**: White with lime accents
- **Typography**: Inter
- **Components**: shadcn/ui + Tailwind CSS v4
- **Charts**: Recharts
- **Notifications**: Sonner toasts

## Codegen Notes

The `lib/api-spec/package.json` codegen script patches `lib/api-zod/src/index.ts` after Orval runs to prevent duplicate exports:
```
orval --config ./orval.config.ts && echo 'export * from "./generated/api";' > ../api-zod/src/index.ts && pnpm -w run typecheck:libs
```

## AI Weekly Insights

- **Library**: `@workspace/integrations-openai-ai-server` (Replit AI Integrations OpenAI proxy)
- **Env vars**: `AI_INTEGRATIONS_OPENAI_BASE_URL`, `AI_INTEGRATIONS_OPENAI_API_KEY` (provisioned via Replit AI Integrations)
- **Routes**: `GET /api/insights`, `POST /api/insights/generate`, `GET /api/insights/:id/poll`, `PATCH /api/insights/settings`
- **Scheduler**: `node-cron` runs every Monday at 09:00 UTC, generates for all companies with `aiInsightsEnabled !== false`
- **Toggle**: stored in `companies.settings.aiInsightsEnabled` JSONB boolean
- **Data gathered**: employees, payroll runs, leave requests, expenses, time entries, onboarding tasks, performance reviews
- **GPT response**: `{ summary, score (0-100), insights: [{ category, status, title, detail, recommendation, metric }] }`
- **Frontend**: `/insights` (company_admin only), sidebar "AI Insights" nav with Sparkles icon

## Notes for Future Development

- `formatCurrency()` and `formatDate()` from `useCompanySettings()` hook should be used in all pages that display money or dates
- All new API routes must call `getRequestUser()` or `requireCompanyUser()` and filter queries by `companyId`
- New DB tables that store company-specific data should include a `company_id` column
- The `pool` export from `@workspace/db` is used in `index.ts` for graceful shutdown
