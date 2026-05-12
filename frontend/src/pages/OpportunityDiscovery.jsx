import Badge from '../components/ui/Badge'
import ProgressBar from '../components/ui/ProgressBar'
import { useOpportunities } from '../hooks/useOpportunities'

function fmt(n) {
  if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M`
  return `$${n.toLocaleString()}`
}

export default function OpportunityDiscovery() {
  const { opportunities, loading } = useOpportunities()

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-[36px] leading-[44px] tracking-tight font-bold text-on-surface">Opportunity Discovery</h1>
        <p className="text-on-surface-variant text-sm mt-1">Browse and evaluate capital deployment opportunities.</p>
      </div>

      {loading ? (
        <div className="text-on-surface-variant text-sm">Loading...</div>
      ) : (
        <div className="bg-white border border-outline-variant rounded-lg">
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
                      <button className={`material-symbols-outlined ${opp.flagged ? 'text-error' : 'text-primary hover:text-secondary'}`}>
                        {opp.flagged ? 'report' : 'open_in_new'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
