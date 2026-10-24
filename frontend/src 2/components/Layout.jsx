import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import {
  Activity, Bell, CalendarClock, ChevronLeft, ChevronRight, FileText, HeartPulse,
  History, LayoutDashboard, LogOut, MapPin, Menu, Pill, RotateCcw, Search,
  ShieldCheck, UserRound, Users, X, Printer, CheckCheck, Clock3
} from 'lucide-react'
import { useMemo, useState } from 'react'
import { useApp } from '../context/AppContext'

const navByRole = {
  patient: [
    ['Dashboard', '/', LayoutDashboard], ['Medications', '/medications', Pill], ['Refills', '/refills', FileText],
    ['Dose schedule', '/schedule', CalendarClock], ['Find medicines', '/pharmacies', MapPin], ['Safety center', '/safety', ShieldCheck],
    ['Alerts', '/alerts', Bell], ['History', '/history', History]
  ],
  doctor: [
    ['Dashboard', '/', LayoutDashboard], ['Patients', '/patients', Users], ['Prescriptions', '/prescriptions', FileText],
    ['Safety center', '/safety', ShieldCheck], ['History', '/history', History]
  ],
  caregiver: [
    ['Dashboard', '/', LayoutDashboard], ['Patients', '/patients', Users], ['Find medicines', '/pharmacies', MapPin], ['Alerts', '/alerts', Bell], ['History', '/history', History]
  ],
  pharmacy: [['Dashboard', '/', LayoutDashboard], ['Refill Requests', '/refills', FileText], ['History', '/history', History]],
  admin: [['Dashboard', '/', LayoutDashboard], ['Audit history', '/history', History]],
}
const titles = {
  '/': 'Dashboard', '/medications': 'Medications', '/schedule': 'Dose schedule', '/safety': 'Medication Safety Shield',
  '/alerts': 'Alerts & notifications', '/history': 'Shared medication history', '/patients': 'Patient records',
  '/prescriptions': 'Prescriptions', '/pharmacies': 'Find medicines nearby', '/refills': 'Smart Refill Network',
}
const userName = { doctor: 'Dr. Meera Rao', caregiver: 'Ananya Sharma', patient: 'Aarav Sharma', pharmacy: 'Demo Pharmacy', admin: 'MediLink Administrator' }
const safe = (value) => String(value ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c])

function printReport(title, subtitle, rows, headers = ['Item', 'Details', 'Status']) {
  const htmlRows = rows.map(row => `<tr>${row.map(cell => `<td>${safe(cell)}</td>`).join('')}</tr>`).join('')
  const html = `<!doctype html><html><head><meta charset="utf-8"><title>${safe(title)}</title><style>
    body{font:14px/1.55 Inter,Arial,sans-serif;color:#202b25;margin:40px}h1{font-size:25px;margin:0 0 6px}p{color:#66736a;margin:0 0 26px}.meta{font-size:11px;color:#7b857e;margin-top:32px}table{width:100%;border-collapse:collapse}th,td{text-align:left;padding:11px 12px;border-bottom:1px solid #e5e9e2;vertical-align:top}th{background:#f2f5ef;font-size:10px;text-transform:uppercase;letter-spacing:.08em}@media print{body{margin:16mm}button{display:none}}
    </style></head><body><h1>${safe(title)}</h1><p>${safe(subtitle)}</p><table><thead><tr>${headers.map(h => `<th>${safe(h)}</th>`).join('')}</tr></thead><tbody>${htmlRows || `<tr><td colspan="${headers.length}">No records available.</td></tr>`}</tbody></table><div class="meta">MediLink demo · Fictional data only · Generated ${safe(new Date().toLocaleString())}</div><script>window.onload=()=>window.print()</script></body></html>`
  const win = window.open('', '_blank', 'width=900,height=700')
  if (!win) { window.alert('Your browser blocked the report window. Allow pop-ups for this local app, then try again.'); return }
  win.document.open(); win.document.write(html); win.document.close()
}

export default function Layout({ role, onExit, children }) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const [search, setSearch] = useState('')
  const [searchOpen, setSearchOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const { alerts, resetDemo, acknowledgeAlert, patient, prescriptions, history } = useApp()
  const unread = alerts.filter(a => a.status !== 'Acknowledged').length
  const nav = navByRole[role] || navByRole.patient
  const roleName = role === 'caregiver' ? 'Caretaker' : role === 'admin' ? 'Administrator' : role === 'pharmacy' ? 'Pharmacy' : role.charAt(0).toUpperCase() + role.slice(1)

  const searchResults = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return []
    const results = []
    const add = (type, title, detail, path, key) => {
      if (`${type} ${title} ${detail}`.toLowerCase().includes(q)) results.push({ type, title, detail, path, key })
    }
    add('Patient', patient.name, `${patient.conditions?.join(', ') || 'Patient profile'} · allergies and care details`, '/patients', 'patient')
    ;(patient.medications || []).forEach(m => add('Medication', m.name, `${m.strength || ''} · ${m.frequency || ''} · ${m.status || 'Listed'}`, role === 'doctor' ? '/prescriptions' : '/medications', m.id))
    ;(prescriptions || []).forEach(m => add('Prescription', m.name, `${m.strength || ''} · ${m.status || 'Listed'} · ${m.prescriber || ''}`, '/prescriptions', m.id))
    ;(alerts || []).forEach(a => add('Alert', a.title, `${a.detail || ''} · ${a.status || ''}`, '/alerts', a.id))
    ;(history || []).forEach(h => add('History', h.type, `${h.detail || ''} · ${h.time || ''}`, '/history', h.id))
    return results.slice(0, 8)
  }, [search, patient, prescriptions, alerts, history, role])

  const reset = () => {
    if (!window.confirm('Reset all demo data to its starting state?')) return
    resetDemo()
    try { localStorage.removeItem('medisync-refill-network') } catch { /* ignore */ }
    navigate('/')
  }
  const goToResult = (result) => { navigate(result.path); setSearch(''); setSearchOpen(false); setMobileOpen(false) }
  const exportMedications = () => printReport('Medication list', `Patient: ${patient.name}`, (patient.medications || []).map(m => [m.name, `${m.strength || ''} · ${m.route || ''} · ${m.frequency || ''}`, m.status || 'Listed']), ['Medication', 'Dose and schedule', 'Status'])
  const exportHistory = () => printReport('Audit and activity history', 'Recorded demo events', (history || []).map(h => [h.type, h.detail, `${h.time || ''} · ${h.actor || ''}`]), ['Event', 'Details', 'Time and actor'])

  return <div className="min-h-screen bg-canvas text-ink">
    {mobileOpen && <button aria-label="Close navigation" className="fixed inset-0 z-30 bg-slate-900/30 md:hidden" onClick={() => setMobileOpen(false)} />}
    <aside className={`fixed inset-y-0 left-0 z-40 flex flex-col overflow-y-auto border-r border-[#e1e8df] bg-[#fcfdf9] px-4 py-6 shadow-[8px_0_28px_rgba(31,52,39,0.025)] transition-all duration-200 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 ${collapsed ? 'md:w-[84px]' : 'md:w-64'} w-64`}>
      <div className={`flex items-center gap-3 px-2 ${collapsed ? 'md:justify-center' : ''}`}>
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-forest text-white"><HeartPulse size={23}/></div>
        <div className={collapsed ? 'md:hidden' : ''}><p className="text-lg font-bold tracking-tight">MediLink</p><p className="text-xs text-muted">Safer coordinated care</p></div>
        <button className="ml-auto md:hidden" onClick={() => setMobileOpen(false)} aria-label="Close menu"><X size={18}/></button>
      </div>
      <div className={`mt-8 rounded-2xl bg-mint p-3 ${collapsed ? 'md:flex md:justify-center md:px-0' : ''}`} title="Fictional patient data · local demo"><div className="flex items-center gap-2 text-sm font-semibold text-forest"><Activity size={16}/><span className={collapsed ? 'md:hidden' : ''}>Demo workspace</span></div><p className={`mt-1 text-xs leading-5 text-forest/80 ${collapsed ? 'md:hidden' : ''}`}>Fictional patient data · local demo</p></div>
      <p className={`mb-2 mt-8 px-3 text-[10px] font-bold uppercase tracking-[.18em] text-slate-400 ${collapsed ? 'md:hidden' : ''}`}>Workspace</p>
      <nav className="space-y-1">
        {nav.map(([label, path, Icon]) => <NavLink key={path} to={path} end={path === '/'} title={collapsed ? label : undefined} onClick={() => setMobileOpen(false)} className={({ isActive }) => `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${collapsed ? 'md:justify-center md:px-0' : ''} ${isActive ? 'bg-forest text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50 hover:text-forest'}`}><Icon size={18}/><span className={collapsed ? 'md:hidden' : ''}>{label}</span>{label === 'Alerts' && unread > 0 && <span className={`ml-auto rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-800 ${collapsed ? 'md:hidden' : ''}`}>{unread}</span>}</NavLink>)}
      </nav>
      <div className="mt-auto border-t border-slate-100 pt-4">
        <button onClick={() => { setCollapsed(v => !v); setMobileOpen(false) }} className="mb-2 hidden w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-slate-500 hover:bg-slate-50 md:flex" title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}>{collapsed ? <ChevronRight size={15}/> : <ChevronLeft size={15}/>}<span className={collapsed ? 'hidden' : ''}>{collapsed ? '' : 'Collapse sidebar'}</span></button>
        <button onClick={reset} title="Reset demo data" className={`mb-2 flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-slate-500 hover:bg-slate-50 ${collapsed ? 'md:justify-center md:px-0' : ''}`}><RotateCcw size={14}/><span className={collapsed ? 'md:hidden' : ''}>Reset demo data</span></button>
        <div className={`flex items-center gap-3 rounded-xl p-2 ${collapsed ? 'md:justify-center' : ''}`}><div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-sm font-semibold">{roleName[0]}</div><div className={`min-w-0 flex-1 ${collapsed ? 'md:hidden' : ''}`}><p className="truncate text-sm font-semibold">{userName[role]}</p><p className="text-xs text-muted">{roleName} demo</p></div><button title="Exit demo" aria-label="Exit demo" onClick={onExit} className={`rounded-lg p-2 text-muted hover:bg-slate-100 ${collapsed ? 'md:hidden' : ''}`}><LogOut size={16}/></button></div>
      </div>
    </aside>
    <div className={collapsed ? 'md:pl-[84px]' : 'md:pl-64'}>
      <header className="sticky top-0 z-20 flex min-h-[72px] items-center justify-between gap-3 border-b border-[#e1e8df] bg-[#fcfdf9]/95 px-4 py-3 backdrop-blur md:px-8">
        <div className="flex min-w-0 items-center gap-3"><button onClick={() => setMobileOpen(true)} className="rounded-lg p-2 hover:bg-slate-100 md:hidden" aria-label="Open menu"><Menu size={20}/></button><div className="min-w-0"><p className="text-xs text-muted">MediLink / {roleName}</p><h1 className="truncate text-lg font-semibold">{titles[location.pathname] || 'Dashboard'}</h1></div></div>
        <div className="flex shrink-0 items-center gap-2">
          <div className="relative hidden sm:block"><div className="flex w-48 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 focus-within:border-forest lg:w-64"><Search size={16} className="shrink-0 text-muted"/><input aria-label="Search patients, medications, alerts and history" value={search} onChange={e => { setSearch(e.target.value); setSearchOpen(true) }} onFocus={() => search && setSearchOpen(true)} onKeyDown={e => { if (e.key === 'Escape') setSearchOpen(false); if (e.key === 'Enter' && searchResults[0]) goToResult(searchResults[0]) }} placeholder="Search records..." className="min-w-0 w-full bg-transparent text-xs outline-none placeholder:text-slate-400"/>{search && <button aria-label="Clear search" onClick={() => { setSearch(''); setSearchOpen(false) }}><X size={14}/></button>}</div>
            {searchOpen && search.trim() && <><button className="fixed inset-0 z-20 cursor-default" aria-label="Close search results" onClick={() => setSearchOpen(false)}/><div className="absolute right-0 top-12 z-30 w-80 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl"><div className="border-b border-slate-100 px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-muted">Search results</div>{searchResults.length ? searchResults.map(r => <button key={`${r.type}-${r.key}`} onClick={() => goToResult(r)} className="flex w-full gap-3 border-b border-slate-50 px-4 py-3 text-left last:border-0 hover:bg-slate-50"><span className="mt-0.5 rounded-lg bg-mint p-2 text-forest"><Search size={14}/></span><span className="min-w-0"><span className="block truncate text-sm font-semibold">{r.title}</span><span className="mt-0.5 block truncate text-xs text-muted">{r.type} · {r.detail}</span></span></button>) : <p className="px-4 py-5 text-sm text-muted">No matching records.</p>}</div></>}
          </div>
          <button onClick={() => printReport('MediLink workspace report', `Current section: ${titles[location.pathname] || 'Dashboard'} · Role: ${roleName}`, (history || []).slice(0, 50).map(h => [h.type, h.detail, `${h.time || ''} · ${h.actor || ''}`]), ['Event', 'Details', 'Time and actor'])} title="Print or save report as PDF" aria-label="Print or save report as PDF" className="hidden rounded-xl border border-slate-200 p-2.5 text-slate-600 hover:bg-slate-50 lg:block"><Printer size={17}/></button>
          <button onClick={() => setNotificationsOpen(true)} aria-label={`View notifications (${unread} unread)`} className="relative rounded-xl border border-slate-200 p-2.5 text-slate-600 hover:bg-slate-50"><Bell size={18}/>{unread > 0 && <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-amber-500 px-1 text-[10px] font-bold text-white ring-2 ring-white">{unread}</span>}</button>
          <button onClick={onExit} className="hidden items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm sm:flex" title="Switch role"><UserRound size={16}/><span>{roleName}</span></button>
        </div>
      </header>
      <main className="mx-auto max-w-[1500px] px-4 py-6 md:px-8 md:py-8">{children}</main>
      <footer className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 px-6 pb-6 text-xs text-slate-400"><span>MediLink demo · Fictional data only · Not a medical decision system</span><button onClick={exportMedications} className="font-medium text-forest hover:underline">Medication report</button><button onClick={exportHistory} className="font-medium text-forest hover:underline">Audit report</button></footer>
    </div>

    {notificationsOpen && <div className="fixed inset-0 z-50"><button className="absolute inset-0 bg-slate-900/30" aria-label="Close notifications" onClick={() => setNotificationsOpen(false)}/><section role="dialog" aria-modal="true" aria-labelledby="notification-title" className="absolute inset-y-0 right-0 flex w-full max-w-md flex-col bg-white shadow-2xl"><div className="flex items-start justify-between border-b border-slate-100 p-5"><div><div className="flex items-center gap-2"><span className="rounded-lg bg-mint p-2 text-forest"><Bell size={17}/></span><h2 id="notification-title" className="text-lg font-semibold">Notifications</h2></div><p className="mt-2 text-sm text-muted">{unread} open item{unread === 1 ? '' : 's'} requiring attention</p></div><button onClick={() => setNotificationsOpen(false)} aria-label="Close notifications" className="rounded-lg p-2 hover:bg-slate-100"><X size={18}/></button></div><div className="flex-1 overflow-y-auto p-4">{alerts.length ? alerts.map(a => <article key={a.id} className="mb-3 rounded-2xl border border-slate-100 p-4"><div className="flex items-start gap-3"><span className={`mt-0.5 rounded-lg p-2 ${a.status === 'Acknowledged' ? 'bg-slate-100 text-slate-500' : a.severity === 'warning' ? 'bg-amber-50 text-amber-700' : 'bg-mint text-forest'}`}><Activity size={17}/></span><div className="min-w-0 flex-1"><div className="flex items-start justify-between gap-2"><h3 className="text-sm font-semibold">{a.title}</h3><span className={`shrink-0 rounded-full px-2 py-1 text-[10px] font-semibold ${a.status === 'Acknowledged' ? 'bg-slate-100 text-slate-500' : 'bg-amber-50 text-amber-800'}`}>{a.status}</span></div><p className="mt-1 text-sm leading-5 text-muted">{a.detail}</p><p className="mt-2 flex items-center gap-1 text-xs text-slate-400"><Clock3 size={12}/>{a.time}</p>{a.status !== 'Acknowledged' && <button onClick={() => acknowledgeAlert(a.id)} className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-forest hover:underline"><CheckCheck size={14}/> Acknowledge</button>}</div></div></article>) : <div className="py-12 text-center"><Bell className="mx-auto text-slate-300" size={28}/><p className="mt-3 text-sm font-medium">You're all caught up</p></div>}</div><div className="border-t border-slate-100 p-4"><button onClick={() => { setNotificationsOpen(false); navigate('/alerts') }} className="btn-primary w-full">Open alert center</button></div></section></div>}
  </div>
}
