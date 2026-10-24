import { HeartPulse, ShieldCheck, ArrowRight } from 'lucide-react'
import { useAuth } from 'react-oidc-context'
import { useNavigate } from 'react-router-dom'

export default function Login() {
  const auth = useAuth()
  const navigate = useNavigate()

  return (
    <main className="grid min-h-screen bg-white lg:grid-cols-2">
      <section className="hidden flex-col justify-between bg-forest p-12 text-white lg:flex">
        <div className="flex items-center gap-3">
          <HeartPulse size={30} />
          <span className="text-xl font-bold">MediLink</span>
        </div>

        <div className="max-w-xl">
          <ShieldCheck size={32} />
          <h1 className="mt-6 text-5xl font-semibold leading-tight">
            Safer care starts with a shared picture.
          </h1>
          <p className="mt-5 text-lg leading-8 text-white/75">
            Coordinate medication schedules, prescriptions and care securely.
          </p>
        </div>

        <p className="text-sm text-white/60">
          Secure access for patients and care professionals.
        </p>
      </section>

      <section className="flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <HeartPulse size={28} className="text-forest" />
            <span className="text-xl font-bold">MediLink</span>
          </div>

          <p className="text-sm font-semibold uppercase tracking-widest text-forest">
            Welcome back
          </p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight">
            Sign in to MediLink
          </h2>
          <p className="mt-3 text-sm leading-6 text-muted">
            Access your account securely. Your workspace depends on your
            authorised account permissions.
          </p>

          {auth.error && (
            <p role="alert" className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">
              Sign-in failed: {auth.error.message}
            </p>
          )}

          <button
            type="button"
            onClick={() => auth.signinRedirect()}
            disabled={auth.isLoading}
            className="mt-7 flex w-full items-center justify-center gap-2 rounded-2xl bg-forest p-4 font-semibold text-white hover:opacity-90 disabled:opacity-50"
          >
            {auth.isLoading ? 'Please wait…' : 'Sign in'}
            <ArrowRight size={18} />
          </button>

          <div className="my-7 flex items-center gap-4">
            <div className="h-px flex-1 bg-slate-200" />
            <span className="text-sm text-muted">New to MediLink?</span>
            <div className="h-px flex-1 bg-slate-200" />
          </div>

          <button
            type="button"
            onClick={() => navigate('/onboarding')}
            className="w-full rounded-2xl border border-slate-200 p-4 font-semibold text-forest hover:border-forest hover:bg-slate-50"
          >
            Create an account
          </button>

          <p className="mt-6 text-xs leading-5 text-muted">
            By continuing, you agree to use your account only for information
            you are authorised to access.
          </p>
        </div>
      </section>
    </main>
  )
}
