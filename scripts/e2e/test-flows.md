# Mission Control E2E Test Flows

Agent instructions for daily E2E testing.

---

## Test 1: Dashboard Page

**URL:** `/`

**Verify:**
- [ ] Page title contains "Squad Status"
- [ ] 4 metric cards visible (Total Agents, Online, Working, Errors)
- [ ] Agent grid shows 12 agent cards
- [ ] Each agent card has: name, status badge, domain
- [ ] Recent Activity section visible
- [ ] No error states (red borders, error messages)

**Interactions:**
- Click on an agent card → Should navigate to `/agent/[id]`
- If navigation fails → **FILE BUG: "Agent card click-through broken"**

---

## Test 2: Agent Detail Page

**URL:** `/agent/klaus` (or any agent ID)

**Verify:**
- [ ] Agent name and avatar displayed
- [ ] Status badge shows current state
- [ ] Activity history section present
- [ ] Stats/metrics for the agent visible
- [ ] Back navigation works

**Interactions:**
- Click back → Should return to dashboard

---

## Test 3: Tasks Page

**URL:** `/tasks`

**Verify:**
- [ ] Page title contains "Tasks"
- [ ] Kanban board with columns: URGENT, ACTION, IN PROGRESS, COMPLETED
- [ ] Task cards show: title, assignee, timestamp
- [ ] Filter controls visible
- [ ] No empty state errors if tasks exist

**Interactions:**
- Click task card → Should show task details or expand

---

## Test 4: Ralph Monitor Page

**URL:** `/ralph`

**Verify:**
- [ ] Page title contains "Ralph Monitor"
- [ ] Active build section (or "No Active Builds" state)
- [ ] Build History section with loop cards
- [ ] Summary stats row (Total Loops, Completed, Blocked, Cost)
- [ ] Phase indicators (INTERVIEW, PLAN, BUILD, DONE)

**Critical Check:**
- Progress percentage matches current step / total steps
- If showing stale data (e.g., 17/48 when should be 48/48) → **FILE BUG: "Ralph progress showing stale mock data"**

---

## Test 5: Cost Tracker Page

**URL:** `/costs`

**Verify:**
- [ ] Page title contains "Cost"
- [ ] Total cost displayed
- [ ] Cost breakdown by agent
- [ ] Chart/visualization present
- [ ] Time period selector (if implemented)

---

## Test 6: Navigation & Layout

**Verify across all pages:**
- [ ] Header present with logo
- [ ] Side navigation works
- [ ] Mobile menu (on narrow viewport)
- [ ] Theme toggle works (if implemented)
- [ ] No console errors
- [ ] No broken images (404s)

---

## Test 7: Accessibility Checks

**Verify:**
- [ ] All interactive elements have focus states
- [ ] Color contrast meets WCAG AA (text on backgrounds)
- [ ] Touch targets ≥ 44px on mobile
- [ ] Screen reader landmarks present (main, nav, etc.)

---

## Failure Actions

When any test fails:

1. **Take screenshot** of current state
2. **Capture console errors**
3. **Log the specific failure**
4. **File GitHub Issue** with:
   - Title: `[E2E] {Test Name} failed - {date}`
   - Body: Error details + screenshot + console log
   - Labels: `bug`, `e2e-failure`

---

## Success Actions

When all tests pass:
1. Log success with timestamp
2. Save screenshots to `logs/e2e/success/`
3. No notification needed (silent success)

---

## Run Frequency

- **Daily at 1 AM** via launchd
- **On-demand** via `./scripts/e2e/daily-e2e-test.sh`
- **Optional:** On Vercel deploy webhook
