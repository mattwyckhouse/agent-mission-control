# Messages Page — UX Design Spec

## Overview

The Messages page displays inter-agent communication history. It needs to handle thousands of messages gracefully over days/weeks/months of use.

## Design Principles

1. **Scale gracefully** — 10 messages or 10,000 should feel equally usable
2. **Find fast** — Users can locate specific conversations quickly
3. **Context matters** — Show the flow of communication, not isolated messages
4. **Performance first** — Never load more than needed
5. **Real-time aware** — New messages appear without disruption

---

## View Modes

### 1. Timeline View (Default)
Chronological feed of all messages, grouped by date.

```
┌─────────────────────────────────────────────────────────────┐
│  Agent Messages                              [🔍] [⚙️ Filter] │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ─────────── Today ───────────                              │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 🎯 Klaus → 🔨 Forge                      5:42 PM    │   │
│  │ Starting Phase 4 build. Focus on critical fixes    │   │
│  │ first, then move to feature completion.            │   │
│  │ ─────────────────────────────────────────────────  │   │
│  │ [session_send]  [📋 View Task]                     │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 🔨 Forge → 🎯 Klaus                      5:45 PM    │   │
│  │ Acknowledged. Beginning P1.1 light mode fixes.     │   │
│  │ Will report progress every 30 minutes.             │   │
│  │ ─────────────────────────────────────────────────  │   │
│  │ [session_send]  [In reply to ↑]                    │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ─────────── Yesterday ───────────                          │
│                                                             │
│  [Load more...]                                             │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 2. Conversations View
Group messages by agent pair (A↔B conversations).

```
┌─────────────────────────────────────────────────────────────┐
│  Conversations                               [🔍] [⚙️ Filter] │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 🎯 Klaus ↔ 🔨 Forge                    12 messages │   │
│  │ Last: "Build complete. All tests passing."         │   │
│  │ 5 minutes ago                                      │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 🎯 Klaus ↔ 📧 Iris                      3 messages │   │
│  │ Last: "Urgent emails forwarded to Matt."           │   │
│  │ 2 hours ago                                        │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 🎯 Klaus ↔ 👤 Matt                      8 messages │   │
│  │ Last: "Phase 4 status update sent."                │   │
│  │ 3 hours ago                                        │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 3. Agent Focus View
All messages to/from a specific agent.

```
┌─────────────────────────────────────────────────────────────┐
│  🔨 Forge — Messages                         [← All Agents] │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Stats: 45 messages today | 312 this week | 89% to Klaus   │
│                                                             │
│  ─────────── Sent by Forge ───────────                     │
│  • "Build complete..." → Klaus (5m ago)                    │
│  • "Starting P2.1..." → Klaus (2h ago)                     │
│                                                             │
│  ─────────── Received by Forge ───────────                 │
│  • "Starting Phase 4..." ← Klaus (3h ago)                  │
│  • "Run tests on..." ← Aegis (4h ago)                      │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Components

### 1. MessageCard
Single message display with expandable details.

**States:**
- Collapsed (default): sender → recipient, preview, timestamp
- Expanded: full content, metadata, related items

**Actions:**
- Click to expand
- Link to related task
- View thread context
- Copy message

### 2. ConversationThread
Expandable conversation between two agents.

**Features:**
- Shows message count and last activity
- Click to expand full thread
- Chronological within thread

### 3. DateSeparator
Visual break between message groups.

**Formats:**
- "Today", "Yesterday"
- "Mon, Jan 27" (this week)
- "Jan 15, 2026" (older)

### 4. FilterBar
Multi-criteria filtering.

**Filters:**
- Agent (from/to dropdown)
- Message type (session_send, escalation, report)
- Date range (quick picks + custom)
- Task (linked task filter)
- Search (full-text)

### 5. ViewToggle
Switch between Timeline / Conversations / Agent views.

### 6. MessageStats
Summary statistics card.

**Metrics:**
- Total messages (today/week/all)
- Active conversations
- Most active agent pair
- Messages by type pie chart

### 7. InfiniteScroll / LoadMore
Pagination strategy for large datasets.

**Options:**
- Virtual scrolling (keeps DOM light)
- "Load more" button (simpler)
- Auto-load on scroll (hybrid)

### 8. RealTimeBadge
New message indicator.

**Behavior:**
- "3 new messages" banner at top
- Click to scroll to newest
- Auto-dismiss after viewing

---

## Filtering & Search

### Quick Filters (chips)
- All | Today | This Week | Unread
- Type: session_send | escalation | report

### Advanced Filters (expandable)
```
┌─────────────────────────────────────────────────────────────┐
│ ⚙️ Filters                                          [Clear] │
├─────────────────────────────────────────────────────────────┤
│ From Agent:  [All ▾]     To Agent:  [All ▾]                │
│ Type:        [All ▾]     Task:      [None ▾]               │
│ Date Range:  [Last 7 days ▾]  [Jan 27] to [Feb 3]          │
│ Search:      [________________🔍]                          │
└─────────────────────────────────────────────────────────────┘
```

### Search
- Full-text search across message content
- Highlight matches in results
- Search within filtered results

---

## Performance Strategy

### Pagination
- Default: 50 messages per page
- "Load more" button at bottom
- Remember scroll position on back-navigation

### Virtual Scrolling (if needed)
- Only render visible messages + buffer
- Use react-window or similar
- Preserve scroll position on filter changes

### Caching
- Cache recent messages in memory
- Background refresh every 30s
- Optimistic UI for new messages

### Database
- Indexed queries on created_at, from_agent_id, to_agent_id
- Limit query results to prevent timeouts
- Use cursor-based pagination for efficiency

---

## Real-Time Updates

### Supabase Subscription
```typescript
supabase
  .channel('messages')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'messages'
  }, handleNewMessage)
  .subscribe()
```

### New Message Handling
1. If user is at top of timeline:
   - Insert message at top
   - Gentle animation

2. If user has scrolled down:
   - Show "X new messages" banner
   - Don't disrupt scroll position
   - Click banner to jump to top

### Stale Data Handling
- Show "Updated 30s ago" timestamp
- Manual refresh button always available

---

## Mobile Considerations

### Responsive Breakpoints
- Mobile (<768px): Single column, larger touch targets
- Tablet (768-1024px): Two-column possible
- Desktop (>1024px): Full layout with sidebar options

### Touch Interactions
- Swipe to reveal actions (mobile)
- Pull-to-refresh (mobile)
- Long-press for context menu

### Bottom Sheet
- Filter panel as bottom sheet on mobile
- Message details as bottom sheet

---

## Accessibility

### Keyboard Navigation
- Tab through messages
- Enter to expand
- Arrow keys within thread
- Escape to close details

### Screen Reader
- Proper heading hierarchy
- ARIA labels on interactive elements
- Live region for new messages

### Reduced Motion
- Respect prefers-reduced-motion
- No auto-animations for motion-sensitive users

---

## Empty & Loading States

### Empty State
```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│                    💬                                       │
│           No messages yet                                   │
│                                                             │
│   Inter-agent messages will appear here when agents         │
│   communicate via sessions_send.                            │
│                                                             │
│   [Learn about message logging →]                           │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Loading State
- Skeleton cards (3-5 placeholder cards)
- Subtle shimmer animation
- No layout shift on load

### Error State
- Clear error message
- Retry button
- Fallback to cached data if available

---

## Implementation Priority

### Phase 1: Foundation
1. ✅ Basic message list
2. Pagination (load more)
3. Date grouping
4. Basic filtering (agent, type)

### Phase 2: Enhanced UX
5. Search
6. Conversations view
7. Real-time updates
8. Message stats

### Phase 3: Polish
9. Virtual scrolling (if needed)
10. Agent focus view
11. Mobile optimizations
12. Accessibility audit

---

## File Structure

```
src/
├── app/messages/
│   ├── page.tsx              # Main page (view switcher)
│   ├── TimelineView.tsx      # Timeline view
│   ├── ConversationsView.tsx # Conversations view
│   └── AgentView.tsx         # Agent focus view
├── components/messages/
│   ├── MessageCard.tsx       # Single message
│   ├── MessageThread.tsx     # Thread container
│   ├── ConversationCard.tsx  # Conversation summary
│   ├── MessageFilters.tsx    # Filter bar
│   ├── MessageSearch.tsx     # Search input
│   ├── MessageStats.tsx      # Stats summary
│   ├── DateSeparator.tsx     # Date divider
│   ├── NewMessageBanner.tsx  # Real-time banner
│   └── index.ts              # Exports
├── lib/messages/
│   ├── queries.ts            # Supabase queries
│   ├── realtime.ts           # Subscription hooks
│   └── types.ts              # Message types
```

---

## API Enhancements Needed

### Current
- `GET /api/messages` — Basic fetch with filters
- `POST /api/messages` — Log new message

### Needed
- `GET /api/messages/conversations` — Grouped by agent pair
- `GET /api/messages/stats` — Aggregated statistics
- `GET /api/messages/search?q=` — Full-text search
- Cursor-based pagination support

---

## Design Tokens

Use existing Mission Control design system:
- `bg-card` for message cards
- `text-foreground` / `text-muted-foreground`
- `border-border` for separators
- `brand-teal` for active/selected states
- Consistent spacing: 4px grid
