# Changelog

All notable changes to Mission Control will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## [Unreleased]

### Added — Phase 3: Agent Actions & Task Management

- **Agent control panel** — Start/stop/trigger actions from agent detail page (1f3e588)
- **ConfirmDialog component** — Reusable confirmation modal with customizable actions (4c258c2)
- **ActionToast component** — Success/error feedback for agent actions (4c258c2)
- **BulkActions component** — Multi-select operations for agents (7a26333)
- **Task API routes** — CRUD endpoints for task management (e8c515c)
- **TaskForm component** — Create and edit tasks with validation (e8c515c)
- **TaskEditModal component** — Modal wrapper for task editing (9c3a39e)
- **AssigneeSelect component** — Agent assignment dropdown with search (7c9c9aa)
- **Task status transitions** — State machine for task workflow (6042106)
- **Agent actions API tests** — Full coverage for action endpoints (37b25f1)

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
