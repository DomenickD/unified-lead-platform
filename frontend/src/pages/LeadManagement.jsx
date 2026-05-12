import { useState } from 'react'
import Badge from '../components/ui/Badge'
import { useLeads } from '../hooks/useLeads'

function fmt(n) {
  if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M`
  return `$${n.toLocaleString()}`
}

export default function LeadManagement() {
  const { leads, loading } = useLeads()
  const [search, setSearch] = useState('')

  const filtered = leads.filter((l) =>
    l.name.toLowerCase().includes(search.toLowerCase()) ||
    l.location.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-full">
      {/* Map area */}
      <div className="flex-1 bg-white border border-outline-variant rounded-lg overflow-hidden relative min-h-[500px]">
        {/* Legend overlay */}
        <div className="absolute top-4 left-4 z-10">
          <div className="bg-white/90 backdrop-blur-sm p-4 border border-outline-variant shadow-lg rounded-xl max-w-xs">
            <h2 className="text-[18px] font-semibold mb-2">Florida Market Analysis</h2>
            <p className="text-[13px] text-on-surface-variant mb-4">
              Tracking exclusive regional development zones and secondary resale opportunities.
            </p>
            <div className="space-y-2">
              {[
                { color: 'bg-secondary', label: 'Exclusive Zone', value: '42%' },
                { color: 'bg-primary', label: 'Resale Available', value: '18%' },
                { color: 'bg-error', label: 'Under Review', value: '40%', alert: true },
              ].map(({ color, label, value, alert }) => (
                <div key={label} className="flex items-center justify-between text-[13px]">
                  <span className="flex items-center gap-2">
                    <span className={`w-3 h-3 rounded-full ${color}`} />
                    {label}
                  </span>
                  <span className={`font-bold ${alert ? 'text-error' : ''}`}>{value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Map placeholder */}
        <div className="w-full h-full bg-surface-container flex items-center justify-center text-on-surface-variant">
          <div className="text-center">
            <span className="material-symbols-outlined text-[48px]">map</span>
            <p className="text-sm mt-2">Map integration placeholder</p>
          </div>
        </div>

        {/* Map controls */}
        <div className="absolute bottom-4 left-4 z-10">
          <div className="bg-white/80 backdrop-blur-sm border border-outline-variant rounded-lg p-2 flex gap-2 shadow-sm">
            {['Satellite', 'Topographic', 'Yield Heatmap'].map((view, i) => (
              <button
                key={view}
                className={`px-4 py-2 rounded text-[13px] transition-colors ${
                  i === 0
                    ? 'bg-surface-container-high font-bold border border-outline-variant'
                    : 'bg-white text-on-surface-variant hover:bg-surface-container-low'
                }`}
              >
                {view}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Leads sidebar */}
      <aside className="w-full lg:w-[400px] border border-outline-variant bg-surface rounded-lg flex flex-col">
        <div className="p-6 border-b border-outline-variant">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-semibold">My Leads</h2>
            <span className="material-symbols-outlined text-on-surface-variant cursor-pointer">filter_list</span>
          </div>
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-sm">
              search
            </span>
            <input
              className="w-full pl-10 pr-4 py-2 bg-surface-container-low border border-outline-variant rounded-lg text-sm focus:ring-1 focus:ring-primary focus:border-primary outline-none"
              placeholder="Search saved opportunities..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-6 text-on-surface-variant text-sm">Loading...</div>
          ) : (
            filtered.map((lead) => (
              <div key={lead.id} className="p-6 border-b border-outline-variant hover:bg-surface-container-low transition-colors cursor-pointer group">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="text-[18px] font-semibold group-hover:text-primary transition-colors">{lead.name}</h3>
                    <p className="text-[13px] text-on-surface-variant flex items-center gap-1">
                      <span className="material-symbols-outlined text-[16px]">location_on</span>
                      {lead.location} • Sector: {lead.sector}
                    </p>
                  </div>
                  <Badge label={lead.status} />
                </div>
                <div className="flex justify-between items-end mt-4">
                  <div className="space-y-1">
                    <p className="text-[11px] font-semibold tracking-widest uppercase text-on-surface-variant">Deal Size</p>
                    <p className="text-[14px] font-medium">{fmt(lead.deal_size)}</p>
                  </div>
                  <span className="material-symbols-outlined text-on-surface-variant">more_horiz</span>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="p-6 bg-surface-container-low">
          <button className="w-full py-4 border-2 border-dashed border-outline-variant rounded-xl text-on-surface-variant hover:border-primary hover:text-primary transition-all flex flex-col items-center justify-center gap-1">
            <span className="material-symbols-outlined">add</span>
            <span className="text-[11px] font-semibold tracking-widest uppercase">Add Manual Lead</span>
          </button>
        </div>
      </aside>
    </div>
  )
}
