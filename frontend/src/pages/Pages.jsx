import { useMemo, useState } from 'react'
import { AlertTriangle, Check, Clock3, FileText, History as HistoryIcon, Pill, Search, ShieldCheck, Stethoscope } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { EmptyState, SectionHeading, StatusBadge } from '../components/ui'

export function Medications() {
  const { patient } = useApp()
  const [search, setSearch] = useState('')
  const meds = patient.medications.filter(m => m.name.toLowerCase().includes(search.toLowerCase()))
  return <div className="space-y-5"><SectionHeading title="Medication profile" subtitle="A shared view of current and discontinued medicines."/><div className="card"><div className="relative mb-5 max-w-md"><Search className="absolute left-3 top-3 text-slate-400" size={17}/><input className="field pl-10" placeholder="Search medication..." value={search} onChange={e=>setSearch(e.target.value)}/></div>{meds.length===0?<EmptyState title="No medicines found" detail="Try a different search term."/>:<div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{meds.map(m=><article key={m.id} className="rounded-2xl border border-slate-100 p-5"><div className="flex items-start justify-between"><div className="rounded-xl bg-mint p-3 text-forest"><Pill size={20}/></div><StatusBadge status={m.status}/></div><h3 className="mt-4 text-lg font-semibold">{m.name}</h3><p className="mt-1 text-sm text-muted">{m.strength} · {m.route}</p><div className="mt-4 space-y-2 border-t border-slate-100 pt-4 text-sm"><p><span className="text-muted">Frequency:</span> {m.frequency}</p><p><span className="text-muted">Time:</span> {m.time}</p><p><span className="text-muted">Start date:</span> {m.startDate}</p><p><span className="text-muted">Prescriber:</span> {m.prescriber}</p></div></article>)}</div>}</div></div>
}

export function Schedule() {
  const { patient, markDose } = useApp()
  return <div className="space-y-5"><SectionHeading title="Dose schedule" subtitle="Mark the event after following the prescribed instructions."/><div className="card"><div className="mb-4 rounded-xl bg-sky-50 p-4 text-sm leading-6 text-sky-900">Only record what happened. MediSync does not advise changing, skipping or doubling a dose.</div>{patient.doses.map(d=><div key={d.id} className="flex flex-wrap items-center gap-4 border-t border-slate-100 py-4 first:border-0"><div className="w-24 text-sm font-semibold text-forest">{d.time}</div><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-mint text-forest"><Pill size={18}/></div><div className="min-w-[150px] flex-1"><p className="font-semibold">{d.medicine}</p><p className="mt-1 text-sm text-muted">{d.dose}</p></div><StatusBadge status={d.status}/>{d.status!=='taken'&&d.status!=='missed'&&<div className="flex gap-2"><button onClick={()=>markDose(d.id,'taken')} className="btn-small-primary"><Check size={14}/> Taken</button><button onClick={()=>markDose(d.id,'missed')} className="btn-small-secondary">Missed</button></div>}</div>)}</div></div>
}

export function SafetyCenter() {
  const { patient, history } = useApp()
  const [name, setName] = useState('')
  const [ingredient, setIngredient] = useState('')
  const [result, setResult] = useState(null)
  const check = (e) => {
    e.preventDefault()
    if (!name.trim() || !ingredient.trim()) { setResult({kind:'unknown', title:'Unable to verify', detail:'Enter a medication name and ingredient. The demo cannot verify incomplete medication information.'}); return }
    const matches = patient.medications.filter(m => m.status === 'Active' && (m.ingredient || '').toLowerCase() === ingredient.trim().toLowerCase())
    if (matches.length) setResult({kind:'warning', title:'Potential issue found', detail:`The entered ingredient matches: ${matches.map(m=>m.name).join(', ')}. This is a simulated duplicate-ingredient rule, not verified clinical evidence. Ask a qualified clinician to review.`})
    else setResult({kind:'ok', title:'No known match found', detail:'No duplicate ingredient match was found in the limited demo data. This does not prove the combination is safe; drug interactions and allergies have not been comprehensively checked.'})
  }
  return <div className="space-y-6"><div><div className="flex items-center gap-3"><div className="rounded-xl bg-mint p-3 text-forest"><ShieldCheck size={24}/></div><div><h2 className="text-xl font-semibold">Medication Safety Shield</h2><p className="mt-1 text-sm text-muted">A clinician-facing review workflow, not an autonomous medical decision.</p></div></div></div>
    <div className="grid gap-6 xl:grid-cols-[1fr_.8fr]"><section className="card"><SectionHeading title="Check proposed medication" subtitle="Compare an ingredient against active demo medicines."/><form onSubmit={check} className="space-y-4"><label className="form-label">Proposed medication<input className="field" value={name} onChange={e=>setName(e.target.value)} placeholder="Medication name" required/></label><label className="form-label">Active ingredient<input className="field" value={ingredient} onChange={e=>setIngredient(e.target.value)} placeholder="Enter verified ingredient" required/></label><button className="btn-primary" type="submit"><ShieldCheck size={17}/> Run demo check</button></form><div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4"><p className="text-sm font-semibold">Existing medicines checked</p><div className="mt-3 flex flex-wrap gap-2">{patient.medications.filter(m=>m.status==='Active').map(m=><span key={m.id} className="rounded-full bg-white px-3 py-1.5 text-xs text-slate-700 ring-1 ring-slate-200">{m.name}</span>)}</div></div></section>
      <section className="card"><SectionHeading title="Check result" subtitle="Results remain subject to clinician review."/>{!result?<EmptyState title="No check performed" detail="Enter a proposed medicine to see the demo workflow."/>:<div className={`rounded-2xl border p-5 ${result.kind==='warning'?'border-amber-200 bg-amber-50':result.kind==='ok'?'border-emerald-200 bg-emerald-50':'border-slate-200 bg-slate-50'}`}><div className="flex items-center gap-2 font-semibold">{result.kind==='warning'?<AlertTriangle size={19}/>:result.kind==='ok'?<ShieldCheck size={19}/>:<Clock3 size={19}/>} {result.title}</div><p className="mt-3 text-sm leading-6">{result.detail}</p><div className="mt-4 border-t border-current/10 pt-3 text-xs leading-5 opacity-80">Source: local demo rule · Check time: {new Date().toLocaleString()} · Review status: Pending clinician review</div><label className="mt-4 flex items-start gap-2 text-sm"><input type="checkbox" className="mt-1 accent-forest"/><span>I have reviewed this demo result. This acknowledgement is not a clinical approval.</span></label></div>}</section></div>
    <section className="card"><SectionHeading title="Recent safety history"/>{history.filter(h=>h.type.toLowerCase().includes('safety')).length===0?<EmptyState title="No recorded safety events" detail="Safety checks will be recorded here when connected to the backend."/>:history.filter(h=>h.type.toLowerCase().includes('safety')).map(h=><div key={h.id} className="border-t border-slate-100 py-3 first:border-0"><p className="font-medium">{h.detail}</p><p className="mt-1 text-xs text-muted">{h.time} · {h.actor}</p></div>)}</section>
  </div>
}

export function Alerts() {
  const { alerts, acknowledgeAlert } = useApp()
  return <div className="space-y-5"><SectionHeading title="Alerts & notifications" subtitle="In-app demo alerts for medication and adherence events."/><div className="space-y-3">{alerts.map(a=><article key={a.id} className="card flex flex-wrap items-start gap-4"><div className="rounded-xl bg-amber-50 p-3 text-amber-700"><AlertTriangle size={20}/></div><div className="min-w-[180px] flex-1"><h3 className="font-semibold">{a.title}</h3><p className="mt-1 text-sm text-muted">{a.detail}</p><p className="mt-2 text-xs text-slate-400">{a.time}</p><p className="mt-2 text-xs text-muted">Alert lifecycle: Created → Delivered → Acknowledged → Resolved</p></div><StatusBadge status={a.status}/>{a.status!=='Acknowledged'&&<button onClick={()=>acknowledgeAlert(a.id)} className="btn-small-primary">Acknowledge</button>}</article>)}</div></div>
}

export function History() {
  const { history } = useApp()
  return <div className="space-y-5"><SectionHeading title="Shared medication history" subtitle="Chronological record of dose events, prescriptions and reviews."/><div className="card"><div className="relative space-y-0">{history.map((h,i)=><div key={h.id} className="relative flex gap-4 pb-7 last:pb-0"><div className="relative flex flex-col items-center"><div className="z-10 rounded-full border-4 border-white bg-mint p-2 text-forest"><HistoryIcon size={15}/></div>{i!==history.length-1&&<div className="absolute top-8 h-full w-px bg-slate-200"/>}</div><div className="flex-1 pb-2"><div className="flex flex-wrap items-center justify-between gap-2"><p className="font-semibold">{h.type}</p><span className="text-xs text-muted">{h.time}</span></div><p className="mt-1 text-sm text-muted">{h.detail}</p><p className="mt-2 text-xs text-slate-400">Actor: {h.actor}</p></div></div>)}</div></div></div>
}

export function Patients() {
  const { patient } = useApp()
  return <div className="space-y-5"><SectionHeading title="Authorized patient records" subtitle="This demo includes one fictional patient. Real authorization must be enforced by the backend."/><div className="card"><div className="flex flex-wrap items-center gap-4"><div className="flex h-14 w-14 items-center justify-center rounded-full bg-mint font-semibold text-forest">AS</div><div className="flex-1"><h3 className="font-semibold">{patient.name}</h3><p className="mt-1 text-sm text-muted">Patient ID: DEMO-001 · Age {patient.age}</p><p className="mt-1 text-sm text-muted">Allergies: {patient.allergies.join(', ')}</p></div><span className="rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700">Demo authorized</span></div><div className="mt-5 grid gap-3 sm:grid-cols-3">{patient.medications.filter(m=>m.status==='Active').map(m=><div key={m.id} className="rounded-xl border border-slate-100 p-3"><p className="font-semibold">{m.name}</p><p className="mt-1 text-sm text-muted">{m.strength}</p></div>)}</div></div></div>
}

export function Prescriptions() {
  return <div className="card"><div className="flex items-center gap-3"><div className="rounded-xl bg-mint p-3 text-forest"><FileText size={20}/></div><div><h2 className="font-semibold">Prescription management</h2><p className="mt-1 text-sm text-muted">Use the Doctor dashboard to create or discontinue demo prescriptions.</p></div></div></div>
}
