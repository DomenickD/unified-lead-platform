import { useState, useEffect } from 'react'
import { leadsApi } from '../api/leads'

export function useLeads() {
  const [leads, setLeads] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    leadsApi.list()
      .then(setLeads)
      .catch(setError)
      .finally(() => setLoading(false))
  }, [])

  return { leads, loading, error }
}
