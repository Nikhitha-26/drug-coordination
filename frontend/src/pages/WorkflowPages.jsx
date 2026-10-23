import { useState } from 'react'
import { EmptyState, SectionHeading } from '../components/ui'

const KEY = 'medisync-refill-network'
const PATIENT = 'Aarav Sharma (Demo)'
const pharmacies = [
  { id: 1, name: 'HealthPlus Pharmacy', distance: '0.8 km', address: 'Main Road', supportsDelivery: true },
  { id: 2, name: 'CityCare Pharmacy', distance: '1.4 km', address: 'Market Street', supportsDelivery: false },
  { id: 3, name: 'Wellness Medicals', distance: '2.1 km', address: 'Central Avenue', supportsDelivery: true },
]

function readRequests() {
  try { return JSON.parse(localStorage.getItem(KEY) || '[]') } catch { return [] }
}
function saveRequests(items) {
  try { localStorage.setItem(KEY, JSON.stringify(items)) } catch { /* ignore */ }
}

function statusStyle(status) {
  if (status === 'Available') return 'bg-emerald-50 text-emerald-700'
  if (status === 'Unavailable') return 'bg-rose-50 text-rose-700'
  return 'bg-amber-50 text-amber-800'
}

export function Refills({ role: roleProp }) {
  const role = roleProp || (typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('medisync-role') : '') || 'patient'
  const [medicine, setMedicine] = useState('Metformin 500 mg')
  const [requests, setRequests] = useState(readRequests)
  const [message, setMessage] = useState('')
  const [stage, setStage] = useState(() => readRequests().some(r => r.patient === PATIENT) ? 'results' : 'start')

  const refresh = () => setRequests(readRequests())
  const persist = (next, note) => {
    saveRequests(next)
    setRequests(next)
    if (note) setMessage(note)
  }

  function createRequest() {
    const request = {
      id: Date.now(),
      medicine,
      patient: PATIENT,
      status: 'Pending',
      createdAt: new Date().toISOString(),
      responses: [],
      fulfillment: {},
    }
    persist([...readRequests(), request], 'Demo refill request saved in this browser. Simulated pharmacies are listed below.')
    setStage('results')
  }

  function respond(requestId, pharmacyId, status) {
    persist(readRequests().map(r => {
      if (r.id !== requestId) return r
      const responses = [...(r.responses || []).filter(x => x.pharmacyId !== pharmacyId),
        { pharmacyId, pharmacy: pharmacies.find(p => p.id === pharmacyId)?.name, status }]
      return { ...r, responses }
    }), 'Demo pharmacy response saved in this browser.')
  }

  function chooseOption(requestId, pharmacyId, option) {
    persist(readRequests().map(r => {
      if (r.id !== requestId) return r
      return { ...r, fulfillment: { ...(r.fulfillment || {}), [pharmacyId]: option } }
    }), `Preference saved: ${option} (demo only).`)
  }

  const patientRequests = requests.filter(r => r.patient === PATIENT)
  const latestForMedicine = [...patientRequests].reverse().find(r => r.medicine === medicine)

  return (
    <div className="space-y-6">
      <SectionHeading
        title={role === 'pharmacy' ? 'Pending refill requests' : 'Need a refill?'}
        subtitle={role === 'pharmacy'
          ? 'Respond for simulated demo pharmacies. These are not live stock checks.'
          : 'Confirm only if you want a demo search. No real pharmacies are contacted.'}
      />

      {message && <div className="rounded-xl border border-emerald-100 bg-mint p-3 text-sm text-forest">{message}</div>}

      {role === 'pharmacy' ? (
        <div className="space-y-4">
          <button onClick={refresh} className="btn-small-secondary">Refresh requests</button>
          {requests.length === 0 && (
            <EmptyState
              title="No pending demo requests"
              detail="Create a request from the patient role, then return here to respond."
            />
          )}
          {requests.map(r => (
            <div key={r.id} className="card">
              <p className="font-semibold">{r.medicine}</p>
              <p className="mt-1 text-sm text-muted">Patient: {r.patient}</p>
              <p className="mt-1 text-xs text-muted">Demo request · stored in this browser</p>
              <div className="mt-4 space-y-3">
                {pharmacies.map(p => {
                  const response = (r.responses || []).find(x => x.pharmacyId === p.id)
                  return (
                    <div key={p.id} className="rounded-xl border border-slate-100 p-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold">{p.name}</p>
                          <p className="mt-1 text-xs text-muted">Simulated pharmacy · demo data</p>
                        </div>
                        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusStyle(response?.status || 'Awaiting response')}`}>
                          {response?.status || 'Awaiting response'}
                        </span>
                      </div>
                      <div className="mt-4 flex flex-wrap gap-2">
                        <button onClick={() => respond(r.id, p.id, 'Available')} className="btn-small-primary">Available</button>
                        <button onClick={() => respond(r.id, p.id, 'Unavailable')} className="btn-small-secondary">Unavailable</button>
                        <button onClick={() => respond(r.id, p.id, 'Unable to Confirm')} className="btn-small-secondary">Unable to Confirm</button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <>
          <div className="card">
            <label className="form-label">Which prescribed medicine do you need?
              <select value={medicine} onChange={e => setMedicine(e.target.value)} className="field">
                <option>Metformin 500 mg</option>
                <option>Atorvastatin 10 mg</option>
                <option>Vitamin D3</option>
              </select>
            </label>
            <p className="mt-3 text-sm text-muted">A demo refill request is created only after you choose Yes. Distances and availability are simulated.</p>
            {stage === 'start' ? (
              <div className="mt-5 flex flex-wrap gap-3">
                <button onClick={createRequest} className="btn-primary">Yes, find nearby pharmacies</button>
                <button onClick={() => { setMessage('No pharmacies contacted. You can search whenever you need a refill.'); setStage('declined') }} className="btn-small-secondary px-5 py-3">Not now</button>
              </div>
            ) : stage === 'declined' ? (
              <button onClick={() => { setStage('start'); setMessage('') }} className="btn-small-secondary mt-5">Search later</button>
            ) : (
              <div className="mt-5">
                <p className="font-semibold">Nearby pharmacy results</p>
                <p className="mt-1 text-sm text-muted">Demo results only. These are not live pharmacy stock checks, verified availability, or real distances.</p>
                <div className="mt-4 space-y-3">
                  {pharmacies.map(p => {
                    const response = latestForMedicine?.responses?.find(x => x.pharmacyId === p.id)
                    const status = response?.status || 'Awaiting response'
                    const savedChoice = latestForMedicine?.fulfillment?.[p.id]
                    return (
                      <div key={p.id} className="rounded-xl border border-slate-100 p-4">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <p className="font-semibold">{p.name}</p>
                            <p className="mt-1 text-sm text-muted">{p.address} · Demo distance {p.distance}</p>
                            <p className="mt-1 text-xs text-muted">Simulated location · not a real pharmacy listing</p>
                          </div>
                          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusStyle(status)}`}>{status}</span>
                        </div>
                        {status === 'Available' && latestForMedicine && (
                          <div className="mt-4 flex flex-wrap items-center gap-3">
                            {p.supportsDelivery ? (
                              <>
                                <label className="text-sm text-muted" htmlFor={`fulfill-${p.id}`}>Get medicine:</label>
                                <select
                                  id={`fulfill-${p.id}`}
                                  className="field !mt-0 max-w-[160px]"
                                  value={savedChoice || 'Pickup'}
                                  onChange={e => chooseOption(latestForMedicine.id, p.id, e.target.value)}
                                >
                                  <option>Pickup</option>
                                  <option>Delivery</option>
                                </select>
                                {savedChoice && <span className="text-xs text-muted">Saved: {savedChoice} · demo preference only.</span>}
                              </>
                            ) : (
                              <p className="text-sm text-muted">Pickup only at this demo pharmacy.</p>
                            )}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
                <button onClick={() => { setStage('start'); setMessage('') }} className="btn-small-secondary mt-5">Search another medicine</button>
              </div>
            )}
          </div>
          {patientRequests.length > 0 && (
            <div className="card">
              <h2 className="font-semibold">Your demo refill requests</h2>
              {patientRequests.map(r => {
                const choices = Object.entries(r.fulfillment || {}).map(([id, option]) => {
                  const name = pharmacies.find(p => String(p.id) === String(id))?.name
                  return `${name}: ${option}`
                })
                return (
                  <div key={r.id} className="mt-3 border-t border-slate-100 pt-3 text-sm">
                    <span className="font-medium">{r.medicine}</span>
                    {' · '}
                    {r.responses?.length || 0} pharmacy response(s)
                    {choices.length ? ` · ${choices.join('; ')}` : ' · no pickup or delivery choice yet'}
                  </div>
                )
              })}
            </div>
          )}
        </>
      )}
      <p className="text-xs leading-5 text-muted">Hackathon demo: fictional pharmacy names, distances, and responses stored in this browser. No real pharmacy is contacted, availability is not verified, and no medication is ordered.</p>
    </div>
  )
}
