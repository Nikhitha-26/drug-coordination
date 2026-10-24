
import { useState } from 'react'
import { signUp, confirmSignUp, signIn } from 'aws-amplify/auth'
import { Link, useNavigate } from 'react-router-dom'
import { HeartPulse, ArrowLeft } from 'lucide-react'

export default function Onboarding() {
  const navigate = useNavigate()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [profile, setProfile] = useState('https://example.com/profile')
  const [birthdate, setBirthdate] = useState('')
  const [gender, setGender] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)

  async function handleRegister(e) {
    e.preventDefault()
    setError('')
    setMessage('')
    setBusy(true)

    const normalizedEmail = email.trim().toLowerCase()
    const generatedUsername = normalizedEmail.split('@')[0]

    try {
      const result = await signUp({
        username: generatedUsername,
        password,
        options: {
          userAttributes: {
            name: name.trim(),
            email: normalizedEmail,
            profile: profile.trim(),
            birthdate,
            gender,
            phone_number: phoneNumber.trim(),
          },
        },
      })

      if (result.isSignUpComplete) {
        setMessage('Account created. You can now sign in.')
        setTimeout(() => navigate('/login'), 1500)
      } else {
        setMessage(
          'Registration submitted, but AWS Cognito still requires confirmation. Please use the confirmation flow or ask the administrator to confirm your account.'
        )
      }
    } catch (err) {
      setError(err?.message || 'Could not create your account.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-white px-6 py-12">
      <section className="w-full max-w-md">
        <Link
          to="/login"
          className="mb-8 inline-flex items-center gap-2 text-sm text-muted hover:text-forest"
        >
          <ArrowLeft size={16} />
          Back to sign in
        </Link>

        <div className="mb-6 flex items-center gap-3 text-forest">
          <HeartPulse size={30} />
          <span className="text-xl font-bold">MediLink</span>
        </div>

        <p className="text-sm font-semibold uppercase tracking-widest text-forest">
          Create your account
        </p>

        <h1 className="mt-2 text-3xl font-semibold">Join MediLink</h1>

        <p className="mt-3 text-sm leading-6 text-muted">
          Create a secure account to get started.
        </p>

        {error && (
          <p
            role="alert"
            className="mt-5 rounded-xl bg-red-50 p-3 text-sm text-red-700"
          >
            {error}
          </p>
        )}

        {message && (
          <p
            role="status"
            className="mt-5 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800"
          >
            {message}
          </p>
        )}

        <form onSubmit={handleRegister} className="mt-6 space-y-4">
          <label className="block text-sm font-medium">
            Full name
            <input
              required
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 p-3"
            />
          </label>

          <label className="block text-sm font-medium">
            Email address
            <input
              required
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 p-3"
            />
          </label>

          <label className="block text-sm font-medium">
            Password
            <input
              required
              type="password"
              autoComplete="new-password"
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 p-3"
            />
          </label>

          <label className="block text-sm font-medium">
            Profile URL
            <input
              required
              type="url"
              value={profile}
              onChange={(e) => setProfile(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 p-3"
            />
          </label>

          <label className="block text-sm font-medium">
            Date of birth
            <input
              required
              type="date"
              value={birthdate}
              onChange={(e) => setBirthdate(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 p-3"
            />
          </label>

          <label className="block text-sm font-medium">
            Gender
            <select
              required
              value={gender}
              onChange={(e) => setGender(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 p-3"
            >
              <option value="">Select gender</option>
              <option value="Female">Female</option>
              <option value="Male">Male</option>
              <option value="Other">Other</option>
              <option value="Prefer not to say">Prefer not to say</option>
            </select>
          </label>

          <label className="block text-sm font-medium">
            Phone number
            <input
              required
              type="tel"
              autoComplete="tel"
              placeholder="+919876543210"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 p-3"
            />
          </label>

          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-xl bg-forest p-4 font-semibold text-white disabled:opacity-50"
          >
            {busy ? 'Creating account…' : 'Create account'}
          </button>
        </form>
      </section>
    </main>
  )
}
