# CLAUDE.md — AI Context for Mission Control

This file helps AI assistants understand and work with the Mission Control codebase.

## What Is This Project?

Mission Control is a **multi-agent orchestration dashboard** — a web UI for managing a squad of AI agents. Think of it as "mission control" for AI assistants that work together on tasks.

## Tech Stack

- **Framework:** Next.js 16 (App Router, Server Components)
- **Language:** TypeScript (strict mode)
- **Styling:** Tailwind CSS + custom design tokens
- **Database:** Supabase (PostgreSQL + Realtime)
- **Deployment:** Vercel (auto-deploys from `main`)

## Architecture

### File Organization

```
src/
├── app/          # Pages (App Router)
├── components/
│   ├── cards/    # Agent/metric cards
│   ├── layout/   # Shell, header, nav
│   └── ui/       # Primitives (Button, Badge, etc.)
├── lib/          # Utilities and clients
└── types/        # TypeScript interfaces
```

### Key Patterns

1. **Server Components by default** — Client components only when needed (`"use client"`)
2. **Component composition** — Small, focused components that compose well
3. **Design tokens** — Colors/spacing from `src/app/globals.css`
4. **Supabase Realtime** — Live updates via subscriptions (planned)

### Design System

Dark theme with Finite State branding:
- Background: `#111214` (base), `#1B1D20` (elevated)
- Brand: Teal `#1BD0B8`, Orange `#F27229`
- Text: White with opacity variants

## Database Schema

Six main tables (all have RLS policies):

| Table | Purpose |
|-------|---------|
| `agents` | Agent definitions and runtime state |
| `tasks` | Work items (Kanban-style) |
| `messages` | Agent-to-agent and human-to-agent comms |
| `activities` | Activity feed events |
| `documents` | Shared docs and context |
| `notifications` | Alerts and notifications |

## Common Tasks

### Add a new component
1. Create in appropriate `src/components/` subdirectory
2. Export from parent index if needed
3. Follow existing naming conventions (PascalCase)

### Add a new page
1. Create folder in `src/app/[route]/`
2. Add `page.tsx` with default export
3. Use `AppShell` wrapper for consistent layout

### Run locally
```bash
npm install
cp .env.local.example .env.local  # Add Supabase creds
npm run dev
```

### Type generation
```bash
npx supabase gen types typescript --project-id $PROJECT_ID > src/lib/supabase/types.ts
```

## Current State

Build progress: ~48% complete (Step 23 of 48)
- ✅ Design system
- ✅ Layout components
- ✅ UI primitives
- ✅ Card components
- 🔄 Dashboard page (in progress)
- ⬜ Ralph Loop visualization
- ⬜ Task board
- ⬜ Real-time updates

## Links

- **Live:** https://agent-mission-control.vercel.app
- **GitHub:** https://github.com/mattwyckhouse/agent-mission-control
- **Supabase:** https://wjwtgdmaklohgjsuqsyk.supabase.co
