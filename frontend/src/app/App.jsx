import { useState } from 'react'
import { Navigate, Route, Routes, useNavigate } from 'react-router-dom'
import { AppProvider } from '../context/AppContext'
import Layout from '../components/Layout'
import Login from '../pages/Login'
import Dashboard from '../pages/Dashboard'
import { Alerts, History, Medications, Patients, Prescriptions, SafetyCenter, Schedule } from '../pages/Pages'

function RoutedApp() {
  const [role, setRole] = useState(() => sessionStorage.getItem('medisync-role') || '')
  const navigate = useNavigate()
  const selectRole = (nextRole) => { setRole(nextRole); sessionStorage.setItem('medisync-role', nextRole); navigate('/') }
  if (!role) return <Routes><Route path="/login" element={<Login onSelect={selectRole}/>} /><Route path="*" element={<Navigate to="/login" replace/>}/></Routes>
  return <Routes>
    <Route path="/login" element={<Login onSelect={selectRole}/>} />
    <Route path="*" element={<Layout role={role} setRole={selectRole}><Routes>
      <Route path="/" element={<Dashboard role={role}/>} />
      <Route path="/medications" element={role==='patient'?<Medications/>:<Navigate to="/" replace/>}/>
      <Route path="/schedule" element={role==='patient'?<Schedule/>:<Navigate to="/" replace/>}/>
      <Route path="/safety" element={role!=='caregiver'?<SafetyCenter/>:<Navigate to="/" replace/>}/>
      <Route path="/alerts" element={<Alerts/>}/>
      <Route path="/history" element={<History/>}/>
      <Route path="/patients" element={role!=='patient'?<Patients/>:<Navigate to="/" replace/>}/>
      <Route path="/prescriptions" element={role==='doctor'?<Prescriptions/>:<Navigate to="/" replace/>}/>
      <Route path="*" element={<Navigate to="/" replace/>}/>
    </Routes></Layout>} />
  </Routes>
}

export default function App() {
  return <AppProvider><RoutedApp/></AppProvider>
}
