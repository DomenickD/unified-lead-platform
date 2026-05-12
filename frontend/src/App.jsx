import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import AppShell from './components/layout/AppShell'
import Dashboard from './pages/Dashboard'
import LeadManagement from './pages/LeadManagement'
import OpportunityDiscovery from './pages/OpportunityDiscovery'
import FundingPortal from './pages/FundingPortal'
import MapView from './pages/MapView'
import Settings from './pages/Settings'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AppShell />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="opportunities" element={<OpportunityDiscovery />} />
          <Route path="funding" element={<FundingPortal />} />
          <Route path="leads" element={<LeadManagement />} />
          <Route path="map" element={<MapView />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
