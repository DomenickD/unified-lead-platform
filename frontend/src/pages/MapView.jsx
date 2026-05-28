import { useEffect, useRef, useState } from 'react'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { api } from '../api/client'
import Badge from '../components/ui/Badge'

function fmt(n) {
  if (!n) return '$0'
  if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M`
  return `$${n.toLocaleString()}`
}

// ESRI Satellite Raster Style Object for free, tokenless satellite view
const ESRI_SATELLITE_STYLE = {
  version: 8,
  sources: {
    'esri-satellite': {
      type: 'raster',
      tiles: [
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
      ],
      tileSize: 256,
      attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
    }
  },
  layers: [
    {
      id: 'esri-satellite-layer',
      type: 'raster',
      source: 'esri-satellite',
      minzoom: 0,
      maxzoom: 20
    }
  ]
}

export default function MapView() {
  const mapContainer = useRef(null)
  const map = useRef(null)
  const [mapStyle, setMapStyle] = useState('https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json')
  const [data, setData] = useState({ leads: [], opportunities: [] })
  const [loading, setLoading] = useState(true)
  const [selectedItem, setSelectedItem] = useState(null)
  const [activeTab, setActiveTab] = useState('all') // 'all', 'leads', 'opportunities'
  const markersRef = useRef([])

  // Fetch leads and opportunities
  useEffect(() => {
    async function fetchData() {
      try {
        const [leads, opportunities] = await Promise.all([
          api.get('/leads/'),
          api.get('/opportunities/')
        ])
        setData({ leads, opportunities })
      } catch (err) {
        console.error('Error fetching map data:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  // Initialize Map
  useEffect(() => {
    if (!mapContainer.current || loading) return

    try {
      map.current = new maplibregl.Map({
        container: mapContainer.current,
        style: mapStyle,
        center: [-82.4572, 27.9506], // Center on Tampa, FL
        zoom: 11,
      })

      // Add navigation controls (zoom, rotate)
      map.current.addControl(new maplibregl.NavigationControl(), 'top-right')

      // Clear map instance on unmount
      return () => {
        if (map.current) {
          map.current.remove()
        }
      }
    } catch (e) {
      console.error('Error initializing map:', e)
    }
  }, [loading])

  // Update style
  useEffect(() => {
    if (map.current && !loading) {
      try {
        map.current.setStyle(mapStyle)
      } catch (e) {
        console.error(e)
      }
    }
  }, [mapStyle, loading])

  // Render markers
  useEffect(() => {
    if (!map.current || loading) return

    // Clear old markers
    markersRef.current.forEach((m) => m.remove())
    markersRef.current = []

    const itemsToDraw = []

    if (activeTab === 'all' || activeTab === 'leads') {
      data.leads.forEach((l) => {
        if (l.latitude && l.longitude) {
          itemsToDraw.push({ ...l, type: 'Lead' })
        }
      })
    }

    if (activeTab === 'all' || activeTab === 'opportunities') {
      data.opportunities.forEach((o) => {
        if (o.latitude && o.longitude) {
          itemsToDraw.push({ ...o, type: 'Opportunity', deal_size: o.valuation })
        }
      })
    }

    // Draw new markers
    itemsToDraw.forEach((item) => {
      // Color coding: Leads = Green, Opportunities = Blue, Flagged = Red
      let color = '#3b82f6' // Blue (Opportunity)
      if (item.type === 'Lead') {
        color = '#10b981' // Green
      }
      if (item.flagged) {
        color = '#ef4444' // Red
      }

      // Create a DOM element for the marker
      const el = document.createElement('div')
      el.className = 'custom-marker'
      el.style.backgroundColor = color
      el.style.width = '14px'
      el.style.height = '14px'
      el.style.borderRadius = '50%'
      el.style.border = '2px solid white'
      el.style.cursor = 'pointer'
      el.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)'

      const marker = new maplibregl.Marker(el)
        .setLngLat([item.longitude, item.latitude])
        .addTo(map.current)

      // Add click listener
      el.addEventListener('click', () => {
        setSelectedItem(item)
        
        // Fly to marker
        map.current.flyTo({
          center: [item.longitude, item.latitude],
          zoom: 13,
          essential: true
        })
      })

      markersRef.current.push(marker)
    })
  }, [data, activeTab, loading])

  return (
    <div className="flex flex-col h-[calc(100vh-140px)]">
      {/* Header Area */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-[36px] leading-[44px] tracking-tight font-bold text-on-surface">Interactive Map</h1>
          <p className="text-on-surface-variant text-sm mt-1">Geographic distribution of leads and opportunities in Tampa, FL.</p>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col lg:flex-row gap-4 min-h-0">
        
        {/* Sidebar info / controls */}
        <div className="w-full lg:w-80 flex flex-col gap-4 shrink-0">
          
          {/* Layer Selector */}
          <div className="bg-white border border-outline-variant rounded-lg p-4 flex flex-col gap-2">
            <h3 className="text-sm font-bold text-on-surface tracking-wider uppercase mb-1">Filter Layers</h3>
            <div className="flex gap-1 bg-surface-container-low p-1 rounded border border-outline-variant">
              {[
                { id: 'all', label: 'All' },
                { id: 'leads', label: 'Leads' },
                { id: 'opportunities', label: 'Opps' }
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => {
                    setActiveTab(t.id)
                    setSelectedItem(null)
                  }}
                  className={`flex-1 py-1.5 rounded text-xs font-bold transition-colors ${
                    activeTab === t.id
                      ? 'bg-primary text-on-primary shadow-sm'
                      : 'text-on-surface-variant hover:bg-surface-container-high'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Map Styles Selector */}
          <div className="bg-white border border-outline-variant rounded-lg p-4 flex flex-col gap-2">
            <h3 className="text-sm font-bold text-on-surface tracking-wider uppercase mb-1">Map View Style</h3>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: 'Streets', style: 'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json', icon: 'map' },
                { label: 'Satellite', style: ESRI_SATELLITE_STYLE, icon: 'satellite' },
                { label: 'Dark Mode', style: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json', icon: 'dark_mode' },
                { label: 'Light Mode', style: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json', icon: 'light_mode' }
              ].map((s) => (
                <button
                  key={s.label}
                  onClick={() => setMapStyle(s.style)}
                  className={`flex items-center gap-2 p-2.5 rounded border text-xs font-semibold transition-all ${
                    mapStyle === s.style
                      ? 'border-primary bg-primary-container text-on-primary-container font-bold shadow-sm'
                      : 'border-outline-variant bg-white text-on-surface-variant hover:bg-surface-container-low'
                  }`}
                >
                  <span className="material-symbols-outlined text-sm">{s.icon}</span>
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Selected Item Panel */}
          <div className="bg-white border border-outline-variant rounded-lg p-4 flex-1 flex flex-col overflow-y-auto">
            <h3 className="text-sm font-bold text-on-surface tracking-wider uppercase mb-3">Asset Details</h3>
            
            {selectedItem ? (
              <div className="space-y-4 flex-1 flex flex-col justify-between">
                <div className="space-y-3">
                  <div>
                    <span className="text-[10px] bg-surface-container-high text-on-surface-variant font-bold uppercase px-2 py-0.5 rounded mr-2">
                      {selectedItem.type}
                    </span>
                    {selectedItem.flagged && <span className="text-[10px] bg-error-container text-on-error-container font-bold uppercase px-2 py-0.5 rounded">Zoning Issue</span>}
                  </div>

                  <div>
                    <h4 className="text-lg font-bold leading-tight text-primary">{selectedItem.name}</h4>
                    <p className="text-xs text-on-surface-variant flex items-center gap-1 mt-1 font-medium">
                      <span className="material-symbols-outlined text-xs">location_on</span>
                      {selectedItem.location || selectedItem.address || 'Tampa, FL'}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-outline-variant">
                    <div>
                      <span className="block text-[10px] font-bold text-on-surface-variant uppercase">Size / Valuation</span>
                      <span className="text-sm font-bold text-on-surface">{fmt(selectedItem.deal_size || selectedItem.valuation)}</span>
                    </div>
                    <div>
                      <span className="block text-[10px] font-bold text-on-surface-variant uppercase">Sector</span>
                      <div className="mt-0.5">
                        <Badge label={selectedItem.sector} />
                      </div>
                    </div>
                  </div>

                  {selectedItem.confidence && (
                    <div className="pt-2 border-t border-outline-variant">
                      <span className="block text-[10px] font-bold text-on-surface-variant uppercase mb-1">Confidence Score</span>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-surface-container rounded-full overflow-hidden">
                          <div 
                            className="bg-primary h-full" 
                            style={{ width: `${selectedItem.confidence * 100}%` }}
                          />
                        </div>
                        <span className="text-xs font-bold">{Math.round(selectedItem.confidence * 100)}%</span>
                      </div>
                    </div>
                  )}

                  {selectedItem.status && (
                    <div className="pt-2 border-t border-outline-variant">
                      <span className="block text-[10px] font-bold text-on-surface-variant uppercase">Pipeline Status</span>
                      <span className="text-xs font-semibold">{selectedItem.status}</span>
                    </div>
                  )}
                </div>

                <div className="pt-4 mt-auto">
                  <button 
                    onClick={() => {
                      alert(`Opening detail view for ${selectedItem.name}`)
                    }}
                    className="w-full bg-primary text-on-primary py-2 px-3 rounded text-[11px] font-bold tracking-widest uppercase hover:opacity-90 transition-opacity"
                  >
                    View Full Profile
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center text-on-surface-variant py-8">
                <span className="material-symbols-outlined text-[48px] opacity-30">info</span>
                <p className="text-xs mt-2 px-4">Click a map pin to inspect the opportunity details, check values, and perform actions.</p>
              </div>
            )}
          </div>
        </div>

        {/* Map Container */}
        <div className="flex-1 bg-white border border-outline-variant rounded-lg overflow-hidden relative shadow-sm h-full min-h-[400px]">
          {loading && (
            <div className="absolute inset-0 bg-white/80 z-20 flex items-center justify-center text-on-surface-variant text-sm font-semibold">
              <div className="flex flex-col items-center gap-2">
                <span className="material-symbols-outlined animate-spin text-[32px] text-primary">sync</span>
                Loading Map Data...
              </div>
            </div>
          )}
          <div ref={mapContainer} className="w-full h-full" />

          {/* Map legend in bottom right */}
          <div className="absolute bottom-4 right-4 bg-white/95 backdrop-blur-sm p-3 border border-outline-variant shadow-lg rounded-lg text-xs space-y-1.5 z-10 pointer-events-none font-semibold text-on-surface-variant">
            <div className="text-[10px] font-bold uppercase tracking-wider text-on-surface mb-1">Legend</div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-[#10b981] border border-white" />
              <span>Active Leads</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-[#3b82f6] border border-white" />
              <span>Opportunities</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-[#ef4444] border border-white" />
              <span>Flagged (Zoning Re-Eval)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
