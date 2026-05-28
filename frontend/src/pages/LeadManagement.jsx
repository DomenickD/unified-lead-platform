import { useState, useEffect, useRef } from 'react'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import Badge from '../components/ui/Badge'
import { useLeads } from '../hooks/useLeads'
import { leadsApi } from '../api/leads'

function fmt(n) {
  if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M`
  return `$${n.toLocaleString()}`
}

export default function LeadManagement() {
  const { leads, loading, refresh } = useLeads()
  const [search, setSearch] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [selectedLead, setSelectedLead] = useState(null)
  
  // New Lead form state
  const [form, setForm] = useState({
    name: '',
    location: '',
    sector: 'Commercial',
    deal_size: '',
    status: 'New',
    confidence: '0.80',
    latitude: '',
    longitude: ''
  })

  // Map state
  const mapContainer = useRef(null)
  const map = useRef(null)
  const [mapStyle, setMapStyle] = useState('https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json')
  const markersRef = useRef([])

  const filtered = leads.filter((l) =>
    l.name.toLowerCase().includes(search.toLowerCase()) ||
    l.location.toLowerCase().includes(search.toLowerCase())
  )

  // Initialize Map
  useEffect(() => {
    if (!mapContainer.current || loading) return

    try {
      map.current = new maplibregl.Map({
        container: mapContainer.current,
        style: mapStyle,
        center: [-82.4572, 27.9506], // Center on Tampa
        zoom: 11,
      })

      map.current.addControl(new maplibregl.NavigationControl(), 'top-right')

      return () => {
        if (map.current) {
          map.current.remove()
        }
      }
    } catch (e) {
      console.error('Error loading MapLibre:', e)
    }
  }, [loading])

  // Update map style
  useEffect(() => {
    if (map.current) {
      try {
        map.current.setStyle(mapStyle)
      } catch (e) {
        console.error(e)
      }
    }
  }, [mapStyle])

  // Draw markers
  useEffect(() => {
    if (!map.current || loading) return

    // Clear old markers
    markersRef.current.forEach((m) => m.remove())
    markersRef.current = []

    filtered.forEach((lead) => {
      const lat = lead.latitude || 27.9506
      const lng = lead.longitude || -82.4572

      // Create custom marker DOM element
      const el = document.createElement('div')
      el.className = 'lead-marker'
      el.style.backgroundColor = selectedLead?.id === lead.id ? '#1e40af' : '#10b981'
      el.style.width = selectedLead?.id === lead.id ? '18px' : '14px'
      el.style.height = selectedLead?.id === lead.id ? '18px' : '14px'
      el.style.borderRadius = '50%'
      el.style.border = '2px solid white'
      el.style.cursor = 'pointer'
      el.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)'
      el.style.transition = 'all 0.2s ease-in-out'

      const marker = new maplibregl.Marker(el)
        .setLngLat([lng, lat])
        .addTo(map.current)

      el.addEventListener('click', () => {
        handleSelectLead(lead)
      })

      markersRef.current.push(marker)
    })
  }, [filtered, loading, selectedLead])

  const handleSelectLead = (lead) => {
    setSelectedLead(lead)
    if (map.current && lead.latitude && lead.longitude) {
      map.current.flyTo({
        center: [lead.longitude, lead.latitude],
        zoom: 13,
        essential: true
      })
    }
  }

  const handleDeleteLead = async (e, id, name) => {
    e.stopPropagation()
    if (window.confirm(`Are you sure you want to delete lead "${name}"?`)) {
      try {
        await leadsApi.remove(id)
        if (selectedLead?.id === id) {
          setSelectedLead(null)
        }
        refresh()
      } catch (err) {
        alert('Failed to delete lead: ' + err.message)
      }
    }
  }

  const handleCreateLead = async (e) => {
    e.preventDefault()

    // Assign a random coordinate around Tampa if not provided
    const lat = form.latitude ? parseFloat(form.latitude) : 27.92 + Math.random() * 0.08
    const lng = form.longitude ? parseFloat(form.longitude) : -82.48 + Math.random() * 0.08

    const payload = {
      name: form.name,
      location: form.location,
      sector: form.sector,
      deal_size: parseFloat(form.deal_size),
      status: form.status,
      confidence: parseFloat(form.confidence),
      latitude: lat,
      longitude: lng
    }

    try {
      await leadsApi.create(payload)
      setShowAddModal(false)
      setForm({
        name: '',
        location: '',
        sector: 'Commercial',
        deal_size: '',
        status: 'New',
        confidence: '0.80',
        latitude: '',
        longitude: ''
      })
      refresh()
    } catch (err) {
      alert('Failed to create lead: ' + err.message)
    }
  }

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-140px)]">
      {/* Map area */}
      <div className="flex-1 bg-white border border-outline-variant rounded-lg overflow-hidden relative min-h-[400px] h-full shadow-sm">
        
        {/* Legend overlay */}
        <div className="absolute top-4 left-4 z-10 pointer-events-none">
          <div className="bg-white/90 backdrop-blur-sm p-4 border border-outline-variant shadow-lg rounded-xl max-w-xs pointer-events-auto">
            <h2 className="text-[18px] font-semibold mb-2">Tampa Market Leads</h2>
            <p className="text-[13px] text-on-surface-variant mb-4 font-medium">
              Tracking exclusive regional development zones and active pipeline deals.
            </p>
            <div className="space-y-2">
              {[
                { color: 'bg-[#10b981]', label: 'Active Leads', value: `${filtered.length}` },
                { color: 'bg-primary', label: 'Exclusive Zone', value: '42%' },
                { color: 'bg-error', label: 'Under Review', value: '33%', alert: true },
              ].map(({ color, label, value, alert }) => (
                <div key={label} className="flex items-center justify-between text-[13px] font-semibold text-on-surface-variant">
                  <span className="flex items-center gap-2">
                    <span className={`w-3.5 h-3.5 rounded-full ${color} border border-white/50`} />
                    {label}
                  </span>
                  <span className={`font-bold ${alert ? 'text-error' : 'text-on-surface'}`}>{value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Mapbox container */}
        <div ref={mapContainer} className="w-full h-full bg-surface-container" />

        {/* Map controls */}
        <div className="absolute bottom-4 left-4 z-10">
          <div className="bg-white/90 backdrop-blur-sm border border-outline-variant rounded-xl p-1.5 flex gap-1 shadow-md">
            {[
              { id: 'streets', label: 'Streets', style: 'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json' },
              { id: 'satellite', label: 'Satellite', style: {
                version: 8,
                sources: {
                  'esri-satellite': {
                    type: 'raster',
                    tiles: ['https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'],
                    tileSize: 256
                  }
                },
                layers: [{ id: 'sat', type: 'raster', source: 'esri-satellite' }]
              }},
              { id: 'outdoors', label: 'Topographic', style: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json' },
            ].map((view) => (
              <button
                key={view.id}
                onClick={() => setMapStyle(view.style)}
                className={`px-4 py-2 rounded-lg text-[13px] font-bold transition-all ${
                  (typeof mapStyle === 'string' && mapStyle === view.style) || (typeof mapStyle === 'object' && view.id === 'satellite')
                    ? 'bg-primary text-on-primary shadow-sm'
                    : 'bg-transparent text-on-surface-variant hover:bg-surface-container-low'
                }`}
              >
                {view.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Leads sidebar */}
      <aside className="w-full lg:w-[400px] border border-outline-variant bg-white rounded-lg flex flex-col h-full shadow-sm shrink-0">
        
        {/* Search Header */}
        <div className="p-6 border-b border-outline-variant">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-semibold">My Leads</h2>
            <button className="material-symbols-outlined text-on-surface-variant hover:text-primary transition-colors p-1.5 hover:bg-surface-container-low rounded-lg">
              filter_list
            </button>
          </div>
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-base">
              search
            </span>
            <input
              className="w-full pl-10 pr-4 py-2 bg-surface-container-low border border-outline-variant rounded-lg text-sm focus:ring-1 focus:ring-primary outline-none"
              placeholder="Search saved leads..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Leads Scroll Area */}
        <div className="flex-1 overflow-y-auto min-h-0 divide-y divide-outline-variant">
          {loading ? (
            <div className="p-6 text-on-surface-variant text-sm flex items-center gap-2">
              <span className="material-symbols-outlined animate-spin">sync</span>
              Loading leads...
            </div>
          ) : filtered.length > 0 ? (
            filtered.map((lead) => (
              <div
                key={lead.id}
                onClick={() => handleSelectLead(lead)}
                className={`p-5 hover:bg-surface-container-low transition-colors cursor-pointer group flex flex-col justify-between ${
                  selectedLead?.id === lead.id ? 'bg-primary-container/20 border-l-4 border-primary' : ''
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1 min-w-0 pr-2">
                    <h3 className="text-[17px] font-bold group-hover:text-primary transition-colors truncate">
                      {lead.name}
                    </h3>
                    <p className="text-[13px] text-on-surface-variant flex items-center gap-1 mt-1 font-medium truncate">
                      <span className="material-symbols-outlined text-[15px]">location_on</span>
                      {lead.location}
                    </p>
                  </div>
                  <Badge label={lead.status} />
                </div>

                <div className="flex justify-between items-end mt-4">
                  <div className="space-y-0.5">
                    <p className="text-[10px] font-bold tracking-wider uppercase text-on-surface-variant">Deal Size</p>
                    <p className="text-[15px] font-bold text-on-surface">{fmt(lead.deal_size)}</p>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold text-on-surface-variant bg-surface-container px-2 py-0.5 rounded">
                      {lead.sector}
                    </span>
                    <button
                      onClick={(e) => handleDeleteLead(e, lead.id, lead.name)}
                      className="material-symbols-outlined text-on-surface-variant hover:text-error hover:bg-error-container/20 p-1.5 rounded transition-all"
                      title="Delete Lead"
                    >
                      delete
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="p-8 text-center text-on-surface-variant">
              <span className="material-symbols-outlined text-4xl opacity-30">inbox</span>
              <p className="text-sm mt-2 font-medium">No leads match your search query.</p>
            </div>
          )}
        </div>

        {/* Add Manual Lead Action */}
        <div className="p-6 bg-surface-container-low border-t border-outline-variant">
          <button
            onClick={() => setShowAddModal(true)}
            className="w-full py-3.5 border-2 border-dashed border-outline-variant rounded-xl text-on-surface-variant hover:border-primary hover:text-primary transition-all flex flex-col items-center justify-center gap-1 font-semibold hover:bg-white"
          >
            <span className="material-symbols-outlined text-xl">add</span>
            <span className="text-[11px] font-bold tracking-widest uppercase">Add Manual Lead</span>
          </button>
        </div>
      </aside>

      {/* Manual Add Lead Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white border border-outline-variant rounded-2xl w-full max-w-md p-6 shadow-2xl flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center border-b border-outline-variant pb-3">
              <h3 className="text-xl font-bold">Add Manual Lead</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="material-symbols-outlined text-on-surface-variant hover:bg-surface-container-low p-1.5 rounded-full transition-colors"
              >
                close
              </button>
            </div>

            <form onSubmit={handleCreateLead} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold tracking-wider uppercase text-on-surface-variant mb-1">
                  Lead Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Bayshore Commercial Plaza"
                  className="w-full border border-outline-variant rounded-lg px-3 py-2 text-sm bg-surface-container-low focus:ring-1 focus:ring-primary outline-none"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold tracking-wider uppercase text-on-surface-variant mb-1">
                  Location (Address)
                </label>
                <input
                  type="text"
                  placeholder="e.g. 104 Bayshore Blvd, Tampa, FL"
                  className="w-full border border-outline-variant rounded-lg px-3 py-2 text-sm bg-surface-container-low focus:ring-1 focus:ring-primary outline-none"
                  value={form.location}
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold tracking-wider uppercase text-on-surface-variant mb-1">
                    Sector
                  </label>
                  <select
                    className="w-full border border-outline-variant rounded-lg px-3 py-2 text-sm bg-surface-container-low focus:ring-1 focus:ring-primary outline-none cursor-pointer"
                    value={form.sector}
                    onChange={(e) => setForm({ ...form, sector: e.target.value })}
                  >
                    <option>Commercial</option>
                    <option>Multi-family</option>
                    <option>Industrial</option>
                    <option>Retail</option>
                    <option>Real Estate</option>
                    <option>Construction</option>
                    <option>Funding</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold tracking-wider uppercase text-on-surface-variant mb-1">
                    Deal Size ($)
                  </label>
                  <input
                    type="number"
                    placeholder="e.g. 8500000"
                    className="w-full border border-outline-variant rounded-lg px-3 py-2 text-sm bg-surface-container-low focus:ring-1 focus:ring-primary outline-none"
                    value={form.deal_size}
                    onChange={(e) => setForm({ ...form, deal_size: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold tracking-wider uppercase text-on-surface-variant mb-1">
                    Status
                  </label>
                  <select
                    className="w-full border border-outline-variant rounded-lg px-3 py-2 text-sm bg-surface-container-low focus:ring-1 focus:ring-primary outline-none cursor-pointer"
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                  >
                    <option>New</option>
                    <option>Under Review</option>
                    <option>Contacted</option>
                    <option>Funded</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold tracking-wider uppercase text-on-surface-variant mb-1">
                    Confidence (0.0 - 1.0)
                  </label>
                  <input
                    type="number"
                    step="0.05"
                    min="0"
                    max="1"
                    placeholder="0.80"
                    className="w-full border border-outline-variant rounded-lg px-3 py-2 text-sm bg-surface-container-low focus:ring-1 focus:ring-primary outline-none"
                    value={form.confidence}
                    onChange={(e) => setForm({ ...form, confidence: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 border-t border-outline-variant pt-3">
                <div>
                  <label className="block text-[10px] font-bold tracking-wider uppercase text-on-surface-variant mb-0.5">
                    Lat (Optional)
                  </label>
                  <input
                    type="number"
                    step="0.000001"
                    placeholder="e.g. 27.9506"
                    className="w-full border border-outline-variant rounded-lg px-3 py-1.5 text-xs bg-surface-container-low focus:ring-1 focus:ring-primary outline-none"
                    value={form.latitude}
                    onChange={(e) => setForm({ ...form, latitude: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold tracking-wider uppercase text-on-surface-variant mb-0.5">
                    Lng (Optional)
                  </label>
                  <input
                    type="number"
                    step="0.000001"
                    placeholder="e.g. -82.4572"
                    className="w-full border border-outline-variant rounded-lg px-3 py-1.5 text-xs bg-surface-container-low focus:ring-1 focus:ring-primary outline-none"
                    value={form.longitude}
                    onChange={(e) => setForm({ ...form, longitude: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex gap-3 justify-end pt-3 border-t border-outline-variant">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-outline-variant rounded-lg text-sm font-semibold hover:bg-surface-container-low"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary text-on-primary rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity"
                >
                  Create Lead
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
