
import { useState } from 'react'
import { Navigate, Route, Routes, useNavigate } from 'react-router-dom'
import { useAuth } from 'react-oidc-context'
import { AppProvider } from '../context/AppContext'
import Layout from '../components/Layout'
import Login from '../pages/Login'
import Dashboard from '../pages/Dashboard'
import { Refills } from '../pages/WorkflowPages'
import {
  Alerts,
  History,
  Medications,
  Patients,
  Pharmacies,
  Prescriptions,
  SafetyCenter,
  Schedule,
} from '../pages/Pages'

const ROLE_KEY = 'medisync-role'
const VALID_ROLES = ['patient', 'doctor', 'caregiver', 'pharmacy', 'admin']

function readRole() {
  try {
    const saved = sessionStorage.getItem(ROLE_KEY)
    return VALID_ROLES.includes(saved) ? saved : ''
  } catch {
    return ''
  }
}

function RoutedApp() {
  const auth = useAuth()
  const [role, setRole] = useState(readRole)
  const navigate = useNavigate()

  const selectRole = (next) => {
    setRole(next)
    try {
      sessionStorage.setItem(ROLE_KEY, next)
    } catch {
      // Ignore unavailable session storage
    }
    navigate('/')
  }

  const exitDemo = async () => {
  setRole('')
  try {
    sessionStorage.removeItem(ROLE_KEY)
  } catch {
    // Ignore unavailable session storage
  }

  if (auth.isAuthenticated) {
    await auth.signoutRedirect({
      post_logout_redirect_uri: window.location.origin + '/login',
    })
  } else {
    navigate('/login')
  }
}

  if (auth.isLoading) {
    return <main className="p-8">Checking your sign-in...</main>
  }

  if (auth.error) {
    return (
      <main className="p-8">
        <h1 className="text-xl font-semibold">Sign-in error</h1>
        <p className="mt-2">{auth.error.message}</p>
        <button className="mt-4 underline" onClick={() => auth.signinRedirect()}>
          Try signing in again
        </button>
      </main>
    )
  }

  if (!auth.isAuthenticated && !role) {
    return (
      <Routes>
        <Route path="/login" element={<Login onSelect={selectRole} />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    )
  }

  // Cognito authentication does not automatically establish a trusted app role.
  // Keep the role picker for now; role authorization needs a separate setup.
  const activeRole = role || 'patient'

  const only = (allowed, element) =>
    allowed.includes(activeRole) ? element : <Navigate to="/" replace />

  return (
    <Routes>
      <Route path="/login" element={<Navigate to="/" replace />} />
      <Route
        path="*"
        element={
          <Layout role={activeRole} onExit={exitDemo}>
            <Routes>
              <Route path="/" element={<Dashboard role={activeRole} />} />
              <Route path="/medications" element={only(['patient'], <Medications />)} />
              <Route path="/schedule" element={only(['patient'], <Schedule />)} />
              <Route path="/pharmacies" element={only(['patient', 'caregiver'], <Pharmacies />)} />
              <Route path="/safety" element={only(['patient', 'doctor'], <SafetyCenter />)} />
              <Route path="/alerts" element={<Alerts />} />
              <Route path="/history" element={<History />} />
              <Route path="/patients" element={only(['doctor', 'caregiver'], <Patients />)} />
              <Route path="/prescriptions" element={only(['doctor'], <Prescriptions />)} />
              <Route path="/refills" element={only(['patient', 'pharmacy'], <Refills role={activeRole} />)} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Layout>
        }
      />
    </Routes>
  )
}

export default function App() {
  return (
    <AppProvider>
      <RoutedApp />
    </AppProvider>
  )
}
