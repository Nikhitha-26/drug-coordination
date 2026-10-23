import { useMemo, useState } from 'react'
import { Activity, ArrowRight, CalendarDays, Check, CheckCircle2, Clock3, Pill, ShieldCheck, TriangleAlert, X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { EmptyState, SectionHeading, StatCard, StatusBadge } from '../components/ui'

function PatientDashboard() {
  const { patient, markDose, alerts } = useApp()
  const navigate = useNavigate()
  const taken = patient.doses.filter(d => d.status === 'taken').length
  const pending = patient.doses.filter(d => d.status === 'pending').length
  const missed = patient.doses.filter(d => d.status === 'missed').length
  const today = new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })
  return <div className="space-y-7">
    <div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-sm font-medium text-forest">Good morning, Aarav</p><h2 className="mt-1 text-2xl font-semibold tracking-tight">Your health, in sync.</h2><p className="mt-2 text-sm text-muted">{today} · Here's your medication overview.</p></div><button onClick={() => navigate('/schedule')} className="btn-primary"><CalendarDays size={16}/> View schedule</button></div>
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><StatCard label="Active medications" value={patient.medications.filter(m => m.status === 'Active').length} note="Across your care team" icon={Pill}/><StatCard label="Doses due today" value={patient.doses.length} note="Scheduled doses" icon={Clock3} tint="blue"/><StatCard label="Doses taken" value={taken} note={`${Math.round(taken / Math.max(1, patient.doses.length) * 100)}% of today's schedule`} icon={CheckCircle2}/><StatCard label="Pending actions" value={pending + missed} note="Needs your attention" icon={TriangleAlert} tint={pending + missed ? 'amber' : 'green'}/></div>
    <div className="grid gap-6 xl:grid-cols-[1.45fr_.85fr]">
      <section className="card"><SectionHeading title="Today's medication schedule" subtitle="Record each dose when appropriate." action={<button className="text-sm font-semibold text-forest" onClick={() => navigate('/schedule')}>Full schedule <ArrowRight className="ml-1 inline" size={15}/></button>}/>
        <div className="divide-y divide-slate-100">{patient.doses.map(dose => <div key={dose.id} className="flex flex-wrap items-center gap-3 py-4 first:pt-1 last:pb-1"><div className={`flex h-11 w-11 items-center justify-center rounded-xl ${dose.status === 'taken' ? 'bg-mint text-forest' : 'bg-slate-50 text-slate-500'}`}><Pill size={20}/></div><div className="min-w-[130px] flex-1"><p className="font-semibold">{dose.medicine}</p><p className="mt-1 text-xs text-muted">{dose.dose} · {dose.time}</p></div><StatusBadge status={dose.status}/>{dose.status !== 'taken' && dose.status !== 'missed' && <div className="flex gap-2"><button onClick={() => markDose(dose.id, 'taken')} className="btn-small-primary"><Check size={14}/> Taken</button><button onClick={() => markDose(dose.id, 'missed')} className="btn-small-secondary">Missed</button></div>}</div>)}</div>
      </section>
      <div className="space-y-6">
        <section className="card"><SectionHeading title="Allergies" subtitle="Information recorded in your profile"/><div className="rounded-xl border border-amber-200 bg-amber-50 p-4"><div className="flex items-center gap-2 font-semibold text-amber-900"><TriangleAlert size={17}/> Recorded allergy</div><p className="mt-2 text-sm text-amber-900">{patient.allergies.join(', ')}</p><p className="mt-2 text-xs leading-5 text-amber-800">Confirm this information with your healthcare professional if it is incorrect or incomplete.</p></div></section>
        <section className="card"><SectionHeading title="Recent alerts" action={<button className="text-sm font-semibold text-forest" onClick={() => navigate('/alerts')}>View all</button>}/>{alerts.slice(0,2).map(a => <div key={a.id} className="flex gap-3 border-t border-slate-100 py-3 first:border-0"><div className="mt-0.5 rounded-lg bg-amber-50 p-2 text-amber-700"><Activity size={16}/></div><div><p className="text-sm font-semibold">{a.title}</p><p className="mt-1 text-xs leading-5 text-muted">{a.detail}</p></div></div>)}</section>
      </div>
    </div>
    <section className="card"><SectionHeading title="Your active medications" subtitle="Your current shared medication profile" action={<button className="text-sm font-semibold text-forest" onClick={() => navigate('/medications')}>See all</button>}/><div className="grid gap-3 md:grid-cols-3">{patient.medications.filter(m => m.status === 'Active').map(m => <div key={m.id} className="rounded-xl border border-slate-100 p-4"><div className="flex items-start justify-between"><div className="rounded-lg bg-mint p-2 text-forest"><Pill size={18}/></div><StatusBadge status={m.status}/></div><p className="mt-4 font-semibold">{m.name}</p><p className="mt-1 text-sm text-muted">{m.strength} · {m.route}</p><p className="mt-3 text-xs text-muted">{m.frequency} · {m.time}</p><p className="mt-2 text-xs text-muted">Prescribed by {m.prescriber}</p></div>)}</div></section>
  </div>
}

function DoctorDashboard() {
  const { patient, prescriptions, createPrescription, discontinuePrescription, history } = useApp()
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', ingredient: '', dose: '', unit: 'mg', route: 'Oral', frequency: 'Once daily', time: '09:00 AM' })
  const [message, setMessage] = useState('')
  const [query, setQuery] = useState('')
  const active = prescriptions.filter(m => m.status === 'Active')
  const runCheck = () => {
    if (!form.name.trim() || !form.ingredient.trim()) { setMessage('Enter a medication name and active ingredient before running the demo check.'); return }
    const ingredient = form.ingredient.trim().toLowerCase()
    const duplicate = active.find(m => (m.ingredient || '').toLowerCase() === ingredient)
    setMessage(duplicate
      ? `Potential duplicate ingredient found: ${duplicate.name}. This is a simulated demo rule; a clinician must verify the evidence.`
      : 'No known match found in the limited demo rules. This does not prove the combination is safe.')
  }
  const submit = (e) => { e.preventDefault(); if (!form.name.trim() || !form.dose.trim() || !form.ingredient.trim()) return; createPrescription(form); setForm({ name: '', ingredient: '', dose: '', unit: 'mg', route: 'Oral', frequency: 'Once daily', time: '09:00 AM' }); setMessage('Demo prescription saved locally. Connect the API before clinical use.'); setShowForm(false) }
  const filtered = prescriptions.filter(m => m.name.toLowerCase().includes(query.toLowerCase()))
  return <div className="space-y-7">
    <div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-sm font-medium text-forest">Clinician workspace</p><h2 className="mt-1 text-2xl font-semibold tracking-tight">Good morning, Dr. Rao</h2><p className="mt-2 text-sm text-muted">Review the shared record and document clinical decisions.</p></div><button onClick={() => {setShowForm(!showForm);setMessage('')}} className="btn-primary"><Pill size={16}/> New prescription</button></div>
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><StatCard label="Authorized patients" value="1" note="Demo patient record" icon={UsersIcon}/><StatCard label="Active prescriptions" value={active.length} note="Across demo records" icon={Pill}/><StatCard label="Needs review" value={patient.doses.filter(d => d.status !== 'taken').length} note="Dose status not confirmed" icon={TriangleAlert} tint="amber"/><StatCard label="Recent events" value={history.length} note="In shared history" icon={Activity} tint="blue"/></div>
    <section className="card"><SectionHeading title="Patient record" subtitle="Only fictional, demo-authorized records are available here."/><div className="flex flex-wrap items-center gap-4 rounded-xl bg-slate-50 p-4"><div className="flex h-12 w-12 items-center justify-center rounded-full bg-mint font-semibold text-forest">AS</div><div className="flex-1"><p className="font-semibold">{patient.name}</p><p className="mt-1 text-sm text-muted">Age {patient.age} · Allergy: {patient.allergies.join(', ')}</p></div><span className="rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700">Demo access</span></div>
      <div className="mt-5 flex flex-wrap items-center justify-between gap-3"><div><p className="font-semibold">Prescription list</p><p className="mt-1 text-sm text-muted">Previous versions remain in history.</p></div><input className="field max-w-xs" value={query} onChange={e => setQuery(e.target.value)} placeholder="Search medication..."/></div>
      <div className="mt-3 overflow-x-auto"><table className="w-full min-w-[600px] text-left text-sm"><thead className="text-xs uppercase tracking-wide text-muted"><tr><th className="py-3">Medication</th><th>Schedule</th><th>Status</th><th>Action</th></tr></thead><tbody>{filtered.map(m => <tr key={m.id} className="border-t border-slate-100"><td className="py-4"><p className="font-semibold">{m.name}</p><p className="mt-1 text-xs text-muted">{m.strength} · {m.route}</p></td><td>{m.frequency}</td><td><StatusBadge status={m.status}/></td><td>{m.status === 'Active' && <button onClick={() => { if (window.confirm(`Mark ${m.name} as discontinued in this demo?`)) discontinuePrescription(m.id) }} className="text-xs font-semibold text-rose-700 hover:underline">Discontinue</button>}</td></tr>)}</tbody></table></div>
    </section>
    {showForm && <section className="card"><SectionHeading title="Create prescription" subtitle="Demo-only form; prescriber identity is fixed by the application."/><form onSubmit={submit} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <label className="form-label">Medication name<input required className="field" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="Medication name"/></label>
      <label className="form-label">Active ingredient<input required className="field" value={form.ingredient} onChange={e=>setForm({...form,ingredient:e.target.value})} placeholder="Ingredient (for demo rule)"/></label>
      <label className="form-label">Dose<input required className="field" value={form.dose} onChange={e=>setForm({...form,dose:e.target.value})} placeholder="e.g. 500"/></label>
      <label className="form-label">Unit<select className="field" value={form.unit} onChange={e=>setForm({...form,unit:e.target.value})}><option>mg</option><option>mcg</option><option>g</option><option>IU</option><option>mL</option></select></label>
      <label className="form-label">Route<select className="field" value={form.route} onChange={e=>setForm({...form,route:e.target.value})}><option>Oral</option><option>Topical</option><option>Inhalation</option><option>Injection</option><option>Other</option></select></label>
      <label className="form-label">Frequency<select className="field" value={form.frequency} onChange={e=>setForm({...form,frequency:e.target.value})}><option>Once daily</option><option>Twice daily</option><option>Three times daily</option><option>As directed</option></select></label>
      <label className="form-label">Scheduled time<input className="field" value={form.time} onChange={e=>setForm({...form,time:e.target.value})} placeholder="09:00 AM"/></label>
      <div className="flex flex-wrap items-end gap-2 sm:col-span-2 lg:col-span-3"><button type="button" onClick={runCheck} className="btn-secondary"><ShieldCheck size={16}/> Run demo safety check</button><button type="submit" className="btn-primary">Save demo prescription</button><button type="button" onClick={()=>setShowForm(false)} className="btn-secondary">Cancel</button></div>
    </form>{message && <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">{message}</div>}</section>}
    <section className="card"><SectionHeading title="Recent clinical history" subtitle="Audit-friendly event timeline"/>{history.slice(0,4).map(h => <div key={h.id} className="flex gap-3 border-t border-slate-100 py-3 first:border-0"><div className="mt-1 rounded-lg bg-mint p-2 text-forest"><Activity size={16}/></div><div><p className="text-sm font-semibold">{h.type}</p><p className="mt-1 text-sm text-muted">{h.detail}</p><p className="mt-1 text-xs text-slate-400">{h.time} · {h.actor}</p></div></div>)}</section>
  </div>
}
function UsersIcon(props) { return <Activity {...props}/> }

function CaregiverDashboard() {
  const { patient, alerts, acknowledgeAlert, history } = useApp()
  const missed = patient.doses.filter(d => d.status === 'missed').length
  return <div className="space-y-7"><div><p className="text-sm font-medium text-forest">Care team workspace</p><h2 className="mt-1 text-2xl font-semibold tracking-tight">Medication support overview</h2><p className="mt-2 text-sm text-muted">Fictional patient record shared for this demo.</p></div>
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><StatCard label="Supported patients" value="1" note="Authorized demo record" icon={Activity}/><StatCard label="Active medicines" value={patient.medications.filter(m=>m.status==='Active').length} note="Current medication list" icon={Pill}/><StatCard label="Missed doses" value={missed} note="Requires follow-up" icon={TriangleAlert} tint={missed?'amber':'green'}/><StatCard label="Alerts" value={alerts.filter(a=>a.status!=='Acknowledged').length} note="Awaiting acknowledgement" icon={Clock3} tint="blue"/></div>
    <section className="card"><SectionHeading title="Patient adherence" subtitle={patient.name}/><div className="rounded-xl bg-slate-50 p-4"><div className="flex items-center justify-between"><div><p className="font-semibold">{patient.name}</p><p className="mt-1 text-sm text-muted">Today's dose status</p></div><span className="text-sm font-semibold text-forest">{patient.doses.filter(d=>d.status==='taken').length} of {patient.doses.length} taken</span></div><div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-200"><div className="h-full rounded-full bg-forest" style={{width:`${patient.doses.filter(d=>d.status==='taken').length/Math.max(1,patient.doses.length)*100}%`}}/></div></div></section>
    <section className="card"><SectionHeading title="Alerts requiring attention" subtitle="Acknowledge to record that the alert has been seen."/><div className="space-y-3">{alerts.map(a=><div key={a.id} className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-100 p-4"><div className="rounded-xl bg-amber-50 p-3 text-amber-700"><TriangleAlert size={19}/></div><div className="min-w-[180px] flex-1"><p className="font-semibold">{a.title}</p><p className="mt-1 text-sm text-muted">{a.detail}</p><p className="mt-1 text-xs text-slate-400">{a.time}</p></div><StatusBadge status={a.status}/>{a.status!=='Acknowledged'&&<button onClick={()=>acknowledgeAlert(a.id)} className="btn-small-primary">Acknowledge</button>}</div>)}</div></section>
    <section className="card"><SectionHeading title="Latest events"/>{history.slice(0,3).map(h=><div key={h.id} className="border-t border-slate-100 py-3 first:border-0"><p className="text-sm font-semibold">{h.type}</p><p className="mt-1 text-sm text-muted">{h.detail}</p><p className="mt-1 text-xs text-slate-400">{h.time}</p></div>)}</section>
  </div>
}

export default function Dashboard({ role }) {
  if (role === 'doctor') return <DoctorDashboard/>
  if (role === 'caregiver') return <CaregiverDashboard/>
  return <PatientDashboard/>
}
