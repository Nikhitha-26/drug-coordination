import { AlertCircle, CheckCircle2, Clock3, XCircle } from 'lucide-react'

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

export function StatusBadge({ status }) {
  const map = {
    taken: ['bg-emerald-50 text-emerald-700', <CheckCircle2 size={13}/>],
    pending: ['bg-amber-50 text-amber-700', <Clock3 size={13}/>],
    missed: ['bg-rose-50 text-rose-700', <XCircle size={13}/>],
    Active: ['bg-emerald-50 text-emerald-700', <CheckCircle2 size={13}/>],
    Discontinued: ['bg-slate-100 text-slate-600', <XCircle size={13}/>],
    Created: ['bg-amber-50 text-amber-700', <Clock3 size={13}/>],
    Delivered: ['bg-sky-50 text-sky-700', <CheckCircle2 size={13}/>],
    Acknowledged: ['bg-emerald-50 text-emerald-700', <CheckCircle2 size={13}/>]
  }
  const [style, Icon] = map[status] || ['bg-slate-100 text-slate-600', <AlertCircle size={13}/>]
  return <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium capitalize ${style}`}><Icon/>{status}</span>
}

export function SectionHeading({ title, subtitle, action }) {
  return <div className="mb-4 flex flex-wrap items-end justify-between gap-3"><div><h2 className="text-lg font-semibold">{title}</h2>{subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}</div>{action}</div>
}

export function EmptyState({ title, detail }) {
  return <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center"><p className="font-medium">{title}</p><p className="mt-1 text-sm text-muted">{detail}</p></div>
}
