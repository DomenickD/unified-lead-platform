import { api } from './client'

export const opportunitiesApi = {
  list: () => api.get('/opportunities/'),
  get: (id) => api.get(`/opportunities/${id}`),
  create: (payload) => api.post('/opportunities/', payload),
  update: (id, payload) => api.patch(`/opportunities/${id}`, payload),
  remove: (id) => api.delete(`/opportunities/${id}`),
}
