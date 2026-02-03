# Lessons Learned

Track mistakes and patterns to avoid repeating them.

---

## Format

```markdown
### [Date] — [Short Title]
**Context:** What was happening
**Mistake:** What went wrong
**Lesson:** The rule to follow
**Prevention:** How to catch this earlier
```

---

## Lessons

### 2026-02-03 — Mock Data Left in Production
**Context:** Phase 1 build completed with all UI components
**Mistake:** Ralph Monitor page shows hardcoded mock data (17/48) instead of real progress
**Lesson:** Always verify data source is connected to real backend before marking complete
**Prevention:** Add "verify live data" as explicit step in every data-connected feature

### 2026-02-03 — Agent Card Navigation Broken
**Context:** Dashboard shows agent cards but click does nothing
**Mistake:** onClick handler or routing not working
**Lesson:** Test all interactive elements before marking UI complete
**Prevention:** Add click-through testing to every card/button component checklist

---

*Update this file after any correction from the user.*
