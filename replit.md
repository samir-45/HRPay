# HRPay — HR & Payroll Management Platform

A full-stack HR & Payroll SaaS built for growing businesses (10–500 employees). Research-informed design targeting the $33B+ HR software market.

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
```

## Database Schema (PostgreSQL via Drizzle ORM)

- `departments` — org structure, budget, manager
- `employees` — full profile, compensation, employment status
- `payroll_runs` — bi-weekly runs with status lifecycle (draft → completed)
- `pay_stubs` — per-employee stub generated on payroll processing
- `time_entries` — clock in/out with approval workflow
- `leave_requests` — PTO/sick/personal with approval
- `leave_balances` — allocated/used/pending per employee/year
- `benefit_plans` — health, dental, vision, life, retirement
- `benefit_enrollments` — employee plan membership
- `onboarding_tasks` — grouped by employee with completion tracking

## API Endpoints

All routes under `/api`:
- `GET/POST /employees` — employee CRUD
- `GET/PUT/DELETE /employees/:id`
- `GET/POST /departments`, `PUT/DELETE /departments/:id`
- `GET/POST /payroll/runs`, `GET /payroll/runs/:id`, `POST /payroll/runs/:id/process`
- `GET /payroll/stubs`
- `GET/POST /time/entries`, `POST /time/entries/:id/approve`
- `GET/POST /leave/requests`, `POST /leave/requests/:id/approve|reject`
- `GET /leave/balances`
- `GET/POST /benefits/plans`, `GET/POST /benefits/enrollments`
- `GET /analytics/dashboard|headcount|payroll-trends|leave-summary|upcoming-events`
- `GET/POST /onboarding/tasks`, `POST /onboarding/tasks/:id/complete`

## Frontend Pages

| Route | Page |
|---|---|
| `/` | Dashboard — KPIs, payroll trend chart, headcount bar chart, leave pie chart, upcoming events |
| `/employees` | Directory with search, department/status filters, list/grid toggle |
| `/employees/new` | Add employee form |
| `/employees/:id` | Full profile — pay history, leave balances, benefits, time entries |
| `/payroll` | Runs list — draft and completed sections |
| `/payroll/:id` | Run detail — process button, pay stubs table with tax breakdown |
| `/time` | Time entries with bulk pending approvals |
| `/leave` | Leave requests with approve/reject actions |
| `/benefits` | Plans grid + enrollments table |
| `/onboarding` | Tasks grouped by employee with progress bars |
| `/departments` | Cards with headcount, budget, CRUD |

## Design System

- **Primary color**: Deep ocean blue (`hsl(199 89% 30%)`)
- **Sidebar**: Navy (`hsl(222 47% 11%)`) — dark authority
- **Typography**: Inter
- **Components**: shadcn/ui + Tailwind CSS v4
- **Charts**: Recharts

## Seed Data

20 realistic employees across 7 departments, 10 payroll runs (8 completed, 2 draft), leave requests, time entries, benefit plan enrollments, and onboarding tasks for newest hires.

## Codegen Notes

The `lib/api-spec/package.json` codegen script patches `lib/api-zod/src/index.ts` after Orval runs to prevent duplicate exports:
```
orval --config ./orval.config.ts && echo 'export * from "./generated/api";' > ../api-zod/src/index.ts && pnpm -w run typecheck:libs
```
