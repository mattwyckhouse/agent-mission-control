# Product Requirements Document
## Agent Mission Control v2

**Version:** 1.1  
**Author:** Klaus (AI) + Matt Wyckhouse  
**Date:** February 2, 2026  
**Status:** Draft

---

## 1. Executive Summary

Agent Mission Control is a multi-agent orchestration system built on OpenClaw. It coordinates a team of specialist AI agents (email, calendar, code review, research, etc.) that run autonomously, share context, and escalate to a human when judgment is needed.

**v1 (Current):** File-based system using TASKS.md and cron jobs. Works but has limitations around task management, agent communication, and visibility.

**v2 (This PRD):** Full-featured web dashboard with Supabase backend, real-time activity feeds, agent configuration visibility, and deployable infrastructure.

---

## 2. Background & Current State

### What Exists Today

| Component | Implementation | Status |
|-----------|---------------|--------|
| Agent Definitions | `agents/{name}/SOUL.md` files | ✅ 11 agents defined |
| Task Queue | `TASKS.md` markdown file | ✅ Working but limited |
| Scheduling | OpenClaw cron jobs | ✅ 13 jobs configured |
| Agent Sessions | OpenClaw isolated sessions | ✅ Working |
| Cross-Agent Comms | `sessions_send` + file writes | ⚠️ Functional but awkward |
| Observability | Manual file inspection | ❌ No dashboard |
| Integrations | Gmail, Calendar, GitHub, Notion | ✅ Core integrations working |

### Current Agent Roster

| Agent | Domain | Heartbeat |
|-------|--------|-----------|
| Klaus | Squad Lead | Always on (main session) |
| Iris | Email & Comms | Every 30 min |
| Atlas | Calendar & Meetings | Every hour |
| Oracle | Intelligence & Research | Every 4 hours |
| Sentinel | Metrics & Alerts | Every 2 hours |
| Herald | Content & Brand | Every 4 hours |
| Forge | Code & PRs | Every 30 min |
| Aegis | Testing & QA | Every hour |
| Codex | Docs & Knowledge | Every 2 hours |
| Pathfinder | Travel & Logistics | Daily |
| Curator | Gifts & Occasions | Weekly |
| Steward | Personal Admin | Daily |

### What Works Well
- Agent isolation (each agent has its own context)
- Cron-based heartbeats (reliable scheduling)
- SOUL.md pattern (clear agent instructions)
- OpenClaw's tool access (browser, shell, APIs)

### Pain Points
1. **Task queue is a flat file** — No filtering, assignment, priorities, or status tracking at scale
2. **Agent messaging is awkward** — `sessions_send` works but has no history or threading
3. **No visibility** — Can't see what agents are doing without reading files
4. **No structured handoffs** — Agents can't cleanly pass work to each other
5. **No autonomous building** — Can't use Ralph Loops to build new capabilities
6. **Single machine** — No resilience, tied to one MacBook

---

## 3. Problem Statement

**For:** Matt Wyckhouse (CEO of Finite State)  
**Who:** Runs a team of AI agents to manage business and personal tasks  
**The Problem Is:** The current file-based system doesn't scale, lacks visibility, and makes agent coordination difficult  
**The Solution:** A proper task queue with a database backend, web dashboard, and deployable infrastructure  
**That Results In:** Agents that can reliably hand off work, track progress, and operate with minimal human oversight — from anywhere

---

## 4. User Stories

### As Matt (Human Operator)

| ID | Story | Priority |
|----|-------|----------|
| U1 | I want to see what all agents are working on in one place | P0 |
| U2 | I want to assign a task to a specific agent | P0 |
| U3 | I want to be notified only when my input is actually needed | P0 |
| U4 | I want to see a history of completed tasks | P1 |
| U5 | I want to pause/resume specific agents | P1 |
| U6 | I want metrics on agent performance (tasks completed, errors, etc.) | P1 |
| U7 | I want to see each agent's configuration, SOUL, skills, and tools | P0 |
| U8 | I want a real-time activity feed of everything happening | P0 |
| U9 | I want to read and create deliverable documents | P1 |
| U10 | I want this to run even if my MacBook is off | P1 |

### As Klaus (Squad Lead Agent)

| ID | Story | Priority |
|----|-------|----------|
| K1 | I want to delegate tasks to specialist agents | P0 |
| K2 | I want to know when an agent completes or fails a task | P0 |
| K3 | I want to see agent status without polling files | P1 |
| K4 | I want to spawn sub-agents for complex work | P1 |

### As a Specialist Agent (Iris, Forge, etc.)

| ID | Story | Priority |
|----|-------|----------|
| A1 | I want to claim tasks from the queue relevant to my domain | P0 |
| A2 | I want to update task status as I work | P0 |
| A3 | I want to escalate to Klaus when I need help | P0 |
| A4 | I want to hand off work to another agent | P1 |
| A5 | I want to access shared context from other agents | P1 |
| A6 | I want to maintain my working memory (WORKING.md) | P0 |

---

## 5. Functional Requirements

### 5.1 Task Queue (P0)

**Must Have:**
- [ ] Create, read, update, delete tasks via API
- [ ] Task properties: title, description, status, assignee, priority, due date
- [ ] Status workflow: `inbox` → `assigned` → `in_progress` → `review` → `done` (or `blocked`)
- [ ] Filter tasks by: assignee, status, priority, domain
- [ ] Task assignment (to specific agent or "any")
- [ ] Task history and audit log
- [ ] Subtasks via parent relationship
- [ ] Dependencies via "blocked by" relationship

### 5.2 Agent Messaging (P0)

**Must Have:**
- [ ] Agent-to-agent message sending (comments on tasks)
- [ ] Message history per task thread
- [ ] @mention notification system (@agent or @all)
- [ ] Thread subscriptions (auto-subscribe when you comment/get mentioned/get assigned)
- [ ] Notification queue with delivery tracking
- [ ] Escalation path to Klaus

### 5.3 Activity Feed (P0)

**Must Have:**
- [ ] Real-time stream of all system events
- [ ] Event types: task_created, task_updated, message_sent, document_created, agent_heartbeat, etc.
- [ ] Filter by agent, event type, time range
- [ ] Timestamps and agent attribution

### 5.4 Dashboard (P0)

**Must Have:**
- [ ] **Activity Feed Panel** — Real-time stream of everything happening
- [ ] **Task Board** — Kanban columns: Inbox → Assigned → In Progress → Review → Done
- [ ] **Agent Cards** — Status of each agent, current task, last heartbeat, health indicator
- [ ] **Document Panel** — Read and create deliverables (markdown)
- [ ] **Detail View** — Expand any task to see full context, comments, history
- [ ] **Agent Configuration View** — See SOUL, skills, tools/connections for each agent
- [ ] Quick actions: assign task, pause agent, send message, escalate

### 5.5 Agent Configuration Visibility (P0)

**Must Have:**
- [ ] View each agent's SOUL.md content
- [ ] View each agent's skills (available tools)
- [ ] View each agent's connections (integrations, APIs)
- [ ] View heartbeat schedule and frequency
- [ ] View session key
- [ ] Edit configuration (future: v2.1)

### 5.6 Documents/Deliverables (P1)

**Must Have:**
- [ ] Create documents (markdown)
- [ ] Attach documents to tasks
- [ ] Document types: deliverable, research, protocol, notes
- [ ] Version history (future)

### 5.7 Daily Standup (P1)

**Must Have:**
- [ ] Automated daily summary generation
- [ ] Completed tasks grouped by agent
- [ ] In-progress tasks
- [ ] Blocked tasks
- [ ] Key decisions made
- [ ] Delivered via WhatsApp at configured time

### 5.8 Working Memory (P0)

**Each agent maintains:**
- [ ] `WORKING.md` — Current task state, next steps
- [ ] Updated at start/end of each heartbeat
- [ ] Visible in dashboard

### 5.9 Ralph Loops Integration (P2)

**Must Have:**
- [ ] Forge can spawn Ralph Loops for autonomous coding tasks
- [ ] Results feed back into task queue
- [ ] Cost tracking and limits
- [ ] Human approval gates for significant changes

### 5.10 Infrastructure Resilience (P1)

**Must Have:**
- [ ] Deployable to cloud infrastructure (not just local MacBook)
- [ ] Supabase for persistent storage
- [ ] Vercel for dashboard hosting
- [ ] OpenClaw can run on remote server or container
- [ ] Works when local machine is off

---

## 6. Non-Functional Requirements

| Requirement | Target | Rationale |
|-------------|--------|-----------|
| Latency | Task operations < 500ms | Real-time feel |
| Dashboard Load | < 2s initial load | Responsive UX |
| Reliability | 99.9% uptime (Supabase/Vercel) | Always accessible |
| Cost | < $50/day total agent spend | Budget control |
| Security | Row-level security, auth required | Private data |
| Scalability | Support 20+ agents | Room to grow |
| Mobile | Dashboard works on mobile | Check from anywhere |

---

## 7. Technical Architecture

### 7.1 System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        MATT (Human)                              │
│                WhatsApp / Telegram / Dashboard                   │
└─────────────────────────────────────────────────────────────────┘
                                │
                ┌───────────────┼───────────────┐
                ▼               ▼               ▼
┌───────────────────┐  ┌───────────────┐  ┌─────────────────────┐
│   WEB DASHBOARD   │  │    KLAUS      │  │   NOTIFICATION      │
│   (Next.js)       │  │   (Main)      │  │   DAEMON            │
│   ─────────────   │  │   ─────────   │  │   ─────────────     │
│   • Activity Feed │  │   • Delegates │  │   • Polls Supabase  │
│   • Task Board    │  │   • Escalates │  │   • Delivers @mentions│
│   • Agent Cards   │  │   • Judgment  │  │   • Every 2 seconds │
│   • Documents     │  │               │  │                     │
│   • Config View   │  │               │  │                     │
└────────┬──────────┘  └───────┬───────┘  └──────────┬──────────┘
         │                     │                      │
         └─────────────────────┼──────────────────────┘
                               ▼
              ┌─────────────────────────────────┐
              │         SUPABASE                │
              │         ─────────               │
              │  ┌─────────┐  ┌─────────┐       │
              │  │ agents  │  │  tasks  │       │
              │  └─────────┘  └─────────┘       │
              │  ┌─────────┐  ┌─────────┐       │
              │  │messages │  │activities│      │
              │  └─────────┘  └─────────┘       │
              │  ┌─────────┐  ┌─────────────┐   │
              │  │documents│  │notifications│   │
              │  └─────────┘  └─────────────┘   │
              └─────────────────────────────────┘
                               ▲
                               │
              ┌────────────────┼────────────────┐
              ▼                ▼                ▼
     ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
     │    IRIS      │  │    FORGE     │  │   ATLAS      │
     │   (Email)    │  │   (Code)     │  │  (Calendar)  │
     │   ─────────  │  │   ─────────  │  │   ─────────  │
     │   cron:30min │  │   cron:30min │  │   cron:1hr   │
     └──────────────┘  └──────────────┘  └──────────────┘
              │                │                │
              └────────────────┼────────────────┘
                               ▼
              ┌─────────────────────────────────┐
              │         CLI TOOL (mc)           │
              │         ─────────────           │
              │   mc task create/list/update    │
              │   mc agent status/heartbeat     │
              │   mc msg send/list              │
              │   mc doc create/read            │
              └─────────────────────────────────┘
```

### 7.2 Tech Stack

| Layer | Technology | Rationale |
|-------|------------|-----------|
| **Database** | Supabase (PostgreSQL) | Hosted, real-time subscriptions, row-level security |
| **Dashboard** | Next.js + Bun | Fast, React-based, easy deployment |
| **Hosting** | Vercel | Zero-config, edge functions, fast |
| **Agent Runtime** | OpenClaw cron + sessions | Already working |
| **CLI** | TypeScript/Bun (`mc`) | Matches stack, fast to build |
| **Notifications** | Supabase realtime + daemon | @mentions delivered in seconds |
| **Auth** | Supabase Auth | Simple, secure |

### 7.3 Database Schema (Supabase)

```sql
-- Agents table
CREATE TABLE agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,           -- "iris", "forge", etc.
  role TEXT NOT NULL,                  -- "Email & Comms", "Code & PRs"
  status TEXT DEFAULT 'idle',          -- idle, active, blocked, paused, error
  current_task_id UUID REFERENCES tasks(id),
  session_key TEXT NOT NULL,           -- "agent:iris:main"
  soul_content TEXT,                   -- Full SOUL.md content
  skills JSONB,                        -- Array of available skills
  tools JSONB,                         -- Array of connections/integrations
  heartbeat_schedule TEXT,             -- "*/30 * * * *"
  last_heartbeat TIMESTAMPTZ,
  working_memory TEXT,                 -- WORKING.md content
  error_log TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tasks table
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'inbox',         -- inbox, assigned, in_progress, review, done, blocked
  priority TEXT DEFAULT 'p2',          -- p0, p1, p2, p3
  domain TEXT[],                       -- ['email', 'calendar']
  due_date TIMESTAMPTZ,
  created_by UUID REFERENCES agents(id),
  parent_task_id UUID REFERENCES tasks(id),
  blocked_by_id UUID REFERENCES tasks(id),
  result TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Task assignees (many-to-many)
CREATE TABLE task_assignees (
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  agent_id UUID REFERENCES agents(id) ON DELETE CASCADE,
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (task_id, agent_id)
);

-- Messages (comments on tasks)
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  from_agent_id UUID REFERENCES agents(id),
  content TEXT NOT NULL,
  attachments UUID[],                  -- Array of document IDs
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Activities (event log)
CREATE TABLE activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL,                  -- task_created, message_sent, agent_heartbeat, etc.
  agent_id UUID REFERENCES agents(id),
  task_id UUID REFERENCES tasks(id),
  message TEXT NOT NULL,               -- Human-readable description
  metadata JSONB,                      -- Additional context
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Documents (deliverables)
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,               -- Markdown
  type TEXT DEFAULT 'deliverable',     -- deliverable, research, protocol, notes
  task_id UUID REFERENCES tasks(id),
  created_by UUID REFERENCES agents(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notifications (@mentions)
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mentioned_agent_id UUID REFERENCES agents(id),
  message_id UUID REFERENCES messages(id),
  content TEXT NOT NULL,
  delivered BOOLEAN DEFAULT FALSE,
  delivered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Thread subscriptions
CREATE TABLE thread_subscriptions (
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  agent_id UUID REFERENCES agents(id) ON DELETE CASCADE,
  subscribed_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (task_id, agent_id)
);

-- Indexes for performance
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_priority ON tasks(priority);
CREATE INDEX idx_activities_created ON activities(created_at DESC);
CREATE INDEX idx_notifications_delivered ON notifications(delivered, mentioned_agent_id);
```

### 7.4 CLI Interface (`mc`)

```bash
# Task operations
mc task create --title "Review PR #123" --to forge --priority p1
mc task list --status pending --assignee iris
mc task update --id <uuid> --status in_progress
mc task complete --id <uuid> --result "Approved and merged"
mc task claim --domain code  # Agent claims next task in their domain
mc task block --id <uuid> --reason "Waiting for API access"

# Agent operations  
mc agent list                         # Show all agents
mc agent status iris                  # Detailed status for one agent
mc agent heartbeat                    # Record heartbeat (run by cron)
mc agent pause forge                  # Pause an agent
mc agent resume forge                 # Resume
mc agent config iris                  # View agent configuration

# Queue operations
mc queue stats                        # Task counts by status
mc queue pending                      # Show pending tasks
mc queue blocked                      # Show blocked tasks

# Messaging
mc msg send --task <uuid> --text "Here's my research..." 
mc msg send --task <uuid> --text "@klaus Need help with this"
mc msg list --task <uuid>

# Documents
mc doc create --title "Research Notes" --type research --task <uuid>
mc doc read --id <uuid>
mc doc attach --id <uuid> --to-task <uuid>

# Activity
mc activity list --limit 50
mc activity list --agent iris --limit 20

# Working memory
mc memory get                         # Show current WORKING.md
mc memory set "Working on PR review for TARA..."
```

---

## 8. UX Requirements

### 8.1 Dashboard Layout

```
┌─────────────────────────────────────────────────────────────────────┐
│  🤖 Mission Control                              [Matt] [Settings]  │
├────────────────┬────────────────────────────────────────────────────┤
│                │                                                     │
│  AGENT CARDS   │              TASK BOARD (Kanban)                   │
│  ────────────  │  ┌─────────┬──────────┬───────────┬────────┬─────┐ │
│  ┌──────────┐  │  │  Inbox  │ Assigned │In Progress│ Review │Done │ │
│  │ 🟢 Iris  │  │  │         │          │           │        │     │ │
│  │ Checking │  │  │ [Card]  │ [Card]   │ [Card]    │[Card]  │     │ │
│  │ email... │  │  │ [Card]  │ [Card]   │           │        │     │ │
│  └──────────┘  │  │         │          │           │        │     │ │
│  ┌──────────┐  │  └─────────┴──────────┴───────────┴────────┴─────┘ │
│  │ 🟡 Forge │  │                                                     │
│  │ Idle     │  │  DETAIL VIEW (when task selected)                  │
│  └──────────┘  │  ───────────────────────────────────────────────── │
│  ┌──────────┐  │  Title: Review TARA PR #142                        │
│  │ 🟢 Atlas │  │  Status: In Progress | Priority: P1 | @forge       │
│  │ Meeting  │  │  ─────────────────────────────────────────────     │
│  │ prep...  │  │  Description: Review the authentication changes... │
│  └──────────┘  │  ─────────────────────────────────────────────     │
│       ...      │  💬 Comments:                                       │
│                │  [Forge] Looking at it now...                       │
│                │  [Klaus] @forge ping when done                      │
├────────────────┼────────────────────────────────────────────────────┤
│                │                                                     │
│  ACTIVITY FEED │  DOCUMENT PANEL                                    │
│  ────────────  │  ───────────────                                   │
│  🟢 Iris       │  📄 TARA Auth Research                             │
│  checked email │  📄 Q4 Competitive Analysis                        │
│  (2 min ago)   │  📄 Singapore Itinerary                            │
│                │                                                     │
│  📝 Forge      │  [+ New Document]                                  │
│  commented on  │                                                     │
│  PR Review     │                                                     │
│  (5 min ago)   │                                                     │
│                │                                                     │
│  ✅ Atlas      │                                                     │
│  completed     │                                                     │
│  meeting prep  │                                                     │
│  (12 min ago)  │                                                     │
│                │                                                     │
└────────────────┴────────────────────────────────────────────────────┘
```

### 8.2 Agent Configuration View

```
┌─────────────────────────────────────────────────────────────────────┐
│  🤖 Agent: Iris                                        [Edit] [Back]│
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  STATUS: 🟢 Active        LAST HEARTBEAT: 2 min ago                │
│  SESSION KEY: agent:iris:main                                       │
│  HEARTBEAT: Every 30 minutes (*/30 * * * *)                        │
│                                                                     │
│  ─────────────────────────────────────────────────────────────────  │
│                                                                     │
│  📜 SOUL                                                            │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ # Iris — Email & Communications                             │   │
│  │                                                              │   │
│  │ You are Iris, the communications specialist. Your job is to │   │
│  │ triage Matt's inbox, draft responses, and flag urgent...    │   │
│  │                                                              │   │
│  │ ## Personality                                               │   │
│  │ - Clear, concise communicator                                │   │
│  │ - Protective of Matt's time                                  │   │
│  │ - Knows when to escalate vs. handle...                       │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  🛠️ SKILLS                                                         │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ • gog (Gmail, Calendar)                                      │   │
│  │ • supermemory (Long-term memory)                            │   │
│  │ • web_search, web_fetch                                      │   │
│  │ • exec (Shell commands)                                      │   │
│  │ • mc (Mission Control CLI)                                   │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  🔗 CONNECTIONS                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ • Gmail: matt@finitestate.io ✅                              │   │
│  │ • Gmail: matt.wyckhouse@gmail.com ✅                         │   │
│  │ • Calendar: Connected ✅                                     │   │
│  │ • Slack: Read-only ✅                                        │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  📝 WORKING MEMORY                                                  │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ ## Current Task                                              │   │
│  │ Reviewing inbox for urgent messages                          │   │
│  │                                                              │   │
│  │ ## Status                                                    │   │
│  │ Found 3 emails needing attention                            │   │
│  │                                                              │   │
│  │ ## Next Steps                                                │   │
│  │ 1. Draft response to investor email                          │   │
│  │ 2. Flag board meeting prep to Atlas                          │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 8.3 Human Interface (Matt)

**Primary Channels:**
1. **WhatsApp** — Urgent alerts, quick commands, daily digest
2. **Web Dashboard** — Full visibility, task management, configuration
3. **Telegram** — Secondary alerts

**Interaction Patterns:**
- Receive proactive alerts (urgent items, daily standup)
- Reply to assign/approve/reject
- Ask Klaus for status updates
- Quick commands: "pause forge", "what's iris working on"
- Access dashboard from any device

**Alert Thresholds:**
- 🔴 URGENT: Message immediately (WhatsApp)
- 🟡 ACTION: Include in daily standup
- ✅ FYI: Dashboard only, don't notify

### 8.4 Agent Interface

**Each agent has:**
- SOUL.md defining personality and role
- Access to `mc` CLI for all operations
- WORKING.md for current task state
- Ability to escalate via @klaus
- Structured output format for results

**Agent Heartbeat Flow:**
```
1. Wake up (cron fires)
2. Load context: mc memory get
3. Check notifications: mc msg list --mine --unread
4. Check task queue: mc task list --assignee self --status pending
5. Resume or claim work
6. Do work
7. Update task: mc task update --id X --status in_progress
8. Post comments: mc msg send --task X --text "Progress update..."
9. Complete if done: mc task complete --id X --result "..."
10. Update working memory: mc memory set "..."
11. Record heartbeat: mc agent heartbeat
12. If urgent, escalate: mc msg send --task X --text "@klaus Need help"
13. Sleep
```

---

## 9. Implementation Phases

### Phase 0: Infrastructure Setup (4 hours)
- [ ] Create Supabase project
- [ ] Set up database schema (all 6 tables)
- [ ] Configure row-level security
- [ ] Set up Next.js project with Bun
- [ ] Deploy to Vercel
- [ ] Basic auth setup

### Phase 1: Core CLI (6-8 hours)
- [ ] TypeScript/Bun package structure
- [ ] Supabase client wrapper
- [ ] `mc task create/list/update/complete/claim` commands
- [ ] `mc agent status/heartbeat/config` commands
- [ ] `mc msg send/list` commands
- [ ] `mc memory get/set` commands
- [ ] Install as global CLI tool

### Phase 2: Dashboard MVP (8-10 hours)
- [ ] Activity feed component (real-time via Supabase subscriptions)
- [ ] Task board (Kanban view)
- [ ] Agent cards with status
- [ ] Task detail view with comments
- [ ] Basic navigation and layout

### Phase 3: Agent Integration (4-6 hours)
- [ ] Update agent SOUL.md files to use `mc` CLI
- [ ] Add WORKING.md management to each agent
- [ ] Update heartbeat flow in all agents
- [ ] Seed agent data into Supabase
- [ ] Test task flow: create → claim → complete

### Phase 4: Agent Configuration UI (4 hours)
- [ ] Agent configuration view in dashboard
- [ ] Display SOUL, skills, tools
- [ ] Working memory viewer
- [ ] Heartbeat history

### Phase 5: Documents & Standup (4 hours)
- [ ] Document create/read in CLI
- [ ] Document panel in dashboard
- [ ] Daily standup generation
- [ ] WhatsApp delivery

### Phase 6: Notifications & Polish (4 hours)
- [ ] Notification daemon (polls every 2s)
- [ ] @mention parsing and delivery
- [ ] Thread subscriptions
- [ ] Error handling and logging

### Phase 7: Deployment & Resilience (4 hours)
- [ ] Document deployment process
- [ ] Set up remote OpenClaw server (optional)
- [ ] Health checks and monitoring
- [ ] Backup and recovery

**Total Estimated Time:** 38-48 hours

---

## 10. Success Criteria

### Launch Criteria (MVP)
- [ ] Dashboard shows real-time activity feed
- [ ] Task board works with full lifecycle
- [ ] Agent cards show live status
- [ ] Agent configuration is viewable
- [ ] All 11 agents successfully use task queue
- [ ] @mentions deliver within 5 seconds
- [ ] Daily standup generates and delivers

### Success Metrics (30 days post-launch)
| Metric | Target |
|--------|--------|
| Tasks completed/day | > 30 |
| Agent uptime | > 99% |
| Dashboard response time | < 500ms |
| False urgent alerts | < 2/week |
| Time to human response | < 15 min for urgent |
| Matt usage | Checks dashboard 3+/day |
| Matt satisfaction | "I can see everything" |

---

## 11. Open Questions

| # | Question | Options | Decision |
|---|----------|---------|----------|
| 1 | Auth provider? | Supabase Auth, Clerk, Auth0 | **Supabase Auth** |
| 2 | Who builds it? | Klaus, Forge via Ralph Loops, Manual | **TBD** |
| 3 | Cost limits per agent? | Hard cap, soft warning, none | **TBD** |
| 4 | Where to run OpenClaw? | Local, Railway, Fly.io, EC2 | **TBD** |
| 5 | Mobile app needed? | Responsive web, native app | **Responsive web first** |

---

## 12. Appendices

### A. Related Documents
- [Mission Control Full Squad](../research/mission-control-full-squad.md)
- [Agent SOUL.md Files](https://github.com/mattwyckhouse/klaus-workspace/tree/main/agents)
- [TASKS.md Current Format](https://github.com/mattwyckhouse/klaus-workspace/blob/main/TASKS.md)

### B. References
- [OpenClaw Documentation](https://docs.openclaw.ai)
- [Supabase Documentation](https://supabase.com/docs)
- [Next.js Documentation](https://nextjs.org/docs)
- [Ralph Loops](https://ralphloops.com)
- [pbteja1998 Mission Control Article](https://x.com/paborenstein/status/1885735516117729748)

### C. Glossary
- **Agent:** An AI specialist that runs in an isolated OpenClaw session
- **Heartbeat:** Periodic wake-up via cron job
- **Klaus:** The squad lead agent (main session)
- **Mission Control:** The overall orchestration system
- **Task:** A unit of work that can be assigned and tracked
- **WORKING.md:** An agent's current task state and next steps
- **Thread Subscription:** Auto-notifications for task comments

---

*Document Status: Draft v1.1 — Updated with full requirements*
