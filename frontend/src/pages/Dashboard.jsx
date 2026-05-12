import MetricCard from '../components/ui/MetricCard'
import Badge from '../components/ui/Badge'
import ProgressBar from '../components/ui/ProgressBar'
import { useDashboard } from '../hooks/useDashboard'
import { useOpportunities } from '../hooks/useOpportunities'

function fmt(n) {
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`
  if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M`
  return `$${n.toLocaleString()}`
}

export default function Dashboard() {
  const { metrics, regions, pipelines, loading: dashLoading } = useDashboard()
  const { opportunities, loading: oppLoading } = useOpportunities()

  if (dashLoading || oppLoading) {
    return <div className="text-on-surface-variant text-sm">Loading...</div>
  }

  return (
    <div>
      {/* Page header */}
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-[36px] leading-[44px] tracking-tight font-bold text-on-surface">Opportunity Dashboard</h1>
          <p className="text-on-surface-variant text-sm mt-1">Cross-sector capital allocation and active pipeline tracking.</p>
        </div>
        <div className="flex gap-2">
          <button className="bg-white border border-outline-variant px-4 py-2 text-[13px] font-semibold rounded flex items-center gap-2 hover:bg-surface-container-low transition-colors">
            <span className="material-symbols-outlined text-[18px]">filter_list</span>
            Filter Views
          </button>
          <button className="bg-white border border-outline-variant px-4 py-2 text-[13px] font-semibold rounded flex items-center gap-2 hover:bg-surface-container-low transition-colors">
            <span className="material-symbols-outlined text-[18px]">download</span>
            Export PDF
          </button>
        </div>
      </div>

      {/* Key Metrics Strip */}
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <MetricCard
            label="Total Active Leads"
            value={metrics.total_active_leads.toLocaleString()}
            sub="+12.5% vs LW"
            icon="trending_up"
          />
          <MetricCard
            label="Funding Volume"
            value={fmt(metrics.funding_volume)}
            sub={`Institutional Cap: ${fmt(metrics.funding_capacity)}`}
            icon="payments"
          />
          <MetricCard
            label="Florida Exclusivity"
            value={metrics.florida_exclusivity_active ? 'Active' : 'Inactive'}
            sub={`${metrics.florida_geo_coverage}% Geo-coverage`}
            icon="verified"
          />
          <MetricCard
            label="Avg. Deal Velocity"
            value={`${metrics.avg_deal_velocity_days} Days`}
            sub={`${metrics.deal_velocity_delta} Days delay`}
            icon="speed"
            variant="alert"
          />
        </div>
      )}

      {/* Bento Grid */}
      <div className="grid grid-cols-12 gap-4">
        {/* Opportunities Table */}
        <div className="col-span-12 lg:col-span-8 bg-white border border-outline-variant rounded-lg flex flex-col">
          <div className="p-4 border-b border-outline-variant flex justify-between items-center">
            <h3 className="text-[18px] font-semibold">Recent Opportunities</h3>
            <button className="text-primary text-[11px] font-semibold tracking-widest uppercase hover:underline">
              View All Leads
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-surface-container-low">
                  {['Asset / Opportunity', 'Valuation', 'Sector', 'Confidence', 'Action'].map((h) => (
                    <th key={h} className="px-4 py-3 text-[11px] font-semibold tracking-widest uppercase text-on-surface-variant border-b border-outline-variant">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="text-[14px] font-medium">
                {opportunities.map((opp) => (
                  <tr key={opp.id} className="border-b border-outline-variant hover:bg-surface-container-low transition-colors h-12">
                    <td className={`px-4 py-3 font-semibold ${opp.flagged ? 'text-error' : ''}`}>{opp.name}</td>
                    <td className="px-4 py-3 text-right">{fmt(opp.valuation)}</td>
                    <td className="px-4 py-3"><Badge label={opp.sector} /></td>
                    <td className="px-4 py-3 w-32">
                      <ProgressBar value={opp.confidence} variant={opp.flagged ? 'error' : 'secondary'} />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button className={`material-symbols-outlined ${opp.flagged ? 'text-error hover:text-on-error-container' : 'text-primary hover:text-secondary'}`}>
                        {opp.flagged ? 'report' : 'open_in_new'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Trending Regions */}
        <div className="col-span-12 lg:col-span-4 flex flex-col gap-4">
          <div className="bg-white border border-outline-variant rounded-lg p-4 flex-1">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-[18px] font-semibold">Trending Regions</h3>
              <span className="material-symbols-outlined text-on-surface-variant">map</span>
            </div>
            <div className="space-y-4">
              {regions.map((r) => (
                <div key={r.region} className={`flex items-center justify-between ${r.change_pct < 0 ? 'bg-error-container/20 p-1 rounded' : ''}`}>
                  <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-[12px] ${r.change_pct < 0 ? 'bg-error text-white' : 'bg-surface-container text-primary'}`}>
                      {r.state}
                    </div>
                    <span className={`text-[13px] font-semibold ${r.change_pct < 0 ? 'text-error' : ''}`}>{r.region}</span>
                  </div>
                  <span className={`font-bold text-[13px] ${r.change_pct < 0 ? 'text-error' : 'text-secondary'}`}>
                    {r.change_pct > 0 ? '+' : ''}{r.change_pct}%
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-6 h-32 bg-surface-container rounded-lg flex items-center justify-center text-on-surface-variant text-sm border border-outline-variant">
              Map placeholder
            </div>
          </div>

          {/* Macro Signal Card */}
          <div className="bg-primary-container text-on-primary-container p-4 rounded-lg border border-primary">
            <div className="flex items-center gap-2 mb-2">
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>insights</span>
              <span className="text-[11px] font-semibold tracking-widest uppercase">Macro Signal</span>
            </div>
            <p className="text-[16px] font-bold leading-tight">
              Construction costs in Florida expected to plateau by Q3 2024.
            </p>
            <p className="text-[12px] opacity-70 mt-2">
              Based on current commodity futures and regional logistics throughput.
            </p>
            <button className="mt-4 w-full py-2 bg-on-primary-container text-primary text-[11px] font-semibold tracking-widest uppercase rounded hover:opacity-90 transition-opacity">
              Read Full Briefing
            </button>
          </div>
        </div>
      </div>

      {/* Sector Pipelines */}
      <div className="grid grid-cols-3 gap-4 mt-4">
        {pipelines.map((p) => {
          const remaining = p.total * (1 - p.allocated_pct / 100)
          return (
            <div key={p.sector} className="bg-white border border-outline-variant p-4 rounded-lg">
              <div className="text-on-surface-variant text-[11px] font-semibold tracking-widest uppercase mb-1">
                {p.sector.toUpperCase()} PIPELINE
              </div>
              <div className="text-[20px] font-bold">{fmt(p.total)}</div>
              <div className="mt-4 h-2 bg-surface-container rounded-full overflow-hidden">
                <div className="bg-secondary h-full" style={{ width: `${p.allocated_pct}%` }} />
              </div>
              <div className="flex justify-between mt-2 text-[11px] font-semibold text-on-surface-variant">
                <span>ALLOCATED: {p.allocated_pct}%</span>
                <span>REMAINING: {fmt(remaining)}</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
