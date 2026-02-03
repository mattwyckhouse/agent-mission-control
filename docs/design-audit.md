# Mission Control Dashboard — Design Audit

**Auditor:** Klaus (acting as Pixel)  
**Date:** 2026-02-03 02:30 EST  
**Reference:** `docs/design/FINITE_STATE_MARKETING_DESIGN_SYSTEM.md` v1.1.0  
**Live URL:** https://agent-mission-control.vercel.app

---

## Executive Summary

The dashboard implements the core design system but has **12 issues** requiring attention:
- **3 Critical** (blocking brand compliance)
- **5 Medium** (visual polish)
- **4 Low** (nice-to-have refinements)

**Overall Score:** 7/10 — Solid foundation, needs polish pass

---

## ✅ What's Working Well

### Color Palette ✓
- Brand Teal (#1BD0B8) correctly used for CTAs and active states
- Brand Orange (#F27229) used for working/progress states
- Iron scale (950→25) properly implemented
- Semantic colors (success, error, warning, info) correct

### Glass-morphism ✓
- GlassCard component implements backdrop-blur correctly
- Three opacity variants available (glass-1, glass-2, glass-3)
- Border styling with white/10 opacity

### Dark Theme ✓
- Iron-950 (#111214) as page background
- Iron-900 (#1B1D20) for cards
- Proper contrast maintained

### CSS Variables ✓
- Design tokens defined in `globals.css`
- Tailwind config extends with brand colors
- Spacing scale follows 4px grid (mostly)

---

## 🔴 Critical Issues (3)

### C1: Typography Not Loading — TWK Everett Missing
**Location:** All headlines  
**Expected:** TWK Everett for headings, Instrument Sans for body  
**Actual:** Falls back to Inter/system fonts

**Impact:** Brand identity compromised — typography is a key differentiator

**Fix:**
```css
/* Add to globals.css or layout.tsx */
@font-face {
  font-family: 'TWK Everett';
  src: url('/fonts/TWKEverett-Medium.woff2') format('woff2');
  font-weight: 500;
  font-style: normal;
  font-display: swap;
}

@font-face {
  font-family: 'Instrument Sans';
  src: url('/fonts/InstrumentSans-Regular.woff2') format('woff2');
  font-weight: 400;
  font-style: normal;
  font-display: swap;
}
```

**Alternative:** Use Google Fonts if custom fonts not available:
- Headlines: `'Inter', sans-serif` with weight 600+
- Body: `'Inter', sans-serif` weight 400

---

### C2: Agent Cards Non-Clickable
**Location:** Dashboard page → Agent Grid  
**Expected:** Click agent card → Navigate to `/agent/[id]`  
**Actual:** Click does nothing (navigation broken)

**Impact:** Core functionality broken — can't view agent details

**Fix:** Check `ClientAgentGrid.tsx` onClick handler and routing

---

### C3: Mock Data Displayed as Real
**Location:** Ralph Monitor page  
**Expected:** Show actual progress (48/48 complete)  
**Actual:** Shows hardcoded mock data (17/48, "Processing step 18...")

**Impact:** Dashboard shows incorrect information — defeats purpose

**Fix:** Connect to real `progress.md` files (Phase 2 scope)

---

## 🟡 Medium Issues (5)

### M1: Inconsistent Padding in Cards
**Location:** Build History cards, Activity feed  
**Expected:** Consistent 16px (xs) or 24px (sm) padding  
**Actual:** Mix of p-3, p-4, custom values

**Fix:**
```tsx
// Standardize on design system spacing
<GlassCard padding="md"> // 32px - for major cards
<GlassCard padding="sm"> // 24px - for list items
```

---

### M2: Progress Bar Lacks Gradient/Glow
**Location:** Ralph Monitor progress bar  
**Expected:** Teal gradient with subtle glow effect  
**Actual:** Flat solid color

**Fix:**
```css
.progress-bar-fill {
  background: linear-gradient(90deg, #1BD0B8 0%, #14A090 100%);
  box-shadow: 0 0 10px rgba(27, 208, 184, 0.4);
}
```

---

### M3: Missing Hover States on History Cards
**Location:** Ralph Monitor → Build History  
**Expected:** Border highlight + subtle lift on hover  
**Actual:** No visual feedback

**Fix:** Add `hover` prop to GlassCard:
```tsx
<LoopCard>
  <GlassCard hover> // Enables hover effects
```

---

### M4: Status Badge Colors Don't Match System
**Location:** Various pages  
**Expected:** 
- Success: #67AD5C
- Error: #DE5E57
- Working: #F27229

**Actual:** Some badges use non-standard colors

**Fix:** Audit `StatusBadge.tsx` color mapping

---

### M5: Mobile Navigation Needs Work
**Location:** All pages on mobile  
**Issues:**
- Hamburger menu icon too small (needs 44px touch target)
- Nav doesn't close on selection
- No swipe gesture support

**Fix:** Review `MobileNav.tsx` for touch target compliance

---

## 🟢 Low Issues (4)

### L1: Missing Loading Skeletons
**Location:** Initial page loads  
**Expected:** Skeleton placeholders during data fetch  
**Actual:** Flash of empty content or loading spinner only

---

### L2: No Pulse Animation on Active Agents
**Location:** Agent cards with "busy" status  
**Expected:** Subtle pulse/glow animation  
**Actual:** Static badge

**Fix:** Add `animate-heartbeat-glow` class to active agents

---

### L3: Timestamp Formatting Inconsistent
**Location:** Activity feed, Last Update times  
**Issues:**
- Some use "3:06 PM", others use "15:06"
- Timezone handling unclear

**Fix:** Standardize on user's timezone with consistent format

---

### L4: Empty States Could Be Better
**Location:** Tasks page (when no tasks), Activity feed  
**Expected:** Helpful empty state with icon + action  
**Actual:** Just "No items" text

---

## Accessibility Audit

| Check | Status | Notes |
|-------|--------|-------|
| Color contrast (text) | ✅ Pass | Iron-25 on Iron-950 = 13.5:1 |
| Color contrast (badges) | ⚠️ Partial | Some warning text too light |
| Touch targets (44px) | ❌ Fail | Some buttons under 40px |
| Keyboard navigation | ⚠️ Partial | Cards not focusable |
| Screen reader labels | ⚠️ Partial | Some icons lack aria-label |
| Reduced motion | ✅ Pass | Respects prefers-reduced-motion |

---

## Recommended Fix Priority

### Sprint 1 (Phase 2 Steps 31-35)
1. **C1** — Add proper font loading
2. **C2** — Fix agent card navigation
3. **M1** — Standardize padding
4. **M4** — Fix status badge colors

### Sprint 2 (Phase 2 Steps 36-40)
5. **M2** — Progress bar gradient
6. **M3** — Hover states
7. **L2** — Active agent animation
8. **L1** — Loading skeletons

### Backlog
9. **M5** — Mobile nav improvements
10. **L3** — Timestamp formatting
11. **L4** — Empty states
12. **C3** — Real data (separate Phase 2 track)

---

## Design System Compliance Checklist

| Element | Compliant | Notes |
|---------|-----------|-------|
| Background colors | ✅ | Iron scale correct |
| Brand teal usage | ✅ | CTAs, links, active states |
| Brand orange usage | ✅ | Warnings, progress, working |
| Typography (fonts) | ❌ | Falling back to system |
| Typography (scale) | ✅ | Font sizes correct |
| Spacing (4px grid) | ⚠️ | Mostly, some exceptions |
| Border radius | ✅ | Using rounded-2xl consistently |
| Glass-morphism | ✅ | Backdrop blur implemented |
| Shadows | ⚠️ | Missing some glow effects |
| Animations | ⚠️ | Some missing hover/active states |

---

## Files Requiring Updates

1. `src/app/globals.css` — Font loading
2. `src/components/cards/ClientAgentGrid.tsx` — Navigation fix
3. `src/components/ui/StatusBadge.tsx` — Color mapping
4. `src/components/ui/ProgressBar.tsx` — Gradient + glow
5. `src/components/ralph/LoopCard.tsx` — Hover states
6. `src/components/layout/MobileNav.tsx` — Touch targets
7. `tailwind.config.ts` — Ensure font families load

---

*Audit complete. Recommend addressing Critical issues before next deploy.*
