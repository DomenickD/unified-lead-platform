import { useState, useEffect } from 'react'
import { dashboardApi } from '../api/dashboard'

export function useDashboard() {
  const [metrics, setMetrics] = useState(null)
  const [regions, setRegions] = useState([])
  const [pipelines, setPipelines] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    Promise.all([dashboardApi.metrics(), dashboardApi.regions(), dashboardApi.pipelines()])
      .then(([m, r, p]) => { setMetrics(m); setRegions(r); setPipelines(p) })
      .catch(setError)
      .finally(() => setLoading(false))
  }, [])

  return { metrics, regions, pipelines, loading, error }
}
