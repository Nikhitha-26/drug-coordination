import { AlertCircle, AlertTriangle, CheckCircle2, Clock3, ShieldAlert, ShieldCheck, XCircle } from 'lucide-react'

export function StatCard({ label, value, note, icon: Icon, tint = 'green' }) {
  const tints = {
    green: 'bg-mint text-forest',
    amber: 'bg-amber-50 text-amber-700',
    blue: 'bg-sky-50 text-sky-700',
    rose: 'bg-rose-50 text-rose-700'
  }
  return <div className="card flex items-start justify-between gap-3">
    <div><p className="text-sm text-muted">{label}</p><p className="mt-2 text-3xl font-semibold tracking-tight">{value}</p><p className="mt-1 text-xs text-muted">{note}</p></div>
    <div className={`rounded-xl p-3 ${tints[tint]}`}><Icon size={20}/></div>
  </div>
}

const badgeMap = {
  taken: ['bg-emerald-50 text-emerald-700', CheckCircle2],
  pending: ['bg-amber-50 text-amber-700', Clock3],
  missed: ['bg-rose-50 text-rose-700', XCircle],
  Active: ['bg-emerald-50 text-emerald-700', CheckCircle2],
  Discontinued: ['bg-slate-100 text-slate-600', XCircle],
  Created: ['bg-amber-50 text-amber-700', Clock3],
  Delivered: ['bg-sky-50 text-sky-700', CheckCircle2],
  Acknowledged: ['bg-emerald-50 text-emerald-700', CheckCircle2],
  Resolved: ['bg-slate-100 text-slate-600', CheckCircle2]
}

export function StatusBadge({ status }) {
  const [style, Icon] = badgeMap[status] || ['bg-slate-100 text-slate-600', AlertCircle]
  return <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium capitalize ${style}`}><Icon size={13}/>{status}</span>
}

export function SectionHeading({ title, subtitle, action }) {
  return <div className="mb-4 flex flex-wrap items-end justify-between gap-3"><div><h2 className="text-lg font-semibold">{title}</h2>{subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}</div>{action}</div>
}

export function EmptyState({ title, detail }) {
  return <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center"><p className="font-medium">{title}</p><p className="mt-1 text-sm text-muted">{detail}</p></div>
}

const findingStyle = {
  high: ['border-rose-200 bg-rose-50 text-rose-900', ShieldAlert, 'Allergy'],
  major: ['border-rose-200 bg-rose-50 text-rose-900', ShieldAlert, 'Major'],
  moderate: ['border-amber-200 bg-amber-50 text-amber-900', AlertTriangle, 'Moderate']
}

// Shows the output of services/safety.js checkMedication().
export function SafetyResult({ result }) {
  if (!result) return null
  if (result.incomplete) {
    return <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 text-sm leading-6"><div className="flex items-center gap-2 font-semibold"><Clock3 size={18}/> Unable to verify</div><p className="mt-2">Enter a medication name and active ingredient. The demo cannot verify incomplete medication information.</p></div>
  }
  if (result.findings.length === 0) {
    return <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-sm leading-6 text-emerald-900"><div className="flex items-center gap-2 font-semibold"><ShieldCheck size={18}/> No known match found</div><p className="mt-2">No allergy, duplicate or interaction match in the limited demo rules. This does not prove the combination is safe; a clinician must review it.</p></div>
  }
  return <div className="space-y-3">{result.findings.map((f, i) => {
    const [style, Icon, label] = findingStyle[f.severity] || findingStyle.moderate
    return <div key={i} className={`rounded-2xl border p-4 text-sm leading-6 ${style}`}>
      <div className="flex items-center gap-2 font-semibold"><Icon size={18}/> {f.title}<span className="ml-auto rounded-full bg-white/70 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide">{label}</span></div>
      <p className="mt-1.5">{f.detail}</p>
    </div>
  })}<p className="text-xs leading-5 text-muted">Simulated demo rules, not verified clinical evidence. Review status: pending clinician review.</p></div>
}