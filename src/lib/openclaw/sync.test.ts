/**
 * Tests for OpenClaw Data Sync Service
 */

import { describe, it, expect } from 'vitest'
import {
  parseTasksMd,
  parseTaskItem,
  parsePendingTasksMd,
  parseAgentStatusTable,
  parseAgentReports,
  createSyncData,
  formatForSupabase,
  KNOWN_AGENTS,
} from './sync'

// ============================================================================
// Test Data
// ============================================================================

const SAMPLE_TASKS_MD = `# TASKS.md — Mission Control Task Board

## 🔴 URGENT
- [ ] **Critical Bug Fix** — @forge
  - Context: Production issue affecting users
  - Added: 2026-02-03

## 🟡 ACTION — Needs Matt's Input
- [ ] **Review New Agent Design** — @pixel
  - Context: Need approval on UX mockups

## 📋 IN PROGRESS
- [ ] **Build Dashboard Components** — @forge
  - Context: Phase 2 implementation
- [ ] **Email Integration** — @iris
  - Context: Gmail sync setup

## ✅ COMPLETED
- [x] **Setup Supabase Schema** — @forge
  - Added: 2026-02-01
- [x] **Create Design System** — @pixel

## 📊 SQUAD STATUS

| Agent | Domain | Last Heartbeat | Status |
|-------|--------|----------------|--------|
| Forge | Code | 02:30 AM | 🟢 |
| Iris | Email | 02:00 AM | 🟡 |
| Atlas | Calendar | 01:00 AM | 🔴 |

---

## 📝 AGENT REPORTS

#### Forge
*Last check: 2026-02-03 02:30*
- Completed step 15 of Phase 2
- Working on dashboard components
- No blockers

#### Iris
*Last check: 2026-02-03 02:00*
- Monitoring inbox
- 3 new emails since last check
`

const SAMPLE_PENDING_TASKS = `# PENDING_TASKS.md

## 🔄 In Progress

### Mission Control Phase 2 — Forge
**Owner:** Forge
**Started:** 2026-02-03 01:00
Building real-time dashboard with Supabase subscriptions.

### Email Sync Setup — Iris
**Owner:** Iris  
**Started:** 2026-02-03 00:30
Configuring Gmail API integration.

## ✅ Completed Today

### Design Audit — Pixel
**Owner:** Pixel
**Completed:** 2026-02-03 00:15
Completed UI audit with 12 findings.
`

// ============================================================================
// parseTasksMd Tests
// ============================================================================

describe('parseTasksMd', () => {
  it('parses all task sections from TASKS.md', () => {
    const result = parseTasksMd(SAMPLE_TASKS_MD)
    
    expect(result.urgent).toHaveLength(1)
    expect(result.action).toHaveLength(1)
    expect(result.inProgress).toHaveLength(2)
    expect(result.completed).toHaveLength(2)
  })

  it('extracts urgent tasks correctly', () => {
    const result = parseTasksMd(SAMPLE_TASKS_MD)
    expect(result.urgent[0]).toContain('Critical Bug Fix')
    expect(result.urgent[0]).toContain('@forge')
  })

  it('handles empty sections gracefully', () => {
    const emptyTasks = `# TASKS.md
    
## 🔴 URGENT

## 🟡 ACTION

## 📋 IN PROGRESS

## ✅ COMPLETED
`
    const result = parseTasksMd(emptyTasks)
    
    expect(result.urgent).toHaveLength(0)
    expect(result.action).toHaveLength(0)
    expect(result.inProgress).toHaveLength(0)
    expect(result.completed).toHaveLength(0)
  })

  it('handles missing sections', () => {
    const partialTasks = `# TASKS.md
    
## 🔴 URGENT
- [ ] **Only Urgent Task**
`
    const result = parseTasksMd(partialTasks)
    
    expect(result.urgent).toHaveLength(1)
    expect(result.action).toHaveLength(0)
    expect(result.inProgress).toHaveLength(0)
    expect(result.completed).toHaveLength(0)
  })
})

// ============================================================================
// parseTaskItem Tests
// ============================================================================

describe('parseTaskItem', () => {
  it('parses a basic task item', () => {
    const item = '- [ ] **Test Task** — @forge'
    const result = parseTaskItem(item, 'urgent')
    
    expect(result).not.toBeNull()
    expect(result!.title).toBe('Test Task')
    expect(result!.assignedAgentId).toBe('forge')
    expect(result!.status).toBe('inbox')
    expect(result!.priority).toBe('urgent')
  })

  it('parses completed task checkbox', () => {
    const item = '- [x] **Completed Task** — @pixel'
    const result = parseTaskItem(item, 'completed')
    
    expect(result!.status).toBe('done')
  })

  it('extracts context from indented lines', () => {
    const item = `- [ ] **Task With Context** — @iris
  - Context: Important context here
  - Added: 2026-02-03`
    const result = parseTaskItem(item, 'action')
    
    expect(result!.context).toHaveProperty('context')
    expect(result!.context).toHaveProperty('added')
  })

  it('returns null for invalid format', () => {
    const item = 'This is not a valid task format'
    const result = parseTaskItem(item, 'urgent')
    
    expect(result).toBeNull()
  })

  it('handles tasks without agent assignment', () => {
    const item = '- [ ] **Unassigned Task**'
    const result = parseTaskItem(item, 'action')
    
    expect(result!.title).toBe('Unassigned Task')
    expect(result!.assignedAgentId).toBeNull()
  })

  it('maps section to correct status', () => {
    const item = '- [ ] **Test** — @forge'
    
    expect(parseTaskItem(item, 'urgent')!.status).toBe('inbox')
    expect(parseTaskItem(item, 'action')!.status).toBe('assigned')
    expect(parseTaskItem(item, 'inProgress')!.status).toBe('in_progress')
    expect(parseTaskItem(item, 'completed')!.status).toBe('done')
  })

  it('generates deterministic IDs from titles', () => {
    const item = '- [ ] **Test Task** — @forge'
    const result1 = parseTaskItem(item, 'urgent')
    const result2 = parseTaskItem(item, 'urgent')
    
    expect(result1!.id).toBe(result2!.id)
    expect(result1!.id).toMatch(/^task-test-task/)
  })
})

// ============================================================================
// parsePendingTasksMd Tests
// ============================================================================

describe('parsePendingTasksMd', () => {
  it('parses in-progress tasks', () => {
    const result = parsePendingTasksMd(SAMPLE_PENDING_TASKS)
    const inProgress = result.filter(t => t.status === 'in_progress')
    
    expect(inProgress).toHaveLength(2)
    expect(inProgress[0].title).toBe('Mission Control Phase 2')
  })

  it('parses completed tasks', () => {
    const result = parsePendingTasksMd(SAMPLE_PENDING_TASKS)
    const completed = result.filter(t => t.status === 'done')
    
    expect(completed).toHaveLength(1)
    expect(completed[0].title).toBe('Design Audit')
  })

  it('extracts owner as assignedAgentId', () => {
    const result = parsePendingTasksMd(SAMPLE_PENDING_TASKS)
    const forgeTask = result.find(t => t.title === 'Mission Control Phase 2')
    
    expect(forgeTask!.assignedAgentId).toBe('forge')
  })

  it('adds async-task tag', () => {
    const result = parsePendingTasksMd(SAMPLE_PENDING_TASKS)
    
    expect(result[0].tags).toContain('async-task')
  })

  it('handles empty content', () => {
    const result = parsePendingTasksMd('')
    expect(result).toHaveLength(0)
  })
})

// ============================================================================
// parseAgentStatusTable Tests
// ============================================================================

describe('parseAgentStatusTable', () => {
  it('parses agent statuses from table', () => {
    const result = parseAgentStatusTable(SAMPLE_TASKS_MD)
    
    expect(result.size).toBe(3)
    expect(result.get('forge')).toEqual({ lastHeartbeat: '02:30 AM', status: 'online' })
    expect(result.get('iris')).toEqual({ lastHeartbeat: '02:00 AM', status: 'busy' })
    expect(result.get('atlas')).toEqual({ lastHeartbeat: '01:00 AM', status: 'error' })
  })

  it('handles missing table', () => {
    const result = parseAgentStatusTable('No table here')
    expect(result.size).toBe(0)
  })
})

// ============================================================================
// parseAgentReports Tests
// ============================================================================

describe('parseAgentReports', () => {
  it('parses agent report activities', () => {
    const result = parseAgentReports(SAMPLE_TASKS_MD)
    
    expect(result.length).toBeGreaterThan(0)
  })

  it('extracts agent ID from report header', () => {
    const result = parseAgentReports(SAMPLE_TASKS_MD)
    const forgeReport = result.find(a => a.agentId === 'forge')
    
    expect(forgeReport).toBeDefined()
    expect(forgeReport!.type).toBe('agent_status_change')
  })
})

// ============================================================================
// createSyncData Tests
// ============================================================================

describe('createSyncData', () => {
  it('creates complete sync data structure', () => {
    const agentStatuses = new Map([
      ['forge', { lastHeartbeat: '02:30 AM', status: 'online' as const }],
    ])
    
    const result = createSyncData(SAMPLE_TASKS_MD, SAMPLE_PENDING_TASKS, agentStatuses)
    
    expect(result).toHaveProperty('agents')
    expect(result).toHaveProperty('tasks')
    expect(result).toHaveProperty('activities')
    expect(result).toHaveProperty('syncedAt')
  })

  it('includes all known agents', () => {
    const result = createSyncData(SAMPLE_TASKS_MD, '', new Map())
    
    expect(result.agents).toHaveLength(KNOWN_AGENTS.length)
  })

  it('combines tasks from both sources', () => {
    const result = createSyncData(SAMPLE_TASKS_MD, SAMPLE_PENDING_TASKS, new Map())
    
    // 1 urgent + 1 action + 2 in progress + 2 completed + 3 pending = 9 total
    expect(result.tasks.length).toBeGreaterThan(5)
  })

  it('applies agent status to agents', () => {
    const agentStatuses = new Map([
      ['forge', { lastHeartbeat: '02:30 AM', status: 'online' as const }],
    ])
    
    const result = createSyncData(SAMPLE_TASKS_MD, '', agentStatuses)
    const forge = result.agents.find(a => a.id === 'forge')
    
    expect(forge!.status).toBe('online')
    expect(forge!.lastHeartbeat).toBe('02:30 AM')
  })
})

// ============================================================================
// formatForSupabase Tests
// ============================================================================

describe('formatForSupabase', () => {
  it('converts agent format to snake_case', () => {
    const syncData = createSyncData('', '', new Map())
    const result = formatForSupabase(syncData)
    
    expect(result.agents[0]).toHaveProperty('display_name')
    expect(result.agents[0]).toHaveProperty('soul_path')
    expect(result.agents[0]).toHaveProperty('session_key')
    expect(result.agents[0]).toHaveProperty('last_heartbeat')
    expect(result.agents[0]).toHaveProperty('current_task_id')
    expect(result.agents[0]).toHaveProperty('heartbeat_schedule')
    expect(result.agents[0]).toHaveProperty('heartbeat_interval_minutes')
  })

  it('converts task format to snake_case', () => {
    const syncData = createSyncData(SAMPLE_TASKS_MD, '', new Map())
    const result = formatForSupabase(syncData)
    
    expect(result.tasks[0]).toHaveProperty('assigned_agent_id')
    expect(result.tasks[0]).toHaveProperty('created_by')
    expect(result.tasks[0]).toHaveProperty('parent_task_id')
    expect(result.tasks[0]).toHaveProperty('due_date')
    expect(result.tasks[0]).toHaveProperty('started_at')
    expect(result.tasks[0]).toHaveProperty('completed_at')
  })

  it('converts activity format to snake_case', () => {
    const syncData = createSyncData(SAMPLE_TASKS_MD, '', new Map())
    const result = formatForSupabase(syncData)
    
    if (result.activities.length > 0) {
      expect(result.activities[0]).toHaveProperty('activity_type')
      expect(result.activities[0]).toHaveProperty('agent_id')
      expect(result.activities[0]).toHaveProperty('task_id')
      expect(result.activities[0]).toHaveProperty('message_id')
      expect(result.activities[0]).toHaveProperty('created_at')
    }
  })

  it('includes synced_at timestamp', () => {
    const syncData = createSyncData('', '', new Map())
    const result = formatForSupabase(syncData)
    
    expect(result).toHaveProperty('synced_at')
    expect(result.synced_at).toBe(syncData.syncedAt)
  })

  it('sets completed_at for done tasks', () => {
    const syncData = createSyncData(SAMPLE_TASKS_MD, '', new Map())
    const result = formatForSupabase(syncData)
    
    const doneTasks = result.tasks.filter(t => t.status === 'done')
    for (const task of doneTasks) {
      expect(task.completed_at).not.toBeNull()
    }
  })
})

// ============================================================================
// KNOWN_AGENTS Tests
// ============================================================================

describe('KNOWN_AGENTS', () => {
  it('contains all expected agents', () => {
    const agentIds = KNOWN_AGENTS.map(a => a.id)
    
    expect(agentIds).toContain('klaus')
    expect(agentIds).toContain('forge')
    expect(agentIds).toContain('iris')
    expect(agentIds).toContain('pixel')
  })

  it('all agents have required fields', () => {
    for (const agent of KNOWN_AGENTS) {
      expect(agent).toHaveProperty('id')
      expect(agent).toHaveProperty('name')
      expect(agent).toHaveProperty('displayName')
      expect(agent).toHaveProperty('emoji')
      expect(agent).toHaveProperty('domain')
    }
  })
})
