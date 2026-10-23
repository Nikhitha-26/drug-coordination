import { useState } from 'react'
import { AlertTriangle, Check, History as HistoryIcon, MapPin, Pill, Search, ShieldCheck, Undo2 } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { EmptyState, SafetyResult, SectionHeading, StatusBadge } from '../components/ui'
import PrescriptionManager from '../components/PrescriptionManager'
import { checkMedication } from '../services/safety'
import { demoPlaces } from '../data/pharmacies'

export function Medications() {
  const { patient } = useApp()
  const [search, setSearch] = useState('')
  const meds = patient.medications.filter(m => m.name.toLowerCase().includes(search.toLowerCase()))
  return <div className="space-y-5">
    <SectionHeading title="Medication profile" subtitle="A shared view of current and discontinued medicines."/>
    <div className="card">
      <div className="relative mb-5 max-w-md"><Search className="absolute left-3 top-3 text-slate-400" size={17}/><input className="field pl-10" placeholder="Search medication..." aria-label="Search medication" value={search} onChange={e => setSearch(e.target.value)}/></div>
      {meds.length === 0 ? <EmptyState title="No medicines found" detail="Try a different search term."/> :
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{meds.map(m => <article key={m.id} className="rounded-2xl border border-slate-100 p-5">
          <div className="flex items-start justify-between"><div className="rounded-xl bg-mint p-3 text-forest"><Pill size={20}/></div><StatusBadge status={m.status}/></div>
          <h3 className="mt-4 text-lg font-semibold">{m.name}</h3>
          <p className="mt-1 text-sm text-muted">{m.strength} · {m.route}</p>
          <div className="mt-4 space-y-2 border-t border-slate-100 pt-4 text-sm">
            <p><span className="text-muted">Frequency:</span> {m.frequency}</p>
            <p><span className="text-muted">Time:</span> {m.time}</p>
            <p><span className="text-muted">Start date:</span> {m.startDate}</p>
            <p><span className="text-muted">Prescriber:</span> {m.prescriber}</p>
          </div>
        </article>)}</div>}
    </div>
  </div>
}

export function Schedule() {
  const { patient, markDose } = useApp()
  return <div className="space-y-5">
    <SectionHeading title="Dose schedule" subtitle="Mark the event after following the prescribed instructions."/>
    <div className="card">
      <div className="mb-4 rounded-xl bg-sky-50 p-4 text-sm leading-6 text-sky-900">Only record what happened. MediSync does not advise changing, skipping or doubling a dose.</div>
      {patient.doses.length === 0 && <EmptyState title="No doses scheduled" detail="Active prescriptions will appear here."/>}
      {patient.doses.map(d => <div key={d.id} className="flex flex-wrap items-center gap-4 border-t border-slate-100 py-4 first:border-0">
        <div className="w-24 text-sm font-semibold text-forest">{d.time}</div>
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-mint text-forest"><Pill size={18}/></div>
        <div className="min-w-[150px] flex-1"><p className="font-semibold">{d.medicine}</p><p className="mt-1 text-sm text-muted">{d.dose}</p></div>
        <StatusBadge status={d.status}/>
        {d.status === 'pending'
          ? <div className="flex gap-2"><button onClick={() => markDose(d.id, 'taken')} className="btn-small-primary"><Check size={14}/> Taken</button><button onClick={() => markDose(d.id, 'missed')} className="btn-small-secondary">Missed</button></div>
          : <button onClick={() => markDose(d.id, 'pending')} className="btn-small-secondary gap-1"><Undo2 size={13}/> Undo</button>}
      </div>)}
    </div>
  </div>
}

export function SafetyCenter() {
  const { patient, history, recordSafetyCheck } = useApp()
  const [name, setName] = useState('')
  const [ingredient, setIngredient] = useState('')
  const [result, setResult] = useState(null)
  const [checkedAt, setCheckedAt] = useState('')
  const active = patient.medications.filter(m => m.status === 'Active')
  const safetyHistory = history.filter(h => h.type.toLowerCase().includes('safety'))

  const check = (e) => {
    e.preventDefault()
    const r = checkMedication({ name, ingredient }, patient, active)
    setResult(r)
    setCheckedAt(new Date().toLocaleString())
    if (!r.incomplete) recordSafetyCheck(name.trim(), ingredient.trim().toLowerCase(), r.findings.length)
  }

  return <div className="space-y-6">
    <div className="flex items-center gap-3"><div className="rounded-xl bg-mint p-3 text-forest"><ShieldCheck size={24}/></div><div><h2 className="text-xl font-semibold">Medication Safety Shield</h2><p className="mt-1 text-sm text-muted">A clinician-facing review workflow, not an autonomous medical decision.</p></div></div>
    <div className="grid gap-6 xl:grid-cols-[1fr_.8fr]">
      <section className="card">
        <SectionHeading title="Check proposed medication" subtitle="Checks allergies, duplicate ingredients and a few known interactions against active demo medicines."/>
        <form onSubmit={check} className="space-y-4">
          <label className="form-label">Proposed medication<input className="field" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Amoxil"/></label>
          <label className="form-label">Active ingredient<input className="field" value={ingredient} onChange={e => setIngredient(e.target.value)} placeholder="e.g. amoxicillin"/></label>
          <button className="btn-primary" type="submit"><ShieldCheck size={17}/> Run demo check</button>
        </form>
        <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-sm font-semibold">Checked against</p>
          <div className="mt-3 flex flex-wrap gap-2">{active.map(m => <span key={m.id} className="rounded-full bg-white px-3 py-1.5 text-xs text-slate-700 ring-1 ring-slate-200">{m.name}</span>)}{patient.allergies.map(a => <span key={a} className="rounded-full bg-amber-50 px-3 py-1.5 text-xs text-amber-800 ring-1 ring-amber-200">Allergy: {a}</span>)}</div>
        </div>
      </section>
      <section className="card">
        <SectionHeading title="Check result" subtitle="Results remain subject to clinician review."/>
        {!result ? <EmptyState title="No check performed" detail="Enter a proposed medicine to see the demo workflow."/> : <>
          <SafetyResult result={result}/>
          <p className="mt-4 text-xs leading-5 text-muted">Source: local demo rules · Checked {checkedAt}</p>
          <label className="mt-3 flex items-start gap-2 text-sm"><input type="checkbox" className="mt-1 accent-forest"/><span>I have reviewed this demo result. This acknowledgement is not a clinical approval.</span></label>
        </>}
      </section>
    </div>
    <section className="card">
      <SectionHeading title="Recent safety history"/>
      {safetyHistory.length === 0 ? <EmptyState title="No recorded safety events" detail="Safety checks will be recorded here."/> :
        safetyHistory.slice(0, 6).map(h => <div key={h.id} className="border-t border-slate-100 py-3 first:border-0"><p className="font-medium">{h.detail}</p><p className="mt-1 text-xs text-muted">{h.time} · {h.actor}</p></div>)}
    </section>
  </div>
}

export function Alerts() {
  const { alerts, acknowledgeAlert } = useApp()
  return <div className="space-y-5">
    <SectionHeading title="Alerts & notifications" subtitle="In-app demo alerts for medication and adherence events."/>
    {alerts.length === 0 && <EmptyState title="No alerts" detail="Missed doses and profile changes will appear here."/>}
    <div className="space-y-3">{alerts.map(a => <article key={a.id} className="card flex flex-wrap items-start gap-4">
      <div className={`rounded-xl p-3 ${a.severity === 'warning' ? 'bg-rose-50 text-rose-700' : 'bg-amber-50 text-amber-700'}`}><AlertTriangle size={20}/></div>
      <div className="min-w-[180px] flex-1"><h3 className="font-semibold">{a.title}</h3><p className="mt-1 text-sm text-muted">{a.detail}</p><p className="mt-2 text-xs text-slate-400">{a.time}</p><p className="mt-2 text-xs text-muted">Alert lifecycle: Created → Delivered → Acknowledged → Resolved</p></div>
      <StatusBadge status={a.status}/>
      {a.status !== 'Acknowledged' && <button onClick={() => acknowledgeAlert(a.id)} className="btn-small-primary">Acknowledge</button>}
    </article>)}</div>
  </div>
}

export function History() {
  const { history } = useApp()
  return <div className="space-y-5">
    <SectionHeading title="Shared medication history" subtitle="Chronological record of dose events, prescriptions and reviews."/>
    <div className="card"><div className="relative space-y-0">{history.map((h, i) => <div key={h.id} className="relative flex gap-4 pb-7 last:pb-0">
      <div className="relative flex flex-col items-center"><div className="z-10 rounded-full border-4 border-white bg-mint p-2 text-forest"><HistoryIcon size={15}/></div>{i !== history.length - 1 && <div className="absolute top-8 h-full w-px bg-slate-200"/>}</div>
      <div className="flex-1 pb-2"><div className="flex flex-wrap items-center justify-between gap-2"><p className="font-semibold">{h.type}</p><span className="text-xs text-muted">{h.time}</span></div><p className="mt-1 text-sm text-muted">{h.detail}</p><p className="mt-2 text-xs text-slate-400">Actor: {h.actor}</p></div>
    </div>)}</div></div>
  </div>
}

export function Patients() {
  const { patient } = useApp()
  return <div className="space-y-5">
    <SectionHeading title="Authorized patient records" subtitle="This demo includes one fictional patient. Real authorization must be enforced by the backend."/>
    <div className="card">
      <div className="flex flex-wrap items-center gap-4"><div className="flex h-14 w-14 items-center justify-center rounded-full bg-mint font-semibold text-forest">AS</div><div className="flex-1"><h3 className="font-semibold">{patient.name}</h3><p className="mt-1 text-sm text-muted">Patient ID: DEMO-001 · Age {patient.age}</p><p className="mt-1 text-sm text-muted">Allergies: {patient.allergies.join(', ')}</p></div><span className="rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700">Demo authorized</span></div>
      <div className="mt-5 grid gap-3 sm:grid-cols-3">{patient.medications.filter(m => m.status === 'Active').map(m => <div key={m.id} className="rounded-xl border border-slate-100 p-3"><p className="font-semibold">{m.name}</p><p className="mt-1 text-sm text-muted">{m.strength}</p></div>)}</div>
    </div>
  </div>
}

export function Prescriptions() {
  return <div className="space-y-5">
    <SectionHeading title="Prescription management" subtitle="Prescribe, modify or discontinue medicines. Every change is written to shared history."/>
    <PrescriptionManager/>
  </div>
}

const stockLabel = { in: ['In stock', 'bg-emerald-50 text-emerald-700'], low: ['Low stock', 'bg-amber-50 text-amber-700'], out: ['Out of stock', 'bg-rose-50 text-rose-700'] }

export function Pharmacies() {
  const { patient } = useApp()
  const [query, setQuery] = useState('')
  const [type, setType] = useState('All')
  const q = query.trim().toLowerCase()
  const places = demoPlaces
    .filter(p => type === 'All' || p.type === type)
    .filter(p => !q || Object.entries(p.stock).some(([ing, s]) => ing.includes(q) && s !== 'out') || p.name.toLowerCase().includes(q))
    .sort((a, b) => a.distanceKm - b.distanceKm)
  const active = patient.medications.filter(m => m.status === 'Active')
  return <div className="space-y-5">
    <SectionHeading title="Find medicines nearby" subtitle="Search by medicine ingredient or place name. Locations and stock are fictional demo data."/>
    <div className="card">
      <div className="mb-5 flex flex-wrap gap-3">
        <div className="relative min-w-[220px] max-w-md flex-1"><Search className="absolute left-3 top-3 text-slate-400" size={17}/><input className="field pl-10" placeholder="e.g. metformin" aria-label="Search medicine or place" value={query} onChange={e => setQuery(e.target.value)}/></div>
        <select className="field !mt-0 max-w-[160px]" value={type} onChange={e => setType(e.target.value)} aria-label="Filter by type"><option>All</option><option>Pharmacy</option><option>Hospital</option></select>
      </div>
      {places.length === 0 ? <EmptyState title="Nothing found nearby" detail="No demo location stocks that medicine. Try another ingredient."/> :
        <div className="space-y-3">{places.map(p => <article key={p.id} className="flex flex-wrap items-start gap-4 rounded-2xl border border-slate-100 p-4">
          <div className="rounded-xl bg-mint p-3 text-forest"><MapPin size={20}/></div>
          <div className="min-w-[200px] flex-1">
            <div className="flex flex-wrap items-center gap-2"><h3 className="font-semibold">{p.name}</h3><span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">{p.type}</span></div>
            <p className="mt-1 text-sm text-muted">{p.address} · {p.hours}</p>
            <div className="mt-3 flex flex-wrap gap-2">{active.map(m => {
              const s = p.stock[m.ingredient]
              const [label, style] = s ? stockLabel[s] : ['Not listed', 'bg-slate-100 text-slate-500']
              return <span key={m.id} className={`rounded-full px-2.5 py-1 text-xs font-medium ${style}`}>{m.name}: {label}</span>
            })}</div>
          </div>
          <span className="text-sm font-semibold text-forest">{p.distanceKm.toFixed(1)} km</span>
        </article>)}</div>}
      <p className="mt-4 text-xs text-muted">Stock levels are simulated. Call ahead before travelling.</p>
    </div>
  </div>
}