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

### 2026-02-03 — Regex Lookahead Matching Substrings
**Context:** Parsing PENDING_TASKS.md with section extraction regex
**Mistake:** Used `(?=## |$)` which matched inside `### ` headers (position 1 of `### ` is `## `)
**Lesson:** When using lookahead for markdown headers, exclude subsections: `(?=\n## [^#]|$)`
**Prevention:** Test regex against content with multiple header levels (## and ###)

### 2026-02-03 — Supabase Types Not Generated
**Context:** API routes using Supabase client for upsert/insert
**Mistake:** Types returned `never` because schema types weren't regenerated
**Lesson:** After schema changes, regenerate types: `npx supabase gen types typescript`
**Prevention:** Add type regeneration to the deployment checklist

---

*Update this file after any correction from the user.*
