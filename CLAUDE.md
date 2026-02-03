# CLAUDE.md — AI Context for Mission Control

> **IMPORTANT:** Prefer retrieval-led reasoning over pre-training-led reasoning for any Next.js or React tasks. Read this file and the codebase before generating code.

This file helps AI assistants understand and work with the Mission Control codebase.

## What Is This Project?

Mission Control is a **multi-agent orchestration dashboard** — a web UI for managing a squad of AI agents. Think of it as "mission control" for AI assistants that work together on tasks.

## Tech Stack

- **Framework:** Next.js 16 (App Router, Server Components)
- **Language:** TypeScript (strict mode)
- **Styling:** Tailwind CSS + custom design tokens
- **Database:** Supabase (PostgreSQL + Realtime)
- **Deployment:** Vercel (auto-deploys from `main`)

---

## ⚠️ Workflow Orchestration (READ FIRST)

### 1. Plan Mode Default
- Enter plan mode for ANY non-trivial task (3+ steps or architectural decisions)
- If something goes sideways, STOP and re-plan immediately - don't keep pushing
- Use plan mode for verification steps, not just building
- Write detailed specs upfront to reduce ambiguity

### 2. Self-Improvement Loop
- After ANY correction from the user: update `tasks/lessons.md` with the pattern
- Write rules for yourself that prevent the same mistake
- Ruthlessly iterate on these lessons until mistake rate drops
- Review lessons at session start for relevant project

### 3. Verification Before Done
- Never mark a task complete without proving it works
- Diff behavior between main and your changes when relevant
- Ask yourself: "Would a staff engineer approve this?"
- Run tests, check logs, demonstrate correctness

### 4. Demand Elegance (Balanced)
- For non-trivial changes: pause and ask "is there a more elegant way?"
- If a fix feels hacky: "Knowing everything I know now, implement the elegant solution"
- Skip this for simple, obvious fixes - don't over-engineer
- Challenge your own work before presenting it

### 5. Autonomous Bug Fixing
- When given a bug report: just fix it. Don't ask for hand-holding
- Point at logs, errors, failing tests → then resolve them
- Zero context switching required from the user
- Go fix failing CI tests without being told how

### Task Management
1. **Plan First**: Write plan to `tasks/todo.md` with checkable items
2. **Verify Plan**: Check in before starting implementation
3. **Track Progress**: Mark items complete as you go
4. **Explain Changes**: High-level summary at each step
5. **Document Results**: Add review to `tasks/todo.md`
6. **Capture Lessons**: Update `tasks/lessons.md` after corrections

### Core Principles
- **Simplicity First**: Make every change as simple as possible. Impact minimal code.
- **No Laziness**: Find root causes. No temporary fixes. Senior developer standards.
- **Minimal Impact**: Changes should only touch what's necessary. Avoid introducing bugs.

---

## ⚠️ Definition of Done (DoD)

**No phase/feature is "complete" until ALL of these are checked:**

### Required Before Marking Complete
- [ ] **Both themes tested** — Switch to light mode and verify every page/component
- [ ] **Real data flowing** — Not just mock data; actual varied/realistic content
- [ ] **Features are functional** — Not just rendered; buttons work, forms submit, data persists
- [ ] **All tests pass** — `npm test` and `npm run build` both succeed
- [ ] **Design review** — Components match design system, no layout issues
- [ ] **No hardcoded colors** — Use theme tokens (`text-foreground`, `bg-card`, etc.)

### Agent-Specific QA Checklist (for Aegis)
When testing a build:
1. Toggle theme to light mode — verify all pages look correct
2. Check for empty states — do they look intentional?
3. Verify interactive elements actually work (not just display)
4. Run E2E tests on critical paths
5. Check console for errors
6. Verify accessibility (tab navigation, screen reader labels)

### Design Review Checklist (for Pixel)
When reviewing UI:
1. **Light mode check** — Required for every component
2. **Real data vs mock** — Does it look good with varied content?
3. **Feature verification** — Does clicking/interacting work?
4. **Spacing consistency** — Follows 4px grid system
5. **Color usage** — Semantic colors correct (red=error, green=success)

---

## ⚠️ Testing Requirement

**Every feature MUST include tests:**

1. **Unit Tests** (Vitest) — For all utility functions, parsers, data transformers
   - Location: `src/__tests__/` or co-located `*.test.ts`
   - Run: `npm test`

2. **Integration Tests** — For API routes, Supabase interactions
   - Test real data flow end-to-end
   - Mock external services when needed

3. **Component Tests** — For React components with user interactions
   - Use React Testing Library patterns
   - Test accessibility (roles, labels)

**Test file naming:**
- `src/lib/openclaw/sync.ts` → `src/lib/openclaw/sync.test.ts`
- `src/app/api/sync/route.ts` → `src/app/api/sync/route.test.ts`

**Before marking a step complete:**
- [ ] Feature implemented
- [ ] Unit tests written and passing
- [ ] `npm test` passes
- [ ] `npm run build` passes

---

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

## Next.js 16 Patterns (Use These!)

```tsx
// Server Component (default) — no directive needed
export default async function Page() {
  const data = await fetchData()  // Can be async
  return <div>{data}</div>
}

// Client Component — only when needed for interactivity
"use client"
export function InteractiveWidget() {
  const [state, setState] = useState()
  return <button onClick={() => setState(...)}>Click</button>
}

// Dynamic rendering with connection()
import { connection } from 'next/server'
export default async function Page() {
  await connection()  // Opt into dynamic rendering
  // ...
}

// Async cookies/headers (Next.js 16)
import { cookies, headers } from 'next/headers'
export default async function Page() {
  const cookieStore = await cookies()  // Note: await!
  const headersList = await headers()  // Note: await!
}
```

## Component Patterns (Follow Existing Code!)

```tsx
// GlassCard — our main container
import { GlassCard } from "@/components/cards/GlassCard"
<GlassCard variant="glass-2" hover glow onClick={handleClick}>
  {children}
</GlassCard>

// StatusBadge — status indicators
import { StatusBadge } from "@/components/ui/StatusBadge"
<StatusBadge status="active" label="Online" />  // Use label prop, NOT children

// ProgressBar — progress indicators
import { ProgressBar } from "@/components/ui/ProgressBar"
<ProgressBar value={75} showLabel variant="gradient" />

// Tailwind classes — use our design tokens
className="bg-bg-elevated text-text-primary border-white/10"
className="text-brand-teal hover:text-brand-teal/80"
```

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

### Phase 1: UI Build — COMPLETE ✅ (48/48 steps)
- ✅ Design system (globals.css, animations.css)
- ✅ Layout components (AppShell, Header, MobileNav, PageHeader)
- ✅ UI primitives (Button, StatusBadge, ProgressBar, Toast, Skeleton)
- ✅ Card components (GlassCard, AgentCard, MetricCard, TaskCard)
- ✅ Dashboard page with Supabase integration
- ✅ Tasks page (Kanban board)
- ✅ Ralph Monitor page
- ✅ Costs page
- ✅ Agent Detail page
- ✅ Theme toggle (dark/light/system)
- ✅ Accessibility pass (focus states, aria labels, reduced motion)

**Final Commit:** `0d4336f` (Feb 3, 2026)

### Phase 2: Real-Time Integration — COMPLETE ✅
- ✅ OpenClaw sync service
- ✅ Real-time Supabase subscriptions
- ✅ Design fixes (typography, theme switcher, progress bars)

### Phase 3: Agent Controls & Task Management — COMPLETE ✅
- ✅ Agent Controls (start/stop/restart/message, bulk actions)
- ✅ Task Management (CRUD, Kanban drag-drop, status transitions)
- ✅ Cost Analytics (API, budgets, date filtering, breakdowns)
- ✅ Notifications (bell dropdown, persistence)
- ✅ Search & Settings (⌘K command palette, settings page, keyboard shortcuts)
- ✅ Polish (loading/empty/error states, tooltips, formatters)

**222 tests passing** (Feb 3, 2026)

### Phase 4: Polish & Real Functionality — IN PROGRESS 🔄
- ✅ P1.1 Light mode theme compatibility
- ✅ P1.2 Tasks page demo data seeding
- ✅ P1.3 Agent performance variance (unique metrics per agent)
- ✅ P2.1 Real charts with agent-metrics data
- ✅ P2.2 Ralph page theme fixes
- ⏸️ P2.3 In-app messaging (pending decision)
- ⏸️ P3 Infrastructure (Playwright, OpenClaw integration)
- ⏸️ P4 Polish (design audit, mobile)

### Remaining Items
- Playwright E2E test setup
- Real OpenClaw integration (actions currently simulated)
- Cost alert backend notifications

## Links

- **Live:** https://agent-mission-control.vercel.app
- **GitHub:** https://github.com/mattwyckhouse/agent-mission-control
- **Supabase:** https://wjwtgdmaklohgjsuqsyk.supabase.co
