import { useState, useEffect } from 'react'
import Badge from '../components/ui/Badge'
import ProgressBar from '../components/ui/ProgressBar'
import { useOpportunities } from '../hooks/useOpportunities'
import { api } from '../api/client'

function fmt(n) {
  if (!n) return '$0'
  if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M`
  return `$${n.toLocaleString()}`
}

export default function OpportunityDiscovery() {
  const { opportunities, loading: oppLoading, refresh: refreshOpps } = useOpportunities()
  const [activeTab, setActiveTab] = useState('all') // 'all', 'real_estate', 'construction', 'grants'
  
  // Live feeds states
  const [permits, setPermits] = useState([])
  const [grants, setGrants] = useState([])
  const [feedLoading, setFeedLoading] = useState(false)
  const [notification, setNotification] = useState(null)

  // Fetch live construction permits when construction tab is opened
  useEffect(() => {
    if (activeTab === 'construction') {
      setFeedLoading(true)
      api.get('/construction-feeds/permits')
        .then(setPermits)
        .catch((err) => showNotification('error', `Failed to load construction feed: ${err.message}`))
        .finally(() => setFeedLoading(false))
    } else if (activeTab === 'grants') {
      setFeedLoading(true)
      api.get('/grants/')
        .then(setGrants)
        .catch((err) => showNotification('error', `Failed to load grants feed: ${err.message}`))
        .finally(() => setFeedLoading(false))
    }
  }, [activeTab])

  const showNotification = (type, message) => {
    setNotification({ type, message })
    setTimeout(() => setNotification(null), 5000)
  }

  // Import individual permit as a lead
  const handleImportPermit = async (permit) => {
    const payload = {
      name: `${permit.permit_type} permit — ${permit.permit_number}`,
      location: permit.address,
      sector: 'Construction',
      deal_size: permit.estimated_value || 150000,
      status: 'New',
      confidence: 0.75,
      latitude: permit.latitude,
      longitude: permit.longitude
    }
    try {
      await api.post('/leads/', payload)
      showNotification('success', `Imported permit ${permit.permit_number} as a lead successfully.`)
    } catch (err) {
      showNotification('error', `Failed to import permit: ${err.message}`)
    }
  }

  // Import individual grant as a lead
  const handleImportGrant = async (grant) => {
    const payload = {
      name: `${grant.title} — ${grant.agency.split(' (')[0]}`,
      location: grant.address,
      sector: 'Funding',
      deal_size: grant.funding_amount,
      status: 'New',
      confidence: 0.85,
      latitude: grant.latitude,
      longitude: grant.longitude
    }
    try {
      await api.post('/leads/', payload)
      showNotification('success', `Imported grant "${grant.title}" as a lead successfully.`)
    } catch (err) {
      showNotification('error', `Failed to import grant: ${err.message}`)
    }
  }

  // Bulk sync construction permits
  const handleSyncConstruction = async () => {
    setFeedLoading(true)
    try {
      const res = await api.post('/construction-feeds/sync')
      showNotification('success', `Synced ${res.leads_imported} new construction leads from permits feed!`)
    } catch (err) {
      showNotification('error', `Failed to sync construction leads: ${err.message}`)
    } finally {
      setFeedLoading(false)
    }
  }

  // Bulk sync grants
  const handleSyncGrants = async () => {
    setFeedLoading(true)
    try {
      const res = await api.post('/grants/sync')
      showNotification('success', `Synced ${res.leads_imported} new grants leads from federal/state feeds!`)
    } catch (err) {
      showNotification('error', `Failed to sync grants leads: ${err.message}`)
    } finally {
      setFeedLoading(false)
    }
  }

  const filteredOpps = opportunities.filter((o) => {
    if (activeTab === 'all') return true
    if (activeTab === 'real_estate') return o.sector === 'Real Estate'
    return false
  })

  return (
    <div>
      {/* Toast Notification Banner */}
      {notification && (
        <div className={`fixed bottom-5 right-5 z-50 p-4 rounded-xl shadow-2xl border transition-all duration-300 flex items-center gap-3 ${
          notification.type === 'success' 
            ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
            : 'bg-rose-50 border-rose-200 text-rose-800'
        }`}>
          <span className="material-symbols-outlined">
            {notification.type === 'success' ? 'check_circle' : 'error'}
          </span>
          <span className="text-sm font-semibold">{notification.message}</span>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
        <div>
          <h1 className="text-[36px] leading-[44px] tracking-tight font-bold text-on-surface">Opportunity Discovery</h1>
          <p className="text-on-surface-variant text-sm mt-1">Browse capital deployment opportunities and ingest live regional data feeds.</p>
        </div>

        {/* Bulk Sync Buttons depending on tab */}
        {activeTab === 'construction' && (
          <button
            onClick={handleSyncConstruction}
            disabled={feedLoading}
            className="bg-primary text-on-primary px-4 py-2.5 rounded-lg text-xs font-bold tracking-widest uppercase flex items-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-sm">sync</span>
            Sync Ingested Permits
          </button>
        )}
        {activeTab === 'grants' && (
          <button
            onClick={handleSyncGrants}
            disabled={feedLoading}
            className="bg-primary text-on-primary px-4 py-2.5 rounded-lg text-xs font-bold tracking-widest uppercase flex items-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-sm">sync</span>
            Sync Ingested Grants
          </button>
        )}
      </div>

      {/* Tab Selectors */}
      <div className="flex border-b border-outline-variant mb-6 overflow-x-auto">
        {[
          { id: 'all', label: 'All Opportunities', count: opportunities.length },
          { id: 'real_estate', label: 'Real Estate', count: opportunities.filter(o => o.sector === 'Real Estate').length },
          { id: 'construction', label: 'Construction Permits (Live)', count: 'Live Feed' },
          { id: 'grants', label: 'Grants & Funding (Live)', count: 'Live Feed' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-5 py-3 border-b-2 text-sm font-semibold whitespace-nowrap transition-all flex items-center gap-2 ${
              activeTab === tab.id
                ? 'border-primary text-primary font-bold'
                : 'border-transparent text-on-surface-variant hover:text-on-surface'
            }`}
          >
            {tab.label}
            <span className="text-[10px] bg-surface-container px-2 py-0.5 rounded-full font-bold text-on-surface-variant">
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Tables Area */}
      {oppLoading || (feedLoading && (activeTab === 'construction' || activeTab === 'grants')) ? (
        <div className="text-on-surface-variant text-sm flex items-center gap-2 py-8">
          <span className="material-symbols-outlined animate-spin text-primary">sync</span>
          Fetching records from Tampa open data portal...
        </div>
      ) : (
        <div className="bg-white border border-outline-variant rounded-xl overflow-hidden shadow-sm">
          
          {/* Static Opportunities Tab */}
          {(activeTab === 'all' || activeTab === 'real_estate') && (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-surface-container-low border-b border-outline-variant">
                    {['Asset / Opportunity', 'Valuation', 'Sector', 'Confidence', 'Status', 'Action'].map((h) => (
                      <th key={h} className="px-5 py-4.5 text-[11px] font-bold tracking-widest uppercase text-on-surface-variant">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="text-[14px] font-medium divide-y divide-outline-variant">
                  {filteredOpps.map((opp) => (
                    <tr key={opp.id} className="hover:bg-surface-container-low transition-colors h-14">
                      <td className={`px-5 py-4 font-bold ${opp.flagged ? 'text-error' : 'text-on-surface'}`}>
                        {opp.name}
                        {opp.flagged && <span className="text-[10px] ml-2 bg-error-container text-on-error-container font-bold px-2 py-0.5 rounded">Zoning Issue</span>}
                      </td>
                      <td className="px-5 py-4 font-bold text-on-surface">{fmt(opp.valuation)}</td>
                      <td className="px-5 py-4"><Badge label={opp.sector} /></td>
                      <td className="px-5 py-4 w-32">
                        <ProgressBar value={opp.confidence} variant={opp.flagged ? 'error' : 'secondary'} />
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-xs font-semibold text-on-surface-variant">Available</span>
                      </td>
                      <td className="px-5 py-4">
                        <button 
                          onClick={async () => {
                            const payload = {
                              name: opp.name,
                              location: opp.location || 'Tampa, FL',
                              sector: opp.sector,
                              deal_size: opp.valuation,
                              status: 'New',
                              confidence: opp.confidence,
                              latitude: opp.latitude,
                              longitude: opp.longitude
                            }
                            try {
                              await api.post('/leads/', payload)
                              showNotification('success', `Added "${opp.name}" to Lead Pipeline.`)
                            } catch (err) {
                              showNotification('error', `Failed: ${err.message}`)
                            }
                          }}
                          className={`material-symbols-outlined p-1.5 hover:bg-surface-container rounded-lg transition-colors ${
                            opp.flagged ? 'text-error hover:text-on-error-container' : 'text-primary hover:text-secondary'
                          }`}
                          title="Save to Leads"
                        >
                          save
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Construction Permits Tab */}
          {activeTab === 'construction' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-surface-container-low border-b border-outline-variant">
                    {['Permit Number', 'Permit Type / Address', 'Job Description', 'Estimated Value', 'Contractor', 'Actions'].map((h) => (
                      <th key={h} className="px-5 py-4.5 text-[11px] font-bold tracking-widest uppercase text-on-surface-variant">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="text-[14px] font-medium divide-y divide-outline-variant">
                  {permits.map((permit) => (
                    <tr key={permit.permit_number} className="hover:bg-surface-container-low transition-colors h-16">
                      <td className="px-5 py-4 font-bold text-primary">{permit.permit_number}</td>
                      <td className="px-5 py-4">
                        <div className="font-bold text-on-surface">{permit.permit_type}</div>
                        <div className="text-xs text-on-surface-variant flex items-center gap-0.5 mt-0.5">
                          <span className="material-symbols-outlined text-[14px]">location_on</span>
                          {permit.address}, {permit.city}, FL
                        </div>
                      </td>
                      <td className="px-5 py-4 text-xs font-semibold text-on-surface-variant max-w-xs truncate" title={permit.description}>
                        {permit.description || 'No description available.'}
                      </td>
                      <td className="px-5 py-4 font-bold text-on-surface">{fmt(permit.estimated_value)}</td>
                      <td className="px-5 py-4">
                        <div className="text-xs font-bold text-on-surface">{permit.contractor_name || 'N/A'}</div>
                        <div className="text-[10px] text-on-surface-variant">{permit.contractor_license || ''}</div>
                      </td>
                      <td className="px-5 py-4">
                        <button
                          onClick={() => handleImportPermit(permit)}
                          className="bg-primary/10 text-primary hover:bg-primary hover:text-on-primary text-xs font-bold py-1.5 px-3 rounded-lg transition-all"
                        >
                          Import
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Grants Tab */}
          {activeTab === 'grants' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-surface-container-low border-b border-outline-variant">
                    {['Agency / Source', 'Grant Opportunity', 'Eligibility & Scope', 'Funding Amount', 'Deadline', 'Actions'].map((h) => (
                      <th key={h} className="px-5 py-4.5 text-[11px] font-bold tracking-widest uppercase text-on-surface-variant">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="text-[14px] font-medium divide-y divide-outline-variant">
                  {grants.map((grant) => (
                    <tr key={grant.grant_id} className="hover:bg-surface-container-low transition-colors h-16">
                      <td className="px-5 py-4">
                        <div className="font-bold text-on-surface">{grant.agency}</div>
                        <div className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mt-0.5">ID: {grant.grant_id}</div>
                      </td>
                      <td className="px-5 py-4 max-w-xs">
                        <div className="font-bold text-primary leading-snug">{grant.title}</div>
                        <div className="text-xs text-on-surface-variant truncate mt-0.5">{grant.description}</div>
                      </td>
                      <td className="px-5 py-4 text-xs font-semibold text-on-surface-variant">
                        <div>{grant.eligibility}</div>
                        <div className="text-primary mt-0.5">{grant.category}</div>
                      </td>
                      <td className="px-5 py-4 font-bold text-emerald-600">{fmt(grant.funding_amount)}</td>
                      <td className="px-5 py-4 text-xs font-bold text-on-surface-variant">{grant.deadline}</td>
                      <td className="px-5 py-4">
                        <button
                          onClick={() => handleImportGrant(grant)}
                          className="bg-emerald-100 text-emerald-800 hover:bg-emerald-600 hover:text-white text-xs font-bold py-1.5 px-3 rounded-lg transition-all"
                        >
                          Import
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

        </div>
      )}
    </div>
  )
}
