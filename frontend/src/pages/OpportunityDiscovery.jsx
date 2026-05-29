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
  const [properties, setProperties] = useState([])
  const [reTypeFilter, setReTypeFilter] = useState('all')
  const [feedLoading, setFeedLoading] = useState(false)
  const [notification, setNotification] = useState(null)

  // Fetch live data when tab or real-estate sub-filter changes
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
    } else if (activeTab === 'real_estate_live') {
      setFeedLoading(true)
      api.get(`/real-estate/?type=${reTypeFilter}&limit=50`)
        .then(setProperties)
        .catch((err) => showNotification('error', `Failed to load real estate feed: ${err.message}`))
        .finally(() => setFeedLoading(false))
    }
  }, [activeTab, reTypeFilter])

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

  // Import individual property as a lead
  const handleImportProperty = async (prop) => {
    const sector = /commercial|industrial/i.test(prop.property_type) ? 'Commercial'
      : /multi/i.test(prop.property_type) ? 'Multi-family'
      : 'Real Estate'
    const payload = {
      name: `${prop.property_type} — ${prop.address}, ${prop.city}`,
      location: `${prop.address}, ${prop.city}, FL ${prop.zip || ''}`.trim(),
      sector,
      deal_size: prop.price || 0,
      status: 'New',
      confidence: 0.80,
      latitude: prop.latitude,
      longitude: prop.longitude,
    }
    try {
      await api.post('/leads/', payload)
      showNotification('success', `Imported "${prop.address}" as a lead.`)
    } catch (err) {
      showNotification('error', `Failed to import property: ${err.message}`)
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

  // Bulk sync real estate leads
  const handleSyncRealEstate = async () => {
    setFeedLoading(true)
    try {
      const res = await api.post(`/real-estate/sync?type=${reTypeFilter}`)
      showNotification('success', `Imported ${res.leads_imported} real estate leads!`)
    } catch (err) {
      showNotification('error', `Sync failed: ${err.message}`)
    } finally {
      setFeedLoading(false)
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
        {activeTab === 'real_estate_live' && (
          <button
            onClick={handleSyncRealEstate}
            disabled={feedLoading}
            className="bg-primary text-on-primary px-4 py-2.5 rounded-lg text-xs font-bold tracking-widest uppercase flex items-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-sm">sync</span>
            Sync to Lead Pipeline
          </button>
        )}
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
          { id: 'real_estate_live', label: 'Real Estate Feed (Live)', count: 'Live Feed' },
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
      {oppLoading || (feedLoading && (activeTab === 'construction' || activeTab === 'grants' || activeTab === 'real_estate_live')) ? (
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

          {/* Real Estate Live Feed Tab */}
          {activeTab === 'real_estate_live' && (
            <div>
              {/* Sub-filter pills */}
              <div className="flex gap-2 px-5 py-3 border-b border-outline-variant bg-surface-container-low">
                {[
                  { id: 'all', label: 'All' },
                  { id: 'listings', label: 'Active Listings' },
                  { id: 'foreclosures', label: 'Foreclosures / REO' },
                  { id: 'county', label: 'County Records' },
                ].map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setReTypeFilter(f.id)}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                      reTypeFilter === f.id
                        ? 'bg-primary text-on-primary'
                        : 'bg-surface-container text-on-surface-variant hover:bg-outline-variant'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
                <span className="ml-auto text-xs text-on-surface-variant self-center">
                  {properties.length} properties loaded
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-surface-container-low border-b border-outline-variant">
                      {['Property / Address', 'Price', 'Details', 'Status', 'Source', 'Actions'].map((h) => (
                        <th key={h} className="px-5 py-4 text-[11px] font-bold tracking-widest uppercase text-on-surface-variant">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="text-[14px] font-medium divide-y divide-outline-variant">
                    {properties.map((prop) => {
                      const statusColor = {
                        'Active Listing':    'bg-emerald-100 text-emerald-800',
                        'REO / Foreclosure': 'bg-rose-100 text-rose-800',
                        'County Record':     'bg-blue-100 text-blue-800',
                      }[prop.status] || 'bg-surface-container text-on-surface-variant'

                      const details = [
                        prop.beds ? `${prop.beds} bd` : null,
                        prop.baths ? `${prop.baths} ba` : null,
                        prop.sqft ? `${Number(prop.sqft).toLocaleString()} sqft` : null,
                        prop.year_built ? `Built ${prop.year_built}` : null,
                      ].filter(Boolean).join(' · ')

                      return (
                        <tr key={prop.property_id} className="hover:bg-surface-container-low transition-colors h-16">
                          <td className="px-5 py-3">
                            <div className="font-bold text-on-surface leading-snug">{prop.address}</div>
                            <div className="text-xs text-on-surface-variant mt-0.5 flex items-center gap-1">
                              <span className="material-symbols-outlined text-[13px]">location_on</span>
                              {prop.city}, FL {prop.zip}
                              {prop.case_number && <span className="ml-2 text-[10px] font-bold text-rose-600">Case: {prop.case_number}</span>}
                            </div>
                            <div className="text-[11px] font-semibold text-primary mt-0.5">{prop.property_type}</div>
                          </td>
                          <td className="px-5 py-3 font-bold text-on-surface whitespace-nowrap">
                            {prop.price ? fmt(prop.price) : '—'}
                            {prop.assessed_value && prop.assessed_value !== prop.price
                              ? <div className="text-[10px] text-on-surface-variant font-normal">Assessed: {fmt(prop.assessed_value)}</div>
                              : null}
                          </td>
                          <td className="px-5 py-3 text-xs text-on-surface-variant">
                            {details || '—'}
                            {prop.days_on_market ? <div className="text-[10px] mt-0.5">{prop.days_on_market} days on market</div> : null}
                            {prop.sale_date ? <div className="text-[10px] mt-0.5">Last sold: {prop.sale_date}</div> : null}
                          </td>
                          <td className="px-5 py-3">
                            <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${statusColor}`}>
                              {prop.status}
                            </span>
                          </td>
                          <td className="px-5 py-3">
                            {prop.source_url
                              ? <a href={prop.source_url} target="_blank" rel="noopener noreferrer"
                                  className="text-xs font-semibold text-primary hover:underline flex items-center gap-0.5">
                                  {prop.source}
                                  <span className="material-symbols-outlined text-[12px]">open_in_new</span>
                                </a>
                              : <span className="text-xs text-on-surface-variant">{prop.source}</span>
                            }
                          </td>
                          <td className="px-5 py-3">
                            <button
                              onClick={() => handleImportProperty(prop)}
                              className="bg-primary/10 text-primary hover:bg-primary hover:text-on-primary text-xs font-bold py-1.5 px-3 rounded-lg transition-all"
                            >
                              Import
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                    {properties.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-5 py-12 text-center text-on-surface-variant text-sm">
                          No properties found. Try a different filter.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
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
