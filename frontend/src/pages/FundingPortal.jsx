import { useState } from 'react'
import { api } from '../api/client'

export default function FundingPortal() {
  const [form, setForm] = useState({ opportunity_name: '', requested_amount: '', sector: '', notes: '' })
  const [submitted, setSubmitted] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    await api.post('/funding/', { ...form, requested_amount: parseFloat(form.requested_amount) })
    setSubmitted(true)
  }

  return (
    <div className="max-w-xl">
      <div className="mb-8">
        <h1 className="text-[36px] leading-[44px] tracking-tight font-bold text-on-surface">Funding Portal</h1>
        <p className="text-on-surface-variant text-sm mt-1">Submit new funding requests for review.</p>
      </div>

      {submitted ? (
        <div className="bg-secondary-container text-on-secondary-container p-6 rounded-lg border border-secondary">
          <p className="font-semibold">Funding request submitted successfully.</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="bg-white border border-outline-variant rounded-lg p-6 space-y-4">
          {[
            { id: 'opportunity_name', label: 'Opportunity Name', type: 'text', placeholder: 'e.g. Palm Heights Multi-Family' },
            { id: 'requested_amount', label: 'Requested Amount ($)', type: 'number', placeholder: '0.00' },
            { id: 'sector', label: 'Sector', type: 'text', placeholder: 'Real Estate, Construction, Funding...' },
          ].map(({ id, label, type, placeholder }) => (
            <div key={id}>
              <label className="block text-[11px] font-semibold tracking-widest uppercase text-on-surface-variant mb-1">{label}</label>
              <input
                type={type}
                className="w-full border border-outline-variant rounded px-3 py-2 text-sm bg-surface-container-low focus:ring-1 focus:ring-primary outline-none"
                placeholder={placeholder}
                value={form[id]}
                onChange={(e) => setForm((f) => ({ ...f, [id]: e.target.value }))}
                required
              />
            </div>
          ))}
          <div>
            <label className="block text-[11px] font-semibold tracking-widest uppercase text-on-surface-variant mb-1">Notes</label>
            <textarea
              rows={3}
              className="w-full border border-outline-variant rounded px-3 py-2 text-sm bg-surface-container-low focus:ring-1 focus:ring-primary outline-none resize-none"
              placeholder="Additional context..."
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
            />
          </div>
          <button type="submit" className="w-full bg-primary text-on-primary py-3 rounded text-[11px] font-semibold tracking-widest uppercase hover:opacity-90 transition-opacity">
            Submit Funding Request
          </button>
        </form>
      )}
    </div>
  )
}
