import { useState, useEffect } from 'react'
import { opportunitiesApi } from '../api/opportunities'

export function useOpportunities() {
  const [opportunities, setOpportunities] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    opportunitiesApi.list()
      .then(setOpportunities)
      .catch(setError)
      .finally(() => setLoading(false))
  }, [])

  return { opportunities, loading, error }
}
