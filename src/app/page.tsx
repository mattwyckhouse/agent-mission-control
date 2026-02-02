import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/lib/supabase/types'

type Agent = Database['public']['Tables']['agents']['Row']

export const dynamic = 'force-dynamic'

export default async function Home() {
  const supabase = await createClient()
  
  const { data: agents, error } = await supabase
    .from('agents')
    .select('*')
    .order('name')
    .returns<Agent[]>()

  if (error) {
    return (
      <div className="min-h-screen bg-[#111214] text-white p-8">
        <h1 className="text-2xl font-bold text-red-500">Error loading agents</h1>
        <pre className="mt-4 text-sm text-gray-400">{error.message}</pre>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#111214] text-white">
      {/* Header */}
      <header className="border-b border-[#2F3236] px-6 py-4">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🎛️</span>
          <h1 className="text-xl font-semibold tracking-tight">Mission Control</h1>
          <span className="text-xs text-[#A8ACAF] bg-[#1B1D20] px-2 py-1 rounded-full">v0.1.0</span>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-6">
        <div className="max-w-6xl mx-auto">
          {/* Status Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <StatusCard 
              label="Total Agents" 
              value={agents?.length || 0}
              color="teal"
            />
            <StatusCard 
              label="Online" 
              value={agents?.filter(a => a.status === 'online').length || 0}
              color="green"
            />
            <StatusCard 
              label="Busy" 
              value={agents?.filter(a => a.status === 'busy').length || 0}
              color="yellow"
            />
            <StatusCard 
              label="Offline" 
              value={agents?.filter(a => a.status === 'offline').length || 0}
              color="gray"
            />
          </div>

          {/* Agent Grid */}
          <h2 className="text-lg font-medium text-[#E7E8E9] mb-4">Agent Squad</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {agents?.map((agent) => (
              <AgentCard key={agent.id} agent={agent} />
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}

function StatusCard({ label, value, color }: { label: string; value: number; color: string }) {
  const colorClasses: Record<string, string> = {
    teal: 'text-[#1BD0B8]',
    green: 'text-[#67AD5C]',
    yellow: 'text-[#F19D38]',
    gray: 'text-[#6F7479]',
  }

  return (
    <div className="bg-[#1B1D20] rounded-xl p-4 border border-[#2F3236]">
      <div className="text-sm text-[#A8ACAF] mb-1">{label}</div>
      <div className={`text-3xl font-bold ${colorClasses[color]}`}>{value}</div>
    </div>
  )
}

function AgentCard({ agent }: { agent: any }) {
  const statusColors: Record<string, { bg: string; glow: string }> = {
    online: { bg: 'bg-[#67AD5C]', glow: 'shadow-[0_0_8px_#67AD5C]' },
    busy: { bg: 'bg-[#F19D38]', glow: '' },
    offline: { bg: 'bg-[#6F7479]', glow: '' },
    error: { bg: 'bg-[#DE5E57]', glow: 'shadow-[0_0_8px_#DE5E57]' },
  }

  const status = statusColors[agent.status] || statusColors.offline

  return (
    <div className="bg-[#1B1D20]/80 backdrop-blur-lg rounded-xl p-4 border border-white/10 hover:border-[#1BD0B8]/30 transition-all">
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div className="relative">
          <div className="w-12 h-12 rounded-full bg-[#2F3236] flex items-center justify-center text-2xl">
            {agent.emoji || '🤖'}
          </div>
          <div 
            className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-[#1B1D20] ${status.bg} ${status.glow}`}
          />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="font-medium text-[#FAFAFB] truncate">{agent.display_name}</div>
          <div className="text-sm text-[#A8ACAF] truncate">{agent.domain}</div>
        </div>
      </div>

      {/* Status */}
      <div className="mt-3 flex items-center justify-between text-xs">
        <span className="text-[#6F7479] capitalize">{agent.status}</span>
        {agent.last_heartbeat && (
          <span className="text-[#6F7479]">
            {new Date(agent.last_heartbeat).toLocaleTimeString()}
          </span>
        )}
      </div>
    </div>
  )
}
