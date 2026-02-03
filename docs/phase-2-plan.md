# Ralph Loop Plan — Mission Control Phase 2

## Overview
**Goal:** Transform Mission Control from a static dashboard with mock data into a live, real-time control center connected to OpenClaw.

**Key Deliverables:**
1. Real-time Supabase subscriptions for live updates
2. OpenClaw integration (pull actual agent status, costs, tasks)
3. Sync TASKS.md / PENDING_TASKS.md with Supabase tasks table
4. Apply Pixel's design fixes (pending audit)
5. Fix agent card click-through issues

---

## ⚠️ TESTING REQUIREMENT

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

## Phase 1: Data Synchronization (Steps 1-10)

### Step 1: Create OpenClaw Data Sync Service
**File:** `src/lib/openclaw/sync.ts`
- Create service that reads from OpenClaw workspace files
- Parse TASKS.md, PENDING_TASKS.md, agent SOUL.md files
- Export data in Supabase-compatible format

### Step 2: Create Supabase Sync API Route
**File:** `src/app/api/sync/route.ts`
- POST endpoint to receive OpenClaw data
- Upsert agents, tasks, activities to Supabase
- Handle idempotent updates (don't duplicate)

### Step 3: Agent Status Sync
**File:** `src/lib/openclaw/agents.ts`
- Parse agent heartbeat schedules from cron list
- Map OpenClaw session states to agent statuses
- Calculate `last_heartbeat` from cron run history

### Step 4: Task Queue Parser
**File:** `src/lib/openclaw/tasks.ts`
- Parse TASKS.md markdown sections (URGENT, ACTION, IN PROGRESS, COMPLETED)
- Extract task metadata (assignee, timestamp, context)
- Map to Supabase task schema

### Step 5: PENDING_TASKS Parser
**File:** `src/lib/openclaw/pending.ts`
- Parse PENDING_TASKS.md for async work
- Track In Progress / Completed Today sections
- Map to tasks with appropriate status

### Step 6: Activity Feed Generator
**File:** `src/lib/openclaw/activities.ts`
- Parse agent reports from TASKS.md
- Generate activity items from task transitions
- Create activities for heartbeat checks

### Step 7: Cost Data Aggregator
**File:** `src/lib/openclaw/costs.ts`
- Read from OpenClaw session usage stats (if available)
- Aggregate by agent, by day
- Calculate token counts and estimated costs

### Step 8: Create Sync Cron Job
**File:** `src/lib/openclaw/cron.ts` (runs in OpenClaw)
- Script to run every 5 minutes
- Read workspace files → POST to sync API
- Log sync status to activity feed

### Step 9: Initial Data Seeding Script
**File:** `scripts/seed-from-openclaw.ts`
- One-time script to populate Supabase from current state
- Read all agents from agents/ directory
- Parse current TASKS.md state
- Insert baseline data

### Step 10: Sync Verification Dashboard Section
**File:** `src/components/admin/SyncStatus.tsx`
- Show last sync time
- Display any sync errors
- Manual "Sync Now" button

---

## Phase 2: Real-Time Subscriptions (Steps 11-18)

### Step 11: Supabase Realtime Client Setup
**File:** `src/lib/supabase/realtime.ts`
- Configure Supabase Realtime client
- Set up channel subscriptions
- Handle reconnection logic

### Step 12: useAgentsSubscription Hook
**File:** `src/hooks/useAgentsSubscription.ts`
- Subscribe to agents table changes
- Return live agent data
- Handle optimistic updates

### Step 13: useTasksSubscription Hook
**File:** `src/hooks/useTasksSubscription.ts`
- Subscribe to tasks table changes
- Filter by status/agent as needed
- Update Kanban board in real-time

### Step 14: useActivitiesSubscription Hook
**File:** `src/hooks/useActivitiesSubscription.ts`
- Subscribe to activities table
- Stream new activities to feed
- Limit to last N items

### Step 15: Real-Time Dashboard Page
**File:** `src/app/page.tsx` (update)
- Replace server fetch with client subscription
- Add loading skeleton during initial load
- Show "Live" indicator when connected

### Step 16: Real-Time Tasks Page
**File:** `src/app/tasks/page.tsx` (update)
- Subscribe to tasks changes
- Animate task transitions between columns
- Show real-time assignee changes

### Step 17: Real-Time Agent Detail Page
**File:** `src/app/agent/[id]/page.tsx` (update)
- Subscribe to single agent changes
- Live activity feed for that agent
- Real-time status updates

### Step 18: Connection Status Indicator
**File:** `src/components/ui/ConnectionStatus.tsx`
- Show real-time connection state
- Reconnecting / Connected / Disconnected
- Toast on connection loss

---

## Phase 3: Ralph Loop Integration (Steps 19-24)

### Step 19: Ralph Build Schema
**File:** Supabase migration
- Add `ralph_builds` table
- Fields: id, name, phase, current_step, total_steps, agent_id, started_at, completed_at, status

### Step 20: Ralph Progress Parser
**File:** `src/lib/openclaw/ralph.ts`
- Parse ralph/builds/*/progress.md files
- Extract current step, blockers, notes
- Calculate completion percentage

### Step 21: Ralph Monitor Real-Time
**File:** `src/app/ralph/page.tsx` (update)
- Subscribe to ralph_builds table
- Show live progress updates
- Animate step transitions

### Step 22: Ralph Output Stream
**File:** `src/components/ralph/LiveOutput.tsx` (update)
- Connect to build output stream
- Show last N lines of agent activity
- Auto-scroll to bottom

### Step 23: Ralph History View
**File:** `src/app/ralph/history/page.tsx`
- List completed builds
- Show stats: duration, cost, steps
- Link to archived progress.md

### Step 24: Ralph Build Detail Page
**File:** `src/app/ralph/[id]/page.tsx`
- Full build detail view
- Step-by-step progress
- Blockers and notes

---

## Phase 4: Bug Fixes & Polish (Steps 25-30)

### Step 25: Fix Agent Card Click-Through
**File:** `src/components/cards/ClientAgentGrid.tsx`
- Debug navigation not working issue
- Ensure onClick fires correctly
- Add loading state during navigation

### Step 26: Fix Ralph Progress Display
**File:** Multiple
- Investigate why showing 17/48 instead of 48/48
- Ensure progress.md parsing is accurate
- Update CLAUDE.md with actual completion status

### Step 27: Update CLAUDE.md
**File:** `CLAUDE.md`
- Update build progress to 100%
- Document new Phase 2 features
- Add real-time subscription patterns

### Step 28: Remove Mock Data Dependencies
**File:** `src/lib/mock-data.ts`
- Keep for testing/demo mode only
- Add DEMO_MODE env flag
- Default to real Supabase data

### Step 29: Loading States Everywhere
**Files:** All pages
- Add Skeleton components during data fetch
- Handle empty states gracefully
- Show "No data" vs "Loading" correctly

### Step 30: Error Handling & Retry
**Files:** All subscription hooks
- Handle Supabase errors gracefully
- Auto-retry on connection loss
- Show user-friendly error messages

---

## Phase 5: Design Fixes (Steps 31-40)
*Based on Pixel's Design Audit: `docs/design-audit.md` (in repo)*

**READ THE AUDIT FIRST** — It contains 12 specific issues with fix instructions.

### Step 31: Fix Typography (CRITICAL C1)
**Files:** `globals.css`, `layout.tsx`, `tailwind.config.ts`
**Audit Finding:** TWK Everett not loading, falls back to Inter

**Fix:**
- Add @font-face declarations for TWK Everett + Instrument Sans
- OR use Google Fonts fallback with Inter weight 600+ for headlines
- Ensure `font-heading` and `font-body` classes work

### Step 32: Fix Agent Card Navigation (CRITICAL C2)
**File:** `src/components/cards/ClientAgentGrid.tsx`
**Audit Finding:** Click does nothing, navigation broken

**Fix:**
- Debug onClick handler
- Ensure Next.js routing to `/agent/[id]` works
- Add loading state during navigation

### Step 33: Standardize Padding (MEDIUM M1)
**Files:** All card components
**Audit Finding:** Mix of p-3, p-4, custom values

**Fix:**
- Use GlassCard padding prop consistently
- `padding="lg"` (32px) for major cards
- `padding="md"` (24px) for standard cards
- `padding="sm"` (16px) for compact items

### Step 34: Fix Status Badge Colors (MEDIUM M4)
**File:** `src/components/ui/StatusBadge.tsx`
**Audit Finding:** Some badges use non-standard colors

**Fix:**
- Success: #67AD5C
- Error: #DE5E57
- Working: #F27229
- Map all status types to correct semantic colors

### Step 35: Progress Bar Gradient + Glow (MEDIUM M2)
**File:** `src/components/ui/ProgressBar.tsx`
**Audit Finding:** Flat solid color, no visual polish

**Fix:**
```css
background: linear-gradient(90deg, #1BD0B8 0%, #14A090 100%);
box-shadow: 0 0 10px rgba(27, 208, 184, 0.4);
```

### Step 36: Add Hover States to Cards (MEDIUM M3)
**Files:** `LoopCard.tsx`, card components
**Audit Finding:** No visual feedback on hover

**Fix:**
- Add `hover` prop to GlassCard instances
- Ensure border highlight + subtle lift on hover

### Step 37: Active Agent Pulse Animation (LOW L2)
**Files:** `AgentCard.tsx`, `StatusBadge.tsx`
**Audit Finding:** Busy agents have static badge

**Fix:**
- Add `animate-heartbeat-glow` class to busy/active agents
- Use keyframe from tailwind.config.ts

### Step 38: Loading Skeletons (LOW L1)
**Files:** All pages
**Audit Finding:** Flash of empty content

**Fix:**
- Add Skeleton component usage during data fetch
- Use Suspense boundaries where appropriate

### Step 39: Mobile Touch Targets (MEDIUM M5)
**File:** `src/components/layout/MobileNav.tsx`
**Audit Finding:** Some buttons under 40px, need 44px minimum

**Fix:**
- Ensure all interactive elements meet 44px touch target
- Fix hamburger menu icon size
- Close nav on selection

### Step 40: Timestamp Formatting + Empty States (LOW L3, L4)
**Files:** `ActivityList.tsx`, various
**Audit Finding:** Inconsistent formats, basic empty states

**Fix:**
- Standardize on user timezone with consistent format
- Add helpful empty states with icons + suggested actions

---

## Phase 6: Final Integration (Steps 41-48)

### Step 41: OpenClaw Sync Cron Setup
**Action:** Configure cron job
- Add sync job to OpenClaw config
- Run every 5 minutes
- Verify data flows correctly

### Step 42: End-to-End Testing
**Action:** Manual testing
- Verify all pages show real data
- Test real-time updates
- Confirm agent detail pages work

### Step 43: Performance Audit
**Action:** Lighthouse audit
- Check bundle size
- Optimize subscriptions
- Reduce unnecessary re-renders

### Step 44: Accessibility Pass
**Action:** a11y audit
- Test with screen reader
- Verify keyboard navigation
- Check color contrast ratios

### Step 45: Documentation Update
**Files:** README.md, CLAUDE.md
- Document real-time features
- Add sync configuration guide
- Update deployment instructions

### Step 46: Environment Variable Audit
**File:** `.env.local.example`
- Document all required vars
- Add DEMO_MODE option
- Verify Vercel env vars set

### Step 47: Deploy & Smoke Test
**Action:** Deploy to Vercel
- Verify build succeeds
- Test live site
- Check real-time in production

### Step 48: Report Completion
**Action:** Update progress.md
- Mark build DONE
- Document final state
- Note any remaining issues

---

## Dependencies

1. **Pixel's Design Audit** — Steps 31-40 depend on audit findings
2. **Supabase Access** — Need admin access for migrations
3. **OpenClaw Sync Permissions** — Need to read workspace files
4. **Vercel Env Vars** — May need updates for new features

## Estimated Cost
- ~30-40 steps of active building
- ~$15-25 total (similar to Phase 1)
- 3-4 hours of agent time

## Risk Assessment

| Risk | Mitigation |
|------|------------|
| Supabase rate limits | Batch updates, debounce subscriptions |
| Stale data race conditions | Use database timestamps, not local |
| Real-time connection drops | Auto-reconnect with backoff |
| Design audit delays | Phase 5 can run in parallel |

---

## Notes
- Keep mock data mode for demos and testing
- Real-time subscriptions should be opt-in per page
- Consider WebSocket keepalive for long sessions
- May need Supabase Pro for high-frequency updates
