import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { demoPatient, demoAlerts, demoHistory } from '../data/demo'

const AppContext = createContext(null)
const STORAGE_KEY = 'medisync-demo-state-v1'

const initialState = {
  patient: demoPatient,
  alerts: demoAlerts,
  history: demoHistory,
  prescriptions: [...demoPatient.medications]
}

export function AppProvider({ children }) {
  const [state, setState] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      return saved ? JSON.parse(saved) : initialState
    } catch {
      return initialState
    }
  })

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  }, [state])

  const addHistory = (type, detail, actor = 'Demo user') => ({
    id: Date.now(), type, detail, actor, time: new Date().toLocaleString()
  })

  const markDose = (doseId, status) => {
    const dose = state.patient.doses.find(d => d.id === doseId)
    if (!dose) return
    setState(prev => ({
      ...prev,
      patient: { ...prev.patient, doses: prev.patient.doses.map(d => d.id === doseId ? { ...d, status } : d) },
      history: [addHistory('Dose recorded', `${dose.medicine} marked as ${status}`, prev.patient.name), ...prev.history]
    }))
  }

  const acknowledgeAlert = (alertId) => {
    setState(prev => ({
      ...prev,
      alerts: prev.alerts.map(a => a.id === alertId ? { ...a, status: 'Acknowledged' } : a),
      history: [addHistory('Alert acknowledged', `Alert ${alertId} acknowledged`, prev.patient.name), ...prev.history]
    }))
  }

  const createPrescription = (form) => {
    const medication = {
      id: `med-${Date.now()}`,
      name: form.name.trim(),
      strength: `${form.dose} ${form.unit}`,
      route: form.route,
      frequency: form.frequency,
      time: form.time || '09:00 AM',
      prescriber: 'Demo clinician',
      startDate: new Date().toLocaleDateString(),
      status: 'Active',
      ingredient: form.ingredient.trim().toLowerCase()
    }
    setState(prev => ({
      ...prev,
      prescriptions: [medication, ...prev.prescriptions],
      patient: { ...prev.patient, medications: [medication, ...prev.patient.medications] },
      history: [addHistory('Prescription created', `${medication.name} ${medication.strength} added (demo)`, 'Demo clinician'), ...prev.history]
    }))
    return medication
  }

  const discontinuePrescription = (id) => {
    const medication = state.prescriptions.find(m => m.id === id)
    if (!medication) return
    setState(prev => ({
      ...prev,
      prescriptions: prev.prescriptions.map(m => m.id === id ? { ...m, status: 'Discontinued' } : m),
      patient: { ...prev.patient, medications: prev.patient.medications.map(m => m.id === id ? { ...m, status: 'Discontinued' } : m) },
      history: [addHistory('Prescription discontinued', `${medication.name} marked discontinued (demo)`, 'Demo clinician'), ...prev.history]
    }))
  }

  const value = useMemo(() => ({
    ...state, markDose, acknowledgeAlert, createPrescription, discontinuePrescription
  }), [state])

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export const useApp = () => useContext(AppContext)
