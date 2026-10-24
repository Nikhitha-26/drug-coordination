
import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from 'react-oidc-context'
import { AppProvider } from '../context/AppContext'
import Layout from '../components/Layout'
import Login from '../pages/Login'
import Onboarding from '../pages/Onboarding'
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

function RoutedApp() {
  const auth = useAuth()

  const handleSignOut = async () => {
    if (auth.isAuthenticated) {
      await auth.signoutRedirect({
        post_logout_redirect_uri: `${window.location.origin}/login`,
      })
    } else {
      window.location.assign('/login')
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
        <button
          className="mt-4 underline"
          onClick={() => auth.signinRedirect()}
        >
          Try signing in again
        </button>
      </main>
    )
  }

  if (!auth.isAuthenticated) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    )
  }

  // Unprivileged accounts default to the patient view.
  // Privileged roles must be assigned by a trusted authorization process.
  const activeRole = auth.user?.profile?.['custom:role'] || 'patient'

  const only = (allowed, element) =>
    allowed.includes(activeRole) ? element : <Navigate to="/" replace />

  return (
    <Routes>
      <Route path="/login" element={<Navigate to="/" replace />} />
      <Route path="/onboarding" element={<Navigate to="/" replace />} />
      <Route
        path="*"
        element={
          <Layout role={activeRole} onExit={handleSignOut}>
            <Routes>
              <Route
                path="/"
                element={<Dashboard role={activeRole} />}
              />
              <Route
                path="/medications"
                element={only(['patient'], <Medications />)}
              />
              <Route
                path="/schedule"
                element={only(['patient'], <Schedule />)}
              />
              <Route
                path="/pharmacies"
                element={only(['patient', 'caregiver'], <Pharmacies />)}
              />
              <Route
                path="/safety"
                element={only(['patient', 'doctor'], <SafetyCenter />)}
              />
              <Route path="/alerts" element={<Alerts />} />
              <Route path="/history" element={<History />} />
              <Route
                path="/patients"
                element={only(['doctor', 'caregiver'], <Patients />)}
              />
              <Route
                path="/prescriptions"
                element={only(['doctor'], <Prescriptions />)}
              />
              <Route
                path="/refills"
                element={only(
                  ['patient', 'pharmacy'],
                  <Refills role={activeRole} />,
                )}
              />
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
