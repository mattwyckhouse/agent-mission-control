# Changelog

All notable changes to Mission Control will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## [Unreleased]

### Added — Phase 3: Agent Actions & Task Management

#### Agent Controls (Steps 1-10)
- **Action types system** — Type-safe action definitions (1f3e588)
- **Agent control panel** — Start/stop/restart/message from agent detail (1f3e588)
- **ConfirmDialog component** — Accessible confirmation modal (4c258c2)
- **ActionToast component** — Success/error feedback (4c258c2)
- **BulkActions component** — Multi-agent operations (7a26333)
- **Agent actions API** — POST `/api/agents/[id]/actions` with history (37b25f1)

#### Task Management (Steps 11-20)
- **Task API routes** — Full CRUD with filtering (e8c515c)
- **TaskForm component** — Create/edit with validation (e8c515c)
- **TaskEditModal component** — Modal wrapper (9c3a39e)
- **AssigneeSelect component** — Agent assignment dropdown (7c9c9aa)
- **Task status transitions** — State machine with effects (6042106)
- **DraggableTaskCard** — HTML5 drag support (09083b3)
- **DroppableColumn** — Drop zone with validation (09083b3)
- **TaskKanban** — Complete Kanban board (09083b3)

#### Cost Analytics (Steps 21-30)
- **Cost API route** — GET `/api/costs` with aggregations (475f90d)
- **DateRangeFilter** — Presets + custom date selection (475f90d)
- **CostBudget component** — Budget tracking with alerts (70ad7b8)
- **AgentCostBreakdown** — Per-agent cost visualization (70ad7b8)
- **useCostsData hook** — Data fetching with filters (84f591a)

#### Notifications (Steps 26-27)
- **NotificationCenter** — Bell dropdown with list (e621cca)
- **useNotifications hook** — State management + persistence (e621cca)

#### Search & Settings (Steps 31-40)
- **CommandPalette** — ⌘K global search (75c1a08)
- **SettingsPanel** — Theme, notifications, budgets (351d1df)
- **Settings page** — Persisted to localStorage (351d1df)
- **useKeyboardShortcuts** — Global shortcut handler (7b4a871)
- **KeyboardShortcutsHelp** — ? modal (7b4a871)

#### Polish & Testing (Steps 41-48)
- **LoadingState** — Consistent loading indicators (7b4a871)
- **EmptyState** — Empty content placeholders (7b4a871)
- **ErrorBoundary** — Error catching with retry (956536f)
- **Tooltip** — Hover tooltips (956536f)
- **Formatters** — Date, number, text utilities (f3437a9)
- **222 unit tests** — Full coverage

#### Demo Data & Polish (Feb 3)
- **Playwright E2E tests** — Full test suite: dashboard, tasks, ralph, costs, navigation (dd2d3b5)
- **Agent performance variance** — Realistic varied metrics across agents (7c008d8)
- **Demo task seeding** — Realistic task data distribution (a66c7b9)
- **Real charts with varied data** — Dynamic chart data based on agent metrics (af19931)
- **Theme-aware Ralph components** — Consistent colors in light/dark mode (293ebb8)
- **Definition of Done** — Added to CLAUDE.md (888deef)

#### Integration & Performance (Feb 3 Evening)
- **OpenClaw webhook endpoint** — POST `/api/webhooks/openclaw` for real-time events from OpenClaw gateway (4b4adb7)
- **Server-side pagination for Messages** — Improved performance for message history (82bc002)

### Fixed

- Light mode theme compatibility for all components (cdfb3e1)

### Added — Phase 2: Real-Time & Sync

- **Real-time subscription hooks** — Live updates for dashboard data (dfeb5d9)
- **SyncStatus component** — Visual indicator for data freshness (cadbd1b)
- **ConnectionStatus component** — WebSocket connection indicator (cd1aa78)
- **RealTimeDashboard component** — Live-updating agent grid (cd1aa78)

### Added — Phase 1 (continued)

- **Theme toggle** — Light/dark mode switch with system preference detection (0d4336f)
- **Toast notification system** — Non-blocking alerts with auto-dismiss (0d4336f)
- **Skeleton components** — Loading states for cards, grids, metrics (0d4336f)
- **Accessibility improvements** — ARIA labels, keyboard navigation, focus management (0d4336f)
- **Design audit documentation** — Pixel design system compliance report (c73b1ee)
- **CLAUDE.md enhancements** — Next.js 16 patterns and component examples (a5187e1)
- **AgentCard navigation** — Click to navigate to agent detail page (1dfc040)
- **AgentGrid component** — Responsive grid layout for agent cards with auto-fill (c157c76)
- **MetricCard component** — Display key metrics with trend indicators (6bf7ec8)
- **Data layer** — TypeScript interfaces, mock data, and utility functions (238f6c1)
  - Agent, Task, RalphLoop, CostData types
  - Mock agents and metrics data
  - Formatting utilities
- **Layout components** (0ec8cc7)
  - `AppShell` — Main application wrapper with dark theme
  - `Header` — Top navigation with logo and profile
  - `MobileNav` — Responsive mobile navigation
  - `PageHeader` — Page title with actions
- **Card components**
  - `AgentCard` — Individual agent status display
  - `GlassCard` — Glassmorphic container component
- **UI primitives** (0ec8cc7)
  - `Button` — Primary actions
  - `IconButton` — Icon-only buttons
  - `ProgressBar` — Visual progress indicator
  - `StatusBadge` — Status pills (active/idle/error)
- **Design system** (3dc38e1)
  - Finite State brand tokens (teal #1BD0B8, orange #F27229)
  - Dark theme colors
  - shadcn/ui integration
  - Tailwind CSS configuration

### Fixed

- Theme switcher toggle behavior (8814c7a, efd6ea2)
- Proper font loading with next/font (d529859)
- Ralph Monitor now fetches from API correctly (e155509)
- Agent detail page uses Supabase instead of mock data (0ec38fd)
- OpenClaw sync service edge cases (cd76544)
- ProgressBar gradient and glow effect (431876c)
- TypeScript lint errors in AgentCard props (a9f9eca)
- Removed unused Moon import (a9f9eca)

## [0.1.0] - 2026-02-02

### Added

- Initial Next.js 16 setup with App Router (e881a62)
- Supabase integration with PostgreSQL database
- Database schema with 6 tables:
  - `agents` — Agent definitions and runtime state
  - `tasks` — Work items (Kanban board)
  - `messages` — Agent/human communication
  - `activities` — Activity feed events
  - `documents` — Shared documents
  - `notifications` — Alerts
- Row Level Security (RLS) policies
- Environment configuration for Vercel deployment
