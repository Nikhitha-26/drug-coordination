import { useState } from 'react'
import { Navigate, Route, Routes, useNavigate } from 'react-router-dom'
import { AppProvider } from '../context/AppContext'
import Layout from '../components/Layout'
import Login from '../pages/Login'
import Dashboard from '../pages/Dashboard'
import { Alerts, History, Medications, Patients, Pharmacies, Prescriptions, SafetyCenter, Schedule } from '../pages/Pages'

const ROLE_KEY = 'medisync-role'
const VALID_ROLES = ['patient', 'doctor', 'caregiver']

function readRole() {
  try {
    const saved = sessionStorage.getItem(ROLE_KEY)
    return VALID_ROLES.includes(saved) ? saved : ''
  } catch {
    return ''
  }
}

function RoutedApp() {
  const [role, setRole] = useState(readRole)
  const navigate = useNavigate()

  const selectRole = (next) => {
    setRole(next)
    try { sessionStorage.setItem(ROLE_KEY, next) } catch { /* ignore */ }
    navigate('/')
  }
  const exitDemo = () => {
    setRole('')
    try { sessionStorage.removeItem(ROLE_KEY) } catch { /* ignore */ }
    navigate('/login')
  }

  if (!role) return <Routes><Route path="/login" element={<Login onSelect={selectRole}/>} /><Route path="*" element={<Navigate to="/login" replace/>}/></Routes>

  const only = (allowed, element) => allowed.includes(role) ? element : <Navigate to="/" replace/>
  return <Routes>
    <Route path="/login" element={<Navigate to="/" replace/>} />
    <Route path="*" element={<Layout role={role} onExit={exitDemo}><Routes>
      <Route path="/" element={<Dashboard role={role}/>} />
      <Route path="/medications" element={only(['patient'], <Medications/>)}/>
      <Route path="/schedule" element={only(['patient'], <Schedule/>)}/>
      <Route path="/pharmacies" element={only(['patient', 'caregiver'], <Pharmacies/>)}/>
      <Route path="/safety" element={only(['patient', 'doctor'], <SafetyCenter/>)}/>
      <Route path="/alerts" element={<Alerts/>}/>
      <Route path="/history" element={<History/>}/>
      <Route path="/patients" element={only(['doctor', 'caregiver'], <Patients/>)}/>
      <Route path="/prescriptions" element={only(['doctor'], <Prescriptions/>)}/>
      <Route path="*" element={<Navigate to="/" replace/>}/>
    </Routes></Layout>} />
  </Routes>
}

export default function App() {
  return <AppProvider><RoutedApp/></AppProvider>
}