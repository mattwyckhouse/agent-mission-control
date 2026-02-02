-- Mission Control Initial Schema
-- Created: 2026-02-02
-- 
-- Tables:
-- 1. agents - Agent definitions and configuration
-- 2. tasks - Work items for agents and humans
-- 3. messages - Communication log between agents/human
-- 4. activities - Activity feed events
-- 5. documents - Shared documents and context files
-- 6. notifications - Alerts and notifications

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- ENUM TYPES
-- ============================================

CREATE TYPE agent_status AS ENUM ('online', 'busy', 'offline', 'error');
CREATE TYPE task_status AS ENUM ('inbox', 'assigned', 'in_progress', 'review', 'done', 'cancelled');
CREATE TYPE task_priority AS ENUM ('urgent', 'high', 'medium', 'low');
CREATE TYPE activity_type AS ENUM ('task_created', 'task_updated', 'task_completed', 'agent_message', 'human_message', 'agent_status_change', 'document_updated', 'system_event');
CREATE TYPE notification_priority AS ENUM ('low', 'normal', 'high', 'urgent');

-- ============================================
-- AGENTS TABLE
-- ============================================

CREATE TABLE agents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE,
    display_name VARCHAR(100) NOT NULL,
    emoji VARCHAR(10),
    domain VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- Configuration
    soul_path VARCHAR(500),  -- Path to SOUL.md
    skills JSONB DEFAULT '[]'::jsonb,  -- Array of skill names
    tools JSONB DEFAULT '[]'::jsonb,  -- Array of tool/connection configs
    
    -- Runtime state
    status agent_status DEFAULT 'offline',
    session_key VARCHAR(255),
    last_heartbeat TIMESTAMPTZ,
    current_task_id UUID,  -- FK added after tasks table
    
    -- Schedule
    heartbeat_schedule VARCHAR(100),  -- Cron expression
    heartbeat_interval_minutes INTEGER,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TASKS TABLE
-- ============================================

CREATE TABLE tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Core fields
    title VARCHAR(500) NOT NULL,
    description TEXT,
    status task_status DEFAULT 'inbox',
    priority task_priority DEFAULT 'medium',
    
    -- Ownership
    assigned_agent_id UUID REFERENCES agents(id) ON DELETE SET NULL,
    created_by VARCHAR(100),  -- 'human' or agent name
    
    -- Relationships
    parent_task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
    
    -- Context
    context JSONB DEFAULT '{}'::jsonb,  -- Flexible context data
    tags VARCHAR(100)[] DEFAULT '{}',
    
    -- Timing
    due_date TIMESTAMPTZ,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add FK from agents to tasks for current_task
ALTER TABLE agents 
ADD CONSTRAINT fk_agents_current_task 
FOREIGN KEY (current_task_id) REFERENCES tasks(id) ON DELETE SET NULL;

-- ============================================
-- MESSAGES TABLE
-- ============================================

CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Participants
    from_agent_id UUID REFERENCES agents(id) ON DELETE SET NULL,
    from_human BOOLEAN DEFAULT FALSE,
    to_agent_id UUID REFERENCES agents(id) ON DELETE SET NULL,
    to_human BOOLEAN DEFAULT FALSE,
    
    -- Content
    content TEXT NOT NULL,
    message_type VARCHAR(50) DEFAULT 'text',  -- text, command, status, error
    
    -- Context
    task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
    thread_id UUID,  -- For grouping related messages
    
    -- Metadata
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- ACTIVITIES TABLE
-- ============================================

CREATE TABLE activities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Event info
    activity_type activity_type NOT NULL,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    
    -- References
    agent_id UUID REFERENCES agents(id) ON DELETE SET NULL,
    task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
    message_id UUID REFERENCES messages(id) ON DELETE SET NULL,
    
    -- Additional context
    metadata JSONB DEFAULT '{}'::jsonb,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- DOCUMENTS TABLE
-- ============================================

CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Document info
    name VARCHAR(255) NOT NULL,
    path VARCHAR(500),  -- File path in workspace
    doc_type VARCHAR(50) NOT NULL,  -- soul, working, task, reference, etc.
    
    -- Content
    content TEXT,
    content_hash VARCHAR(64),  -- SHA-256 for change detection
    
    -- Ownership
    agent_id UUID REFERENCES agents(id) ON DELETE SET NULL,
    task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
    
    -- Metadata
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- NOTIFICATIONS TABLE
-- ============================================

CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Content
    title VARCHAR(255) NOT NULL,
    body TEXT,
    priority notification_priority DEFAULT 'normal',
    
    -- Target
    for_human BOOLEAN DEFAULT TRUE,
    for_agent_id UUID REFERENCES agents(id) ON DELETE CASCADE,
    
    -- References
    task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
    activity_id UUID REFERENCES activities(id) ON DELETE SET NULL,
    
    -- State
    read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMPTZ,
    dismissed BOOLEAN DEFAULT FALSE,
    
    -- Metadata
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================

-- Agents
CREATE INDEX idx_agents_status ON agents(status);
CREATE INDEX idx_agents_session_key ON agents(session_key);

-- Tasks
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_priority ON tasks(priority);
CREATE INDEX idx_tasks_assigned_agent ON tasks(assigned_agent_id);
CREATE INDEX idx_tasks_parent ON tasks(parent_task_id);
CREATE INDEX idx_tasks_created_at ON tasks(created_at DESC);
CREATE INDEX idx_tasks_due_date ON tasks(due_date);

-- Messages
CREATE INDEX idx_messages_from_agent ON messages(from_agent_id);
CREATE INDEX idx_messages_to_agent ON messages(to_agent_id);
CREATE INDEX idx_messages_task ON messages(task_id);
CREATE INDEX idx_messages_thread ON messages(thread_id);
CREATE INDEX idx_messages_created_at ON messages(created_at DESC);

-- Activities
CREATE INDEX idx_activities_type ON activities(activity_type);
CREATE INDEX idx_activities_agent ON activities(agent_id);
CREATE INDEX idx_activities_task ON activities(task_id);
CREATE INDEX idx_activities_created_at ON activities(created_at DESC);

-- Documents
CREATE INDEX idx_documents_agent ON documents(agent_id);
CREATE INDEX idx_documents_task ON documents(task_id);
CREATE INDEX idx_documents_type ON documents(doc_type);
CREATE INDEX idx_documents_path ON documents(path);

-- Notifications
CREATE INDEX idx_notifications_for_human ON notifications(for_human) WHERE NOT read;
CREATE INDEX idx_notifications_for_agent ON notifications(for_agent_id) WHERE NOT read;
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);

-- ============================================
-- UPDATED_AT TRIGGERS
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_agents_updated_at
    BEFORE UPDATE ON agents
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at
    BEFORE UPDATE ON tasks
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_documents_updated_at
    BEFORE UPDATE ON documents
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================
-- Note: RLS policies will be added in a separate migration
-- once auth is configured

-- Enable RLS on all tables (but allow all for now)
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Temporary permissive policies (to be replaced with proper auth)
CREATE POLICY "Allow all for agents" ON agents FOR ALL USING (true);
CREATE POLICY "Allow all for tasks" ON tasks FOR ALL USING (true);
CREATE POLICY "Allow all for messages" ON messages FOR ALL USING (true);
CREATE POLICY "Allow all for activities" ON activities FOR ALL USING (true);
CREATE POLICY "Allow all for documents" ON documents FOR ALL USING (true);
CREATE POLICY "Allow all for notifications" ON notifications FOR ALL USING (true);

-- ============================================
-- SEED DATA: Initial Agents
-- ============================================

INSERT INTO agents (name, display_name, emoji, domain, description, soul_path, heartbeat_schedule, status) VALUES
('klaus', 'Klaus', '🦔', 'Squad Lead', 'Main orchestrator and human interface', 'SOUL.md', NULL, 'online'),
('iris', 'Iris', '📬', 'Email & Comms', 'Email triage, drafting, and communication management', 'agents/iris/SOUL.md', '0,30 * * * *', 'offline'),
('atlas', 'Atlas', '📅', 'Calendar & Meetings', 'Calendar management, scheduling, and meeting prep', 'agents/atlas/SOUL.md', '5 * * * *', 'offline'),
('oracle', 'Oracle', '🔮', 'Intelligence & Research', 'Deep research, competitive intel, and market analysis', 'agents/oracle/SOUL.md', '20 */4 * * *', 'offline'),
('sentinel', 'Sentinel', '📊', 'Metrics & Alerts', 'KPI monitoring, dashboards, and anomaly detection', 'agents/sentinel/SOUL.md', '2 */2 * * *', 'offline'),
('herald', 'Herald', '📢', 'Content & Brand', 'Content creation, social media, and brand voice', 'agents/herald/SOUL.md', '25 */4 * * *', 'offline'),
('forge', 'Forge', '🔧', 'Code & PRs', 'Code review, PR management, and technical implementation', 'agents/forge/SOUL.md', '10,40 * * * *', 'offline'),
('aegis', 'Aegis', '🛡️', 'Testing & QA', 'Test automation, quality assurance, and bug tracking', 'agents/aegis/SOUL.md', '15 * * * *', 'offline'),
('codex', 'Codex', '📚', 'Docs & Knowledge', 'Documentation, knowledge base, and wiki management', 'agents/codex/SOUL.md', '35 */2 * * *', 'offline'),
('pixel', 'Pixel', '🎨', 'UX & Design', 'UI review, design systems, and accessibility', 'agents/pixel/SOUL.md', '55 */3 * * *', 'offline'),
('pathfinder', 'Pathfinder', '🧭', 'Travel & Logistics', 'Travel planning, bookings, and itinerary management', 'agents/pathfinder/SOUL.md', '45 9 * * *', 'offline'),
('curator', 'Curator', '🎁', 'Gifts & Occasions', 'Gift research, occasion tracking, and personal shopping', 'agents/curator/SOUL.md', '50 9 * * 1', 'offline'),
('steward', 'Steward', '🏠', 'Personal Admin', 'Bills, subscriptions, household management', 'agents/steward/SOUL.md', '55 7 * * *', 'offline');
