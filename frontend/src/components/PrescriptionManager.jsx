import { useState } from 'react'
import { Pencil, Pill, ShieldCheck } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { EmptyState, SafetyResult, SectionHeading, StatusBadge } from './ui'
import { checkMedication, worstSeverity } from '../services/safety'

const emptyForm = { name: '', ingredient: '', dose: '', unit: 'mg', route: 'Oral', frequency: 'Once daily', time: '09:00 AM' }

function toForm(m) {
  const [dose = '', unit = 'mg'] = (m.strength || '').split(' ')
  return { name: m.name, ingredient: m.ingredient || '', dose, unit, route: m.route, frequency: m.frequency, time: m.time }
}

export default function PrescriptionManager() {
  const { patient, prescriptions, createPrescription, modifyPrescription, discontinuePrescription, recordSafetyCheck } = useApp()
  const [open, setOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [result, setResult] = useState(null)
  const [notice, setNotice] = useState('')
  const [query, setQuery] = useState('')

  const active = prescriptions.filter(m => m.status === 'Active')
  const set = (key) => (e) => { setForm({ ...form, [key]: e.target.value }); setResult(null) }
  const filtered = prescriptions.filter(m => m.name.toLowerCase().includes(query.toLowerCase()))

  const close = () => { setOpen(false); setEditingId(null); setForm(emptyForm); setResult(null) }
  const startNew = () => { setNotice(''); setEditingId(null); setForm(emptyForm); setResult(null); setOpen(true) }
  const startEdit = (m) => { setNotice(''); setEditingId(m.id); setForm(toForm(m)); setResult(null); setOpen(true) }

  // When editing, compare against the other active medicines only.
  const compareList = () => active.filter(m => m.id !== editingId)
  const runCheck = () => {
    const r = checkMedication(form, patient, compareList())
    setResult(r)
    if (!r.incomplete) recordSafetyCheck(form.name.trim(), form.ingredient.trim().toLowerCase(), r.findings.length)
    return r
  }

  const submit = (e) => {
    e.preventDefault()
    const r = result || runCheck()
    if (r.findings.length && worstSeverity(r.findings) !== 'moderate') {
      if (!window.confirm('The demo safety check flagged a serious issue. Save this prescription anyway? A clinician must verify the evidence.')) return
    }
    if (editingId) modifyPrescription(editingId, form)
    else createPrescription(form)
    setNotice(editingId ? 'Prescription updated. The change is recorded in shared history.' : 'Prescription saved locally and added to the patient profile. Connect the API before clinical use.')
    close()
  }

  return <div className="space-y-6">
    <section className="card">
      <SectionHeading title="Prescription list" subtitle={`${patient.name} · previous versions remain in history.`} action={<button onClick={startNew} className="btn-primary"><Pill size={16}/> New prescription</button>}/>
      {notice && <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">{notice}</div>}
      <input className="field mb-3 max-w-xs" value={query} onChange={e => setQuery(e.target.value)} placeholder="Search medication..." aria-label="Search medication"/>
      {filtered.length === 0 ? <EmptyState title="No prescriptions found" detail="Try a different search term."/> :
        <div className="overflow-x-auto"><table className="w-full min-w-[640px] text-left text-sm">
          <thead className="text-xs uppercase tracking-wide text-muted"><tr><th className="py-3">Medication</th><th>Schedule</th><th>Prescriber</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>{filtered.map(m => <tr key={m.id} className="border-t border-slate-100">
            <td className="py-4"><p className="font-semibold">{m.name}</p><p className="mt-1 text-xs text-muted">{m.strength} · {m.route}</p></td>
            <td>{m.frequency}<p className="mt-1 text-xs text-muted">{m.time}</p></td>
            <td className="text-muted">{m.prescriber}</td>
            <td><StatusBadge status={m.status}/></td>
            <td>{m.status === 'Active' && <div className="flex gap-3">
              <button onClick={() => startEdit(m)} className="inline-flex items-center gap-1 text-xs font-semibold text-forest hover:underline"><Pencil size={12}/> Modify</button>
              <button onClick={() => { if (window.confirm(`Mark ${m.name} as discontinued in this demo?`)) discontinuePrescription(m.id) }} className="text-xs font-semibold text-rose-700 hover:underline">Discontinue</button>
            </div>}</td>
          </tr>)}</tbody>
        </table></div>}
    </section>

    {open && <section className="card">
      <SectionHeading title={editingId ? 'Modify prescription' : 'Create prescription'} subtitle="Demo-only form; prescriber identity is fixed by the application."/>
      <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <label className="form-label">Medication name<input required className="field" value={form.name} onChange={set('name')} placeholder="Medication name"/></label>
        <label className="form-label">Active ingredient<input required className="field" value={form.ingredient} onChange={set('ingredient')} placeholder="e.g. metformin"/></label>
        <label className="form-label">Dose<input required className="field" value={form.dose} onChange={set('dose')} placeholder="e.g. 500"/></label>
        <label className="form-label">Unit<select className="field" value={form.unit} onChange={set('unit')}><option>mg</option><option>mcg</option><option>g</option><option>IU</option><option>mL</option></select></label>
        <label className="form-label">Route<select className="field" value={form.route} onChange={set('route')}><option>Oral</option><option>Topical</option><option>Inhalation</option><option>Injection</option><option>Other</option></select></label>
        <label className="form-label">Frequency<select className="field" value={form.frequency} onChange={set('frequency')}><option>Once daily</option><option>Twice daily</option><option>Three times daily</option><option>As directed</option></select></label>
        <label className="form-label">Scheduled time<input className="field" value={form.time} onChange={set('time')} placeholder="09:00 AM"/></label>
        <div className="flex flex-wrap items-end gap-2 sm:col-span-2 lg:col-span-3">
          <button type="button" onClick={runCheck} className="btn-secondary"><ShieldCheck size={16}/> Run demo safety check</button>
          <button type="submit" className="btn-primary">{editingId ? 'Save changes' : 'Save demo prescription'}</button>
          <button type="button" onClick={close} className="btn-secondary">Cancel</button>
        </div>
      </form>
      {result && <div className="mt-4"><SafetyResult result={result}/></div>}
    </section>}
  </div>
}