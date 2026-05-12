import { api } from './client'

export const dashboardApi = {
  metrics: () => api.get('/dashboard/metrics'),
  regions: () => api.get('/dashboard/regions'),
  pipelines: () => api.get('/dashboard/pipelines'),
}
