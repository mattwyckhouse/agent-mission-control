# Mission Control

Multi-agent orchestration dashboard for managing AI agent squads.

## Tech Stack

- **Framework:** Next.js 16 with App Router
- **Database:** Supabase (PostgreSQL)
- **Styling:** Tailwind CSS
- **Deployment:** Vercel

## Getting Started

### Prerequisites

- Node.js 20+
- npm or bun

### Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/mattwyckhouse/agent-mission-control.git
   cd agent-mission-control
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.local.example .env.local
   ```
   Fill in your Supabase credentials.

4. Run the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000)

## Database

### Schema

The database includes 6 main tables:

- **agents** - Agent definitions and runtime state
- **tasks** - Work items (Kanban board)
- **messages** - Communication between agents/human
- **activities** - Activity feed events
- **documents** - Shared documents and context
- **notifications** - Alerts and notifications

### Migrations

Migrations are stored in `supabase/migrations/`. To apply:

```bash
# With Supabase CLI (requires login)
supabase db push

# Or via script
node scripts/run-migration.mjs
```

## Project Structure

```
├── src/
│   ├── app/              # Next.js App Router
│   │   ├── page.tsx      # Dashboard home
│   │   ├── layout.tsx    # Root layout
│   │   └── globals.css   # Global styles
│   ├── components/
│   │   ├── cards/        # Card components
│   │   │   ├── AgentCard.tsx
│   │   │   ├── AgentGrid.tsx
│   │   │   ├── GlassCard.tsx
│   │   │   └── MetricCard.tsx
│   │   ├── layout/       # Layout components
│   │   │   ├── AppShell.tsx
│   │   │   ├── Header.tsx
│   │   │   ├── MobileNav.tsx
│   │   │   └── PageHeader.tsx
│   │   └── ui/           # UI primitives
│   │       ├── Button.tsx
│   │       ├── IconButton.tsx
│   │       ├── ProgressBar.tsx
│   │       └── StatusBadge.tsx
│   ├── lib/
│   │   ├── supabase/     # Supabase client & types
│   │   └── utils/        # Utility functions
│   └── types/            # TypeScript interfaces
├── supabase/
│   └── migrations/       # Database migrations
├── docs/
│   └── PRD.md           # Product Requirements
└── public/              # Static assets
```

## Design System

Using Finite State Marketing design tokens:

- **Dark Background:** #111214
- **Elevated Surface:** #1B1D20
- **Brand Teal:** #1BD0B8
- **Brand Orange:** #F27229

## Deployment

Pushes to `main` automatically deploy to Vercel.

## License

Private - Finite State
