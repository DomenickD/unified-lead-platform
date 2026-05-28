import { useState, useEffect } from 'react'
import { opportunitiesApi } from '../api/opportunities'

export function useOpportunities() {
  const [opportunities, setOpportunities] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  function refresh() {
    setLoading(true)
    return opportunitiesApi.list()
      .then(setOpportunities)
      .catch(setError)
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    refresh()
  }, [])

  return { opportunities, loading, error, refresh }
}
