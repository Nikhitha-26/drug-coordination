import { useState } from 'react'
import { Activity, ArrowRight, CalendarDays, Check, CheckCircle2, Clock3, Pill, TriangleAlert, Users } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { EmptyState, SectionHeading, StatCard, StatusBadge } from '../components/ui'

function greeting() {
  const h = new Date().getHours()
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'
}

function PatientDashboard() {
  const { patient, markDose, alerts } = useApp()
  const navigate = useNavigate()
  const taken = patient.doses.filter(d => d.status === 'taken').length
  const pending = patient.doses.filter(d => d.status === 'pending').length
  const missed = patient.doses.filter(d => d.status === 'missed').length
  const today = new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })
  const activeMeds = patient.medications.filter(m => m.status === 'Active')
  return <div className="space-y-7">
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div><p className="text-sm font-medium text-forest">{greeting()}, Aarav</p><h2 className="mt-1 text-2xl font-semibold tracking-tight">Your health, in sync.</h2><p className="mt-2 text-sm text-muted">{today} · Here's your medication overview.</p></div>
      <button onClick={() => navigate('/schedule')} className="btn-primary"><CalendarDays size={16}/> View schedule</button>
    </div>
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard label="Active medications" value={activeMeds.length} note="Across your care team" icon={Pill}/>
      <StatCard label="Doses due today" value={patient.doses.length} note="Scheduled doses" icon={Clock3} tint="blue"/>
      <StatCard label="Doses taken" value={taken} note={`${Math.round(taken / Math.max(1, patient.doses.length) * 100)}% of today's schedule`} icon={CheckCircle2}/>
      <StatCard label="Pending actions" value={pending + missed} note="Needs your attention" icon={TriangleAlert} tint={pending + missed ? 'amber' : 'green'}/>
    </div>
    <div className="grid gap-6 xl:grid-cols-[1.45fr_.85fr]">
      <section className="card">
        <SectionHeading title="Today's medication schedule" subtitle="Record each dose when appropriate." action={<button className="text-sm font-semibold text-forest" onClick={() => navigate('/schedule')}>Full schedule <ArrowRight className="ml-1 inline" size={15}/></button>}/>
        {patient.doses.length === 0 && <EmptyState title="No doses scheduled" detail="Active prescriptions will appear here."/>}
        <div className="divide-y divide-slate-100">{patient.doses.map(dose => <div key={dose.id} className="flex flex-wrap items-center gap-3 py-4 first:pt-1 last:pb-1">
          <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${dose.status === 'taken' ? 'bg-mint text-forest' : 'bg-slate-50 text-slate-500'}`}><Pill size={20}/></div>
          <div className="min-w-[130px] flex-1"><p className="font-semibold">{dose.medicine}</p><p className="mt-1 text-xs text-muted">{dose.dose} · {dose.time}</p></div>
          <StatusBadge status={dose.status}/>
          {dose.status === 'pending' && <div className="flex gap-2"><button onClick={() => markDose(dose.id, 'taken')} className="btn-small-primary"><Check size={14}/> Taken</button><button onClick={() => markDose(dose.id, 'missed')} className="btn-small-secondary">Missed</button></div>}
        </div>)}</div>
      </section>
      <div className="space-y-6">
        <section className="card">
          <SectionHeading title="Allergies" subtitle="Information recorded in your profile"/>
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4"><div className="flex items-center gap-2 font-semibold text-amber-900"><TriangleAlert size={17}/> Recorded allergy</div><p className="mt-2 text-sm text-amber-900">{patient.allergies.join(', ')}</p><p className="mt-2 text-xs leading-5 text-amber-800">Confirm this information with your healthcare professional if it is incorrect or incomplete.</p></div>
        </section>
        <section className="card">
          <SectionHeading title="Recent alerts" action={<button className="text-sm font-semibold text-forest" onClick={() => navigate('/alerts')}>View all</button>}/>
          {alerts.length === 0 && <p className="text-sm text-muted">No alerts.</p>}
          {alerts.slice(0, 2).map(a => <div key={a.id} className="flex gap-3 border-t border-slate-100 py-3 first:border-0"><div className="mt-0.5 rounded-lg bg-amber-50 p-2 text-amber-700"><Activity size={16}/></div><div><p className="text-sm font-semibold">{a.title}</p><p className="mt-1 text-xs leading-5 text-muted">{a.detail}</p></div></div>)}
        </section>
      </div>
    </div>
    <section className="card">
      <SectionHeading title="Your active medications" subtitle="Your current shared medication profile" action={<button className="text-sm font-semibold text-forest" onClick={() => navigate('/medications')}>See all</button>}/>
      <div className="grid gap-3 md:grid-cols-3">{activeMeds.map(m => <div key={m.id} className="rounded-xl border border-slate-100 p-4">
        <div className="flex items-start justify-between"><div className="rounded-lg bg-mint p-2 text-forest"><Pill size={18}/></div><StatusBadge status={m.status}/></div>
        <p className="mt-4 font-semibold">{m.name}</p><p className="mt-1 text-sm text-muted">{m.strength} · {m.route}</p>
        <p className="mt-3 text-xs text-muted">{m.frequency} · {m.time}</p><p className="mt-2 text-xs text-muted">Prescribed by {m.prescriber}</p>
      </div>)}</div>
    </section>
  </div>
}

function DoctorDashboard() {
  const { patient, prescriptions, history, alerts } = useApp()
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const active = prescriptions.filter(m => m.status === 'Active')
  const filtered = active.filter(m => m.name.toLowerCase().includes(query.toLowerCase()))
  const missed = patient.doses.filter(d => d.status === 'missed').length
  return <div className="space-y-7">
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div><p className="text-sm font-medium text-forest">Clinician workspace</p><h2 className="mt-1 text-2xl font-semibold tracking-tight">{greeting()}, Dr. Rao</h2><p className="mt-2 text-sm text-muted">Review the shared record and document clinical decisions.</p></div>
      <button onClick={() => navigate('/prescriptions')} className="btn-primary"><Pill size={16}/> Manage prescriptions</button>
    </div>
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard label="Authorized patients" value="1" note="Demo patient record" icon={Users}/>
      <StatCard label="Active prescriptions" value={active.length} note="Across demo records" icon={Pill}/>
      <StatCard label="Adherence concerns" value={missed} note="Missed doses recorded today" icon={TriangleAlert} tint={missed ? 'rose' : 'green'}/>
      <StatCard label="Recent events" value={history.length} note="In shared history" icon={Activity} tint="blue"/>
    </div>
    {missed > 0 && <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-900"><span className="font-semibold">Adherence notice:</span> {patient.name} has {missed} missed dose{missed > 1 ? 's' : ''} today. {alerts.filter(a => a.status !== 'Acknowledged').length} alert(s) await acknowledgement by the care team.</div>}
    <section className="card">
      <SectionHeading title="Patient record" subtitle="Only fictional, demo-authorized records are available here."/>
      <div className="flex flex-wrap items-center gap-4 rounded-xl bg-slate-50 p-4"><div className="flex h-12 w-12 items-center justify-center rounded-full bg-mint font-semibold text-forest">AS</div><div className="flex-1"><p className="font-semibold">{patient.name}</p><p className="mt-1 text-sm text-muted">Age {patient.age} · Allergy: {patient.allergies.join(', ')}</p></div><span className="rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700">Demo access</span></div>
      <div className="mt-5 flex flex-wrap items-center justify-between gap-3"><div><p className="font-semibold">Active medications</p><p className="mt-1 text-sm text-muted">Create, modify or discontinue from Prescriptions.</p></div><input className="field max-w-xs" value={query} onChange={e => setQuery(e.target.value)} placeholder="Search medication..." aria-label="Search medication"/></div>
      <div className="mt-3 overflow-x-auto"><table className="w-full min-w-[520px] text-left text-sm">
        <thead className="text-xs uppercase tracking-wide text-muted"><tr><th className="py-3">Medication</th><th>Schedule</th><th>Status</th></tr></thead>
        <tbody>{filtered.map(m => <tr key={m.id} className="border-t border-slate-100"><td className="py-4"><p className="font-semibold">{m.name}</p><p className="mt-1 text-xs text-muted">{m.strength} · {m.route}</p></td><td>{m.frequency}</td><td><StatusBadge status={m.status}/></td></tr>)}</tbody>
      </table>{filtered.length === 0 && <div className="mt-3"><EmptyState title="No active medications match" detail="Try a different search term."/></div>}</div>
    </section>
    <section className="card">
      <SectionHeading title="Recent clinical history" subtitle="Audit-friendly event timeline" action={<button className="text-sm font-semibold text-forest" onClick={() => navigate('/history')}>Full history</button>}/>
      {history.slice(0, 4).map(h => <div key={h.id} className="flex gap-3 border-t border-slate-100 py-3 first:border-0"><div className="mt-1 rounded-lg bg-mint p-2 text-forest"><Activity size={16}/></div><div><p className="text-sm font-semibold">{h.type}</p><p className="mt-1 text-sm text-muted">{h.detail}</p><p className="mt-1 text-xs text-slate-400">{h.time} · {h.actor}</p></div></div>)}
    </section>
  </div>
}

function CaregiverDashboard() {
  const { patient, alerts, acknowledgeAlert, history } = useApp()
  const navigate = useNavigate()
  const missed = patient.doses.filter(d => d.status === 'missed').length
  const taken = patient.doses.filter(d => d.status === 'taken').length
  const open = alerts.filter(a => a.status !== 'Acknowledged')
  return <div className="space-y-7">
    <div><p className="text-sm font-medium text-forest">Care team workspace</p><h2 className="mt-1 text-2xl font-semibold tracking-tight">Medication support overview</h2><p className="mt-2 text-sm text-muted">Fictional patient record shared for this demo.</p></div>
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard label="Supported patients" value="1" note="Authorized demo record" icon={Activity}/>
      <StatCard label="Active medicines" value={patient.medications.filter(m => m.status === 'Active').length} note="Current medication list" icon={Pill}/>
      <StatCard label="Missed doses" value={missed} note="Requires follow-up" icon={TriangleAlert} tint={missed ? 'amber' : 'green'}/>
      <StatCard label="Open alerts" value={open.length} note="Awaiting acknowledgement" icon={Clock3} tint="blue"/>
    </div>
    <section className="card">
      <SectionHeading title="Patient adherence" subtitle={patient.name}/>
      <div className="rounded-xl bg-slate-50 p-4">
        <div className="flex items-center justify-between"><div><p className="font-semibold">{patient.name}</p><p className="mt-1 text-sm text-muted">Today's dose status</p></div><span className="text-sm font-semibold text-forest">{taken} of {patient.doses.length} taken</span></div>
        <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-200"><div className="h-full rounded-full bg-forest transition-all" style={{ width: `${taken / Math.max(1, patient.doses.length) * 100}%` }}/></div>
      </div>
    </section>
    <section className="card">
      <SectionHeading title="Alerts requiring attention" subtitle="Acknowledge to record that the alert has been seen." action={<button className="text-sm font-semibold text-forest" onClick={() => navigate('/alerts')}>View all</button>}/>
      {alerts.length === 0 && <EmptyState title="No alerts" detail="Nothing needs attention."/>}
      <div className="space-y-3">{alerts.map(a => <div key={a.id} className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-100 p-4">
        <div className="rounded-xl bg-amber-50 p-3 text-amber-700"><TriangleAlert size={19}/></div>
        <div className="min-w-[180px] flex-1"><p className="font-semibold">{a.title}</p><p className="mt-1 text-sm text-muted">{a.detail}</p><p className="mt-1 text-xs text-slate-400">{a.time}</p></div>
        <StatusBadge status={a.status}/>
        {a.status !== 'Acknowledged' && <button onClick={() => acknowledgeAlert(a.id)} className="btn-small-primary">Acknowledge</button>}
      </div>)}</div>
    </section>
    <section className="card">
      <SectionHeading title="Latest events"/>
      {history.slice(0, 3).map(h => <div key={h.id} className="border-t border-slate-100 py-3 first:border-0"><p className="text-sm font-semibold">{h.type}</p><p className="mt-1 text-sm text-muted">{h.detail}</p><p className="mt-1 text-xs text-slate-400">{h.time}</p></div>)}
    </section>
  </div>
}

function PharmacyDashboard() {
  const navigate = useNavigate()
  const { patient, history } = useApp()

  const activeMeds = patient.medications.filter(m => m.status === 'Active')

  return (
    <div className="space-y-7">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-forest">Pharmacy workspace</p>
          <h2 className="mt-1 text-2xl font-semibold tracking-tight">
            Refill coordination
          </h2>
          <p className="mt-2 text-sm text-muted">
            Demo pharmacy · Simulated refill requests only
          </p>
        </div>
        <button onClick={() => navigate('/refills')} className="btn-primary">
          <Pill size={16} /> View refill requests
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Active medication records"
          value={activeMeds.length}
          note="Demo patient only"
          icon={Pill}
        />
        <StatCard
          label="Refill requests"
          value={(() => { try { return JSON.parse(localStorage.getItem('medisync-refill-network') || '[]').length } catch { return 0 } })()}
          note="Demo requests in this browser"
          icon={Activity}
          tint="blue"
        />
        <StatCard
          label="Demo pharmacies"
          value="3"
          note="Simulated listings only"
          icon={CheckCircle2}
        />
        <StatCard
          label="Recent shared events"
          value={history.length}
          note="Demo history"
          icon={Clock3}
        />
      </div>

      <section className="card">
        <SectionHeading
          title="Pharmacy features"
          subtitle="Respond to patient-authorized demo refill requests."
        />
        <div className="grid gap-4 md:grid-cols-2">
          <button onClick={() => navigate('/refills')} className="rounded-xl border border-slate-100 p-4 text-left transition hover:border-forest">
            <Activity className="text-forest" size={22} />
            <h3 className="mt-3 font-semibold">Smart refill requests</h3>
            <p className="mt-2 text-sm text-muted">
              Review patient-authorized refill requests and record Available, Unavailable, or Unable to Confirm.
            </p>
          </button>
          <div className="rounded-xl border border-slate-100 p-4">
            <CheckCircle2 className="text-forest" size={22} />
            <h3 className="mt-3 font-semibold">Fulfilment tracking</h3>
            <p className="mt-2 text-sm text-muted">
              Patients can save a pickup or delivery preference after a demo Available response.
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}

function AdminDashboard() {
  const navigate = useNavigate()
  const { history, alerts } = useApp()

  return (
    <div className="space-y-7">
      <div>
        <p className="text-sm font-medium text-forest">Administration workspace</p>
        <h2 className="mt-1 text-2xl font-semibold tracking-tight">
          MediSync system overview
        </h2>
        <p className="mt-2 text-sm text-muted">
          Demo monitoring · No real provider accounts or patient data
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Provider applications"
          value="0"
          note="Verification workflow to be implemented"
          icon={Users}
        />
        <StatCard
          label="Open alerts"
          value={alerts.filter(a => a.status !== 'Acknowledged').length}
          note="Across demo data"
          icon={TriangleAlert}
          tint="amber"
        />
        <StatCard
          label="Recorded events"
          value={history.length}
          note="Current demo history"
          icon={Activity}
          tint="blue"
        />
        <StatCard
          label="Verification status"
          value="Demo"
          note="No real identity checks"
          icon={CheckCircle2}
        />
      </div>

      <section className="card">
        <SectionHeading
          title="Administration tools"
          subtitle="Open an area to review the existing demo data."
        />
        <div className="grid gap-4 md:grid-cols-2">
          <button
            onClick={() => navigate('/history')}
            className="rounded-xl border border-slate-100 p-4 text-left transition hover:border-forest"
          >
            <Activity className="text-forest" size={22} />
            <h3 className="mt-3 font-semibold">Audit history</h3>
            <p className="mt-2 text-sm text-muted">
              Review the events currently recorded in the demo.
            </p>
          </button>
          <button
            onClick={() => navigate('/alerts')}
            className="rounded-xl border border-slate-100 p-4 text-left transition hover:border-forest"
          >
            <TriangleAlert className="text-forest" size={22} />
            <h3 className="mt-3 font-semibold">System alerts</h3>
            <p className="mt-2 text-sm text-muted">
              Review the current demo alert list.
            </p>
          </button>
        </div>
      </section>
    </div>
  )
}

export default function Dashboard({ role }) {
  if (role === 'doctor') return <DoctorDashboard />
  if (role === 'caregiver') return <CaregiverDashboard />
  if (role === 'pharmacy') return <PharmacyDashboard />
  if (role === 'admin') return <AdminDashboard />
  return <PatientDashboard />
}
