export default function MapView() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-[36px] leading-[44px] tracking-tight font-bold text-on-surface">Map View</h1>
        <p className="text-on-surface-variant text-sm mt-1">Full geographic view of opportunities and market zones.</p>
      </div>
      <div className="bg-white border border-outline-variant rounded-lg h-[600px] flex items-center justify-center text-on-surface-variant">
        <div className="text-center">
          <span className="material-symbols-outlined text-[64px]">map</span>
          <p className="text-sm mt-2">Map integration placeholder — wire up your map library here.</p>
        </div>
      </div>
    </div>
  )
}
