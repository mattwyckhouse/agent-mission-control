# Changelog

All notable changes to Mission Control will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## [Unreleased]

### Added

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
