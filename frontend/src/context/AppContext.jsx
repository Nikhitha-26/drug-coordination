import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { demoPatient, demoAlerts, demoHistory } from '../data/demo'

const AppContext = createContext(null)
const STORAGE_KEY = 'medisync-demo-state-v2'

const makeInitialState = () => ({
  patient: structuredClone(demoPatient),
  alerts: structuredClone(demoAlerts),
  history: structuredClone(demoHistory),
  prescriptions: structuredClone(demoPatient.medications)
})

const uid = (prefix) => `${prefix}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`

const entry = (type, detail, actor = 'Demo user') => ({
  id: uid('h'), type, detail, actor, time: new Date().toLocaleString()
})

const isValid = (s) => s && s.patient && Array.isArray(s.patient.doses) && Array.isArray(s.alerts) && Array.isArray(s.history) && Array.isArray(s.prescriptions)

function load() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY))
    return isValid(saved) ? saved : makeInitialState()
  } catch {
    return makeInitialState()
  }
}

export function AppProvider({ children }) {
  const [state, setState] = useState(load)

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)) } catch { /* storage unavailable */ }
  }, [state])

  const actions = useMemo(() => {
    const markDose = (doseId, status) => setState(prev => {
      const dose = prev.patient.doses.find(d => d.id === doseId)
      if (!dose) return prev
      const alerts = status === 'missed'
        ? [{ id: uid('alert'), title: 'Missed dose', detail: `${dose.medicine} · scheduled for ${dose.time}`, time: new Date().toLocaleString(), status: 'Created', severity: 'warning' }, ...prev.alerts]
        : prev.alerts
      return {
        ...prev,
        alerts,
        patient: { ...prev.patient, doses: prev.patient.doses.map(d => d.id === doseId ? { ...d, status } : d) },
        history: [entry('Dose recorded', `${dose.medicine} marked as ${status}`, prev.patient.name), ...prev.history]
      }
    })

    const acknowledgeAlert = (alertId) => setState(prev => {
      const alert = prev.alerts.find(a => a.id === alertId)
      if (!alert) return prev
      return {
        ...prev,
        alerts: prev.alerts.map(a => a.id === alertId ? { ...a, status: 'Acknowledged' } : a),
        history: [entry('Alert acknowledged', `"${alert.title}" acknowledged`, prev.patient.name), ...prev.history]
      }
    })

    const buildMedication = (form, existing = {}) => ({
      ...existing,
      name: form.name.trim(),
      strength: `${form.dose} ${form.unit}`.trim(),
      route: form.route,
      frequency: form.frequency,
      time: form.time || '09:00 AM',
      ingredient: form.ingredient.trim().toLowerCase()
    })

    const createPrescription = (form) => setState(prev => {
      const medication = {
        ...buildMedication(form),
        id: uid('med'),
        prescriber: 'Dr. Meera Rao',
        startDate: new Date().toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' }),
        status: 'Active'
      }
      const dose = { id: uid('dose'), medicationId: medication.id, medicine: medication.name, dose: medication.strength, time: medication.time, status: 'pending' }
      return {
        ...prev,
        prescriptions: [medication, ...prev.prescriptions],
        patient: { ...prev.patient, medications: [medication, ...prev.patient.medications], doses: [...prev.patient.doses, dose] },
        alerts: [{ id: uid('alert'), title: 'Medication profile updated', detail: `${medication.name} was added to your active list`, time: new Date().toLocaleString(), status: 'Created', severity: 'info' }, ...prev.alerts],
        history: [entry('Prescription created', `${medication.name} ${medication.strength} added to active medication list`, 'Dr. Meera Rao'), ...prev.history]
      }
    })

    const modifyPrescription = (id, form) => setState(prev => {
      const before = prev.prescriptions.find(m => m.id === id)
      if (!before) return prev
      const after = buildMedication(form, before)
      const swap = (list) => list.map(m => m.id === id ? after : m)
      return {
        ...prev,
        prescriptions: swap(prev.prescriptions),
        patient: {
          ...prev.patient,
          medications: swap(prev.patient.medications),
          doses: prev.patient.doses.map(d => d.medicationId === id && d.status === 'pending' ? { ...d, medicine: after.name, dose: after.strength, time: after.time } : d)
        },
        history: [entry('Prescription updated', `${before.name} ${before.strength}, ${before.frequency} → ${after.name} ${after.strength}, ${after.frequency}`, 'Dr. Meera Rao'), ...prev.history]
      }
    })

    const discontinuePrescription = (id) => setState(prev => {
      const medication = prev.prescriptions.find(m => m.id === id)
      if (!medication) return prev
      const mark = (list) => list.map(m => m.id === id ? { ...m, status: 'Discontinued' } : m)
      return {
        ...prev,
        prescriptions: mark(prev.prescriptions),
        patient: {
          ...prev.patient,
          medications: mark(prev.patient.medications),
          doses: prev.patient.doses.filter(d => !(d.medicationId === id && d.status === 'pending'))
        },
        history: [entry('Prescription discontinued', `${medication.name} discontinued; pending doses removed`, 'Dr. Meera Rao'), ...prev.history]
      }
    })

    const recordSafetyCheck = (name, ingredient, count, actor = 'Dr. Meera Rao') => setState(prev => ({
      ...prev,
      history: [entry('Safety check performed', `${name} (${ingredient}): ${count ? `${count} potential issue${count > 1 ? 's' : ''} flagged` : 'no match in demo rules'}`, actor), ...prev.history]
    }))

    const resetDemo = () => setState(makeInitialState())

    return { markDose, acknowledgeAlert, createPrescription, modifyPrescription, discontinuePrescription, recordSafetyCheck, resetDemo }
  }, [])

  const value = useMemo(() => ({ ...state, ...actions }), [state, actions])
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export const useApp = () => useContext(AppContext)