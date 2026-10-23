import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { Activity, Bell, CalendarClock, FileText, HeartPulse, History, LayoutDashboard, LogOut, MapPin, Menu, Pill, RotateCcw, ShieldCheck, UserRound, Users, X } from 'lucide-react'
import { useState } from 'react'
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
  pharmacy: [
    ['Dashboard', '/', LayoutDashboard],
    ['Refill Requests', '/refills', FileText],
    ['History', '/history', History]
  ],
  admin: [
    ['Dashboard', '/', LayoutDashboard],
    ['Audit history', '/history', History]
  ],
}
const titles = {
  '/': 'Dashboard', '/medications': 'Medications', '/schedule': 'Dose schedule', '/safety': 'Medication Safety Shield',
  '/alerts': 'Alerts & notifications', '/history': 'Shared medication history', '/patients': 'Patient records',
  '/prescriptions': 'Prescriptions', '/pharmacies': 'Find medicines nearby', '/refills': 'Smart Refill Network',
}
const userName = { doctor: 'Dr. Meera Rao', caregiver: 'Ananya Sharma', patient: 'Aarav Sharma' ,pharmacy: 'Demo Pharmacy',
  admin: 'MediSync Administrator'}

export default function Layout({ role, onExit, children }) {
  const [open, setOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const { alerts, resetDemo } = useApp()
  const unread = alerts.filter(a => a.status !== 'Acknowledged').length
  const nav = navByRole[role] || navByRole.patient
  const roleName = role === 'caregiver'
  ? 'Caretaker'
  : role === 'admin'
    ? 'Administrator'
    : role === 'pharmacy'
      ? 'Pharmacy'
      : role.charAt(0).toUpperCase() + role.slice(1)
  const reset = () => {
    if (!window.confirm('Reset all demo data to its starting state?')) return
    resetDemo()
    try { localStorage.removeItem('medisync-refill-network') } catch { /* ignore */ }
    navigate('/')
  }
  return <div className="min-h-screen bg-canvas text-ink">
    {open && <button aria-label="Close navigation" className="fixed inset-0 z-30 bg-slate-900/30 md:hidden" onClick={() => setOpen(false)} />}
    <aside className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col overflow-y-auto border-r border-slate-100 bg-white px-4 py-5 transition-transform md:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full'}`}>
      <div className="flex items-center gap-3 px-2">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-forest text-white"><HeartPulse size={23}/></div>
        <div><p className="text-lg font-bold tracking-tight">MediSync</p><p className="text-xs text-muted">Safer coordinated care</p></div>
        <button className="ml-auto md:hidden" onClick={() => setOpen(false)} aria-label="Close menu"><X size={18}/></button>
      </div>
      <div className="mt-8 rounded-2xl bg-mint p-3"><div className="flex items-center gap-2 text-sm font-semibold text-forest"><Activity size={16}/> Demo workspace</div><p className="mt-1 text-xs leading-5 text-forest/80">Fictional patient data · local demo</p></div>
      <p className="mb-2 mt-8 px-3 text-[10px] font-bold uppercase tracking-[.18em] text-slate-400">Workspace</p>
      <nav className="space-y-1">
        {nav.map(([label, path, Icon]) => <NavLink key={path} to={path} end={path === '/'} onClick={() => setOpen(false)} className={({ isActive }) => `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${isActive ? 'bg-forest text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50 hover:text-forest'}`}><Icon size={18}/>{label}</NavLink>)}
      </nav>
      <div className="mt-auto border-t border-slate-100 pt-4">
        <button onClick={reset} className="mb-2 flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-slate-500 hover:bg-slate-50"><RotateCcw size={14}/> Reset demo data</button>
        <div className="flex items-center gap-3 rounded-xl p-2"><div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-sm font-semibold">{roleName[0]}</div><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{userName[role]}</p><p className="text-xs text-muted">{roleName} demo</p></div><button title="Exit demo" aria-label="Exit demo" onClick={onExit} className="rounded-lg p-2 text-muted hover:bg-slate-100"><LogOut size={16}/></button></div>
      </div>
    </aside>
    <div className="md:pl-64">
      <header className="sticky top-0 z-20 flex h-[72px] items-center justify-between border-b border-slate-100 bg-white/90 px-4 backdrop-blur md:px-8">
        <div className="flex items-center gap-3"><button onClick={() => setOpen(true)} className="rounded-lg p-2 hover:bg-slate-100 md:hidden" aria-label="Open menu"><Menu size={20}/></button><div><p className="text-xs text-muted">MediSync / {roleName}</p><h1 className="text-lg font-semibold">{titles[location.pathname] || 'Dashboard'}</h1></div></div>
        <div className="flex items-center gap-2">
          <button onClick={() => navigate('/alerts')} aria-label={`View alerts (${unread} unread)`} className="relative rounded-xl border border-slate-200 p-2.5 text-slate-600 hover:bg-slate-50"><Bell size={18}/>{unread > 0 && <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-amber-500 px-1 text-[10px] font-bold text-white ring-2 ring-white">{unread}</span>}</button>
          <button onClick={onExit} className="hidden items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm sm:flex" title="Switch role"><UserRound size={16}/><span>{roleName}</span></button>
        </div>
      </header>
      <main className="mx-auto max-w-[1500px] px-4 py-6 md:px-8 md:py-8">{children}</main>
      <footer className="px-6 pb-6 text-center text-xs text-slate-400">MediSync demo · Fictional data only · Not a medical decision system</footer>
    </div>
  </div>
}
