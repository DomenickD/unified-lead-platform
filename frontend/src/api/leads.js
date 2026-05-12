import { api } from './client'

export const leadsApi = {
  list: () => api.get('/leads/'),
  get: (id) => api.get(`/leads/${id}`),
  create: (payload) => api.post('/leads/', payload),
  update: (id, payload) => api.patch(`/leads/${id}`, payload),
  remove: (id) => api.delete(`/leads/${id}`),
}
