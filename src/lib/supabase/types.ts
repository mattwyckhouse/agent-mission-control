// Database types for Mission Control
// Auto-generated types should be updated via `supabase gen types typescript`

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type AgentStatus = 'online' | 'busy' | 'offline' | 'error'
export type TaskStatus = 'inbox' | 'assigned' | 'in_progress' | 'review' | 'done' | 'cancelled'
export type TaskPriority = 'urgent' | 'high' | 'medium' | 'low'
export type ActivityType = 'task_created' | 'task_updated' | 'task_completed' | 'agent_message' | 'human_message' | 'agent_status_change' | 'document_updated' | 'system_event'
export type NotificationPriority = 'low' | 'normal' | 'high' | 'urgent'

export interface Database {
  public: {
    Tables: {
      agents: {
        Row: {
          id: string
          name: string
          display_name: string
          emoji: string | null
          domain: string
          description: string | null
          soul_path: string | null
          skills: Json
          tools: Json
          status: AgentStatus
          session_key: string | null
          last_heartbeat: string | null
          current_task_id: string | null
          heartbeat_schedule: string | null
          heartbeat_interval_minutes: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          display_name: string
          emoji?: string | null
          domain: string
          description?: string | null
          soul_path?: string | null
          skills?: Json
          tools?: Json
          status?: AgentStatus
          session_key?: string | null
          last_heartbeat?: string | null
          current_task_id?: string | null
          heartbeat_schedule?: string | null
          heartbeat_interval_minutes?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          display_name?: string
          emoji?: string | null
          domain?: string
          description?: string | null
          soul_path?: string | null
          skills?: Json
          tools?: Json
          status?: AgentStatus
          session_key?: string | null
          last_heartbeat?: string | null
          current_task_id?: string | null
          heartbeat_schedule?: string | null
          heartbeat_interval_minutes?: number | null
          created_at?: string
          updated_at?: string
        }
      }
      tasks: {
        Row: {
          id: string
          title: string
          description: string | null
          status: TaskStatus
          priority: TaskPriority
          assigned_agent_id: string | null
          created_by: string | null
          parent_task_id: string | null
          context: Json
          tags: string[]
          due_date: string | null
          started_at: string | null
          completed_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          status?: TaskStatus
          priority?: TaskPriority
          assigned_agent_id?: string | null
          created_by?: string | null
          parent_task_id?: string | null
          context?: Json
          tags?: string[]
          due_date?: string | null
          started_at?: string | null
          completed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          status?: TaskStatus
          priority?: TaskPriority
          assigned_agent_id?: string | null
          created_by?: string | null
          parent_task_id?: string | null
          context?: Json
          tags?: string[]
          due_date?: string | null
          started_at?: string | null
          completed_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      messages: {
        Row: {
          id: string
          from_agent_id: string | null
          from_human: boolean
          to_agent_id: string | null
          to_human: boolean
          content: string
          message_type: string
          task_id: string | null
          thread_id: string | null
          metadata: Json
          created_at: string
        }
        Insert: {
          id?: string
          from_agent_id?: string | null
          from_human?: boolean
          to_agent_id?: string | null
          to_human?: boolean
          content: string
          message_type?: string
          task_id?: string | null
          thread_id?: string | null
          metadata?: Json
          created_at?: string
        }
        Update: {
          id?: string
          from_agent_id?: string | null
          from_human?: boolean
          to_agent_id?: string | null
          to_human?: boolean
          content?: string
          message_type?: string
          task_id?: string | null
          thread_id?: string | null
          metadata?: Json
          created_at?: string
        }
      }
      activities: {
        Row: {
          id: string
          activity_type: ActivityType
          title: string
          description: string | null
          agent_id: string | null
          task_id: string | null
          message_id: string | null
          metadata: Json
          created_at: string
        }
        Insert: {
          id?: string
          activity_type: ActivityType
          title: string
          description?: string | null
          agent_id?: string | null
          task_id?: string | null
          message_id?: string | null
          metadata?: Json
          created_at?: string
        }
        Update: {
          id?: string
          activity_type?: ActivityType
          title?: string
          description?: string | null
          agent_id?: string | null
          task_id?: string | null
          message_id?: string | null
          metadata?: Json
          created_at?: string
        }
      }
      documents: {
        Row: {
          id: string
          name: string
          path: string | null
          doc_type: string
          content: string | null
          content_hash: string | null
          agent_id: string | null
          task_id: string | null
          metadata: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          path?: string | null
          doc_type: string
          content?: string | null
          content_hash?: string | null
          agent_id?: string | null
          task_id?: string | null
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          path?: string | null
          doc_type?: string
          content?: string | null
          content_hash?: string | null
          agent_id?: string | null
          task_id?: string | null
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
      }
      notifications: {
        Row: {
          id: string
          title: string
          body: string | null
          priority: NotificationPriority
          for_human: boolean
          for_agent_id: string | null
          task_id: string | null
          activity_id: string | null
          read: boolean
          read_at: string | null
          dismissed: boolean
          metadata: Json
          created_at: string
        }
        Insert: {
          id?: string
          title: string
          body?: string | null
          priority?: NotificationPriority
          for_human?: boolean
          for_agent_id?: string | null
          task_id?: string | null
          activity_id?: string | null
          read?: boolean
          read_at?: string | null
          dismissed?: boolean
          metadata?: Json
          created_at?: string
        }
        Update: {
          id?: string
          title?: string
          body?: string | null
          priority?: NotificationPriority
          for_human?: boolean
          for_agent_id?: string | null
          task_id?: string | null
          activity_id?: string | null
          read?: boolean
          read_at?: string | null
          dismissed?: boolean
          metadata?: Json
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      agent_status: AgentStatus
      task_status: TaskStatus
      task_priority: TaskPriority
      activity_type: ActivityType
      notification_priority: NotificationPriority
    }
  }
}
