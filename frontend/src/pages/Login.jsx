
import { HeartPulse, ShieldCheck, UserRound, Stethoscope, Users, Pill } from 'lucide-react'
import { useAuth } from 'react-oidc-context'

const roles = [
  { id: 'patient', name: 'Patient', desc: 'Track medicines and daily doses', Icon: UserRound },
  { id: 'doctor', name: 'Doctor', desc: 'Manage prescriptions and review safety', Icon: Stethoscope },
  { id: 'pharmacy', name: 'Pharmacy', desc: 'Manage stock and refill requests', Icon: Pill },
  { id: 'caregiver', name: 'Caretaker', desc: 'Support adherence and acknowledge alerts', Icon: Users },
  { id: 'admin', name: 'Administrator', desc: 'Verify providers and monitor activity', Icon: ShieldCheck }
]

export default function Login({ onSelect }) {
  const auth = useAuth()

  const signIn = () => {
    auth.signinRedirect()
  }

  return (
    <div className="grid min-h-screen bg-white lg:grid-cols-[1.05fr_.95fr]">
      <section className="relative hidden overflow-hidden bg-forest p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-white/15 p-3"><HeartPulse size={25}/></div>
          <span className="text-xl font-bold">MediLink</span>
        </div>
        <div className="relative z-10 max-w-xl">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-sm">
            <ShieldCheck size={15}/> One medication record
          </div>
          <h1 className="text-5xl font-semibold leading-tight tracking-tight">Safer care starts with a shared picture.</h1>
          <p className="mt-5 max-w-md text-lg leading-8 text-white/75">
            Bring medication schedules, prescription changes and safety reviews together in one coordinated workspace.
          </p>
          <div className="mt-10 grid grid-cols-3 gap-3">
            {[['01','Coordinate'],['02','Review'],['03','Track']].map(x => (
              <div key={x[0]} className="rounded-2xl border border-white/15 bg-white/5 p-4">
                <p className="text-xs text-white/50">{x[0]}</p>
                <p className="mt-2 font-medium">{x[1]}</p>
              </div>
            ))}
          </div>
        </div>
        <p className="text-xs text-white/50">Hackathon demo · Fictional data · For demonstration only</p>
        <div className="pointer-events-none absolute -bottom-24 -right-20 h-96 w-96 rounded-full border-[60px] border-white/5"/>
      </section>

      <section className="flex items-center justify-center px-5 py-12 sm:px-10">
        <div className="w-full max-w-md">
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <div className="rounded-xl bg-forest p-3 text-white"><HeartPulse size={24}/></div>
            <span className="text-xl font-bold">MediLink</span>
          </div>
          <p className="text-sm font-semibold uppercase tracking-widest text-forest">Welcome</p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight">Enter your workspace</h2>
          <p className="mt-3 text-sm leading-6 text-muted">
            Sign in securely with your MediLink account.
          </p>

          <button
            onClick={signIn}
            disabled={auth.isLoading}
            className="mt-6 w-full rounded-2xl bg-forest p-4 font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
          >
            {auth.isLoading ? 'Loading...' : 'Sign in with AWS Cognito'}
          </button>

          {auth.error && (
            <p role="alert" className="mt-3 text-sm text-red-600">
              Sign-in error: {auth.error.message}
            </p>
          )}

          <div className="mt-8 border-t border-slate-200 pt-6">
            <p className="text-sm font-semibold">Demo mode</p>
            <p className="mt-2 text-sm leading-6 text-muted">
              Use a fictional role to explore the interface without signing in.
            </p>
            <div className="mt-4 space-y-3">
              {roles.map(({ id, name, desc, Icon }) => (
                <button
                  key={id}
                  onClick={() => onSelect(id)}
                  className="group flex w-full items-center gap-4 rounded-2xl border border-slate-200 p-4 text-left transition hover:border-forest hover:bg-mint/40"
                >
                  <div className="rounded-xl bg-slate-50 p-3 text-forest group-hover:bg-mint"><Icon size={22}/></div>
                  <div className="flex-1">
                    <p className="font-semibold">{name}</p>
                    <p className="mt-1 text-sm text-muted">{desc}</p>
                  </div>
                  <span className="text-slate-300 group-hover:text-forest">→</span>
                </button>
              ))}
            </div>
          </div>

          <div className="mt-6 rounded-xl bg-amber-50 p-3 text-xs leading-5 text-amber-800">
            Demo mode only. Medication safety findings are simulated and must not be used for clinical decisions.
          </div>
        </div>
      </section>
    </div>
  )
}
