
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import { apiRequest } from '../services/api'
import { demoPatient, demoAlerts, demoHistory } from '../data/demo'

const AppContext = createContext(null)
const STORAGE_KEY = 'medisync-demo-state-v2'

const makeInitialState = () => ({
  patient: structuredClone(demoPatient),
  alerts: structuredClone(demoAlerts),
  history: structuredClone(demoHistory),
  prescriptions: structuredClone(demoPatient.medications),
})

const uid = (prefix) =>
  `${prefix}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`

const entry = (type, detail, actor = 'Demo user') => ({
  id: uid('h'),
  type,
  detail,
  actor,
  time: new Date().toLocaleString(),
})

const displayStatus = (status) =>
  status === 'active' ? 'Active' :
  status === 'discontinued' ? 'Discontinued' :
  status

const mapMedication = (m) => ({
  ...m,
  id: m.medicationId || m.id,
  medicationId: m.medicationId || m.id,
  name: m.name || 'Unnamed medication',
  strength: `${m.dose || ''} ${m.unit || ''}`.trim(),
  ingredient: m.ingredient || '',
  route: m.route || 'Oral',
  frequency: m.frequency || 'As directed',
  time: m.time || m.schedule?.[0]?.time || 'Not specified',
  status: displayStatus(m.status || 'active'),
})

const AppProvider = ({ children, accessToken, patientId }) => {
  const [state, setState] = useState(makeInitialState)
  const [backendConnected, setBackendConnected] = useState(false)
  const [loading, setLoading] = useState(Boolean(accessToken && patientId))
  const [connectionError, setConnectionError] = useState('')

  useEffect(() => {
    let cancelled = false

    if (!accessToken || !patientId) {
      setLoading(false)
      setBackendConnected(false)
      setConnectionError('Sign in to load patient records from AWS.')
      return
    }

    const headers = { token: accessToken }
    const base = `/patients/${encodeURIComponent(patientId)}`

    async function loadBackend() {
      setLoading(true)
      setConnectionError('')

      try {
        const [profileResult, medicationResult, doseResult, auditResult] =
          await Promise.all([
            apiRequest(`${base}/profile`, { ...headers }),
            apiRequest(`${base}/medications`, { ...headers }),
            apiRequest(`${base}/doses`, { ...headers }),
            apiRequest(`${base}/audit`, { ...headers }),
          ])

        if (cancelled) return

        const meds = (medicationResult?.items || []).map(mapMedication)
        const medById = new Map(meds.map((m) => [m.id, m]))
        const doses = (doseResult?.items || []).map((d) => {
          const med = medById.get(d.medicationId)
          return {
            ...d,
            id: d.doseEventId,
            medicine: med?.name || 'Medication',
            dose: med?.strength || '',
            time: d.scheduledAt || d.recordedAt || '',
            status: d.status,
            recordedAt: d.recordedAt,
          }
        })

        const profile = profileResult?.profile || {}
        const auditItems = (auditResult?.items || []).map((a) => ({
          id: a.eventId || uid('history'),
          type: a.action || 'Record updated',
          detail: `${a.entityType || 'record'} ${a.action || 'updated'}`,
          actor: a.actorRole || 'User',
          time: a.timestamp ? new Date(a.timestamp).toLocaleString() : '',
        }))

        const patient = {
          ...demoPatient,
          ...profile,
          id: patientId,
          patientId,
          name: profile.displayName || profile.name || demoPatient.name,
          medications: meds,
          doses,
        }

        setState((previous) => ({
          ...previous,
          patient,
          prescriptions: meds,
          history: auditItems,
          alerts: previous.alerts.filter((a) => a.source === 'local'),
        }))
        setBackendConnected(true)
      } catch (error) {
        if (!cancelled) {
          setBackendConnected(false)
          setConnectionError(error.message || 'Unable to load AWS records.')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    loadBackend()
    return () => {
      cancelled = true
    }
  }, [accessToken, patientId])

  const refreshBackend = async () => {
    if (!accessToken || !patientId) {
      throw new Error('Sign in before changing patient records.')
    }

    const base = `/patients/${encodeURIComponent(patientId)}`
    const headers = { token: accessToken }

    const [medicationResult, doseResult, auditResult] = await Promise.all([
      apiRequest(`${base}/medications`, { ...headers }),
      apiRequest(`${base}/doses`, { ...headers }),
      apiRequest(`${base}/audit`, { ...headers }),
    ])

    const meds = (medicationResult?.items || []).map(mapMedication)
    const medById = new Map(meds.map((m) => [m.id, m]))
    const doses = (doseResult?.items || []).map((d) => ({
      ...d,
      id: d.doseEventId,
      medicine: medById.get(d.medicationId)?.name || 'Medication',
      dose: medById.get(d.medicationId)?.strength || '',
      time: d.scheduledAt || d.recordedAt || '',
      status: d.status,
    }))
    const history = (auditResult?.items || []).map((a) => ({
      id: a.eventId || uid('history'),
      type: a.action || 'Record updated',
      detail: `${a.entityType || 'record'} ${a.action || 'updated'}`,
      actor: a.actorRole || 'User',
      time: a.timestamp ? new Date(a.timestamp).toLocaleString() : '',
    }))

    setState((previous) => ({
      ...previous,
      patient: { ...previous.patient, medications: meds, doses },
      prescriptions: meds,
      history,
    }))
    setBackendConnected(true)
  }

  const actions = useMemo(() => {
    const base = `/patients/${encodeURIComponent(patientId || '')}`
    const headers = { token: accessToken }

    const markDose = async (doseId, status) => {
      if (!['taken', 'missed', 'skipped'].includes(status)) {
        throw new Error('Unsupported dose status.')
      }

      const dose = state.patient.doses.find((d) => d.id === doseId)
      if (!dose) throw new Error('Dose record not found.')
      if (dose.doseEventId || dose.recordedAt) {
        throw new Error('This dose has already been recorded and cannot be edited.')
      }
      if (!dose.medicationId) {
        throw new Error('This demo dose has no linked AWS medication. Refresh your records first.')
      }

      await apiRequest(`${base}/doses`, {
        ...headers,
        method: 'POST',
        body: JSON.stringify({
          medicationId: dose.medicationId,
          status,
          scheduledAt: dose.scheduledAt || dose.time || undefined,
        }),
      })

      await refreshBackend()

      if (status === 'missed') {
        setState((previous) => ({
          ...previous,
          alerts: [{
            id: uid('alert'),
            title: 'Missed dose recorded',
            detail: `${dose.medicine} was marked as missed. External notification delivery depends on AWS SNS configuration.`,
            time: new Date().toLocaleString(),
            status: 'Created',
            severity: 'warning',
            source: 'local',
          }, ...previous.alerts],
        }))
      }
    }

    const acknowledgeAlert = (alertId) => {
      setState((previous) => ({
        ...previous,
        alerts: previous.alerts.map((a) =>
          a.id === alertId ? { ...a, status: 'Acknowledged' } : a
        ),
      }))
    }

    const buildPayload = (form) => ({
      name: form.name.trim(),
      dose: String(form.dose).trim(),
      unit: form.unit,
      frequency: form.frequency,
      schedule: form.time ? [{ time: form.time, route: form.route }] : [],
      prescriber: 'Application user',
      status: 'active',
    })

    const createPrescription = async (form) => {
      const result = await apiRequest(`${base}/medications`, {
        ...headers,
        method: 'POST',
        body: JSON.stringify(buildPayload(form)),
      })
      await refreshBackend()
      return result
    }

    const modifyPrescription = async (id, form) => {
      await apiRequest(`${base}/medications/${encodeURIComponent(id)}`, {
        ...headers,
        method: 'PUT',
        body: JSON.stringify(buildPayload(form)),
      })
      await refreshBackend()
    }

    const discontinuePrescription = async (id) => {
      await apiRequest(`${base}/medications/${encodeURIComponent(id)}`, {
        ...headers,
        method: 'DELETE',
      })
      await refreshBackend()
    }

    const recordSafetyCheck = (name, ingredient, count, actor = 'Application user') => {
      setState((previous) => ({
        ...previous,
        history: [
          entry(
            'Demo safety check',
            `${name} (${ingredient}): ${count} potential issue(s) flagged. Demo rules are not clinically verified.`,
            actor
          ),
          ...previous.history,
        ],
      }))
    }

    const resetDemo = () => {
      setState(makeInitialState())
      setBackendConnected(false)
      setConnectionError('Demo state reset. Reload to fetch AWS records.')
    }

    return {
      markDose,
      acknowledgeAlert,
      createPrescription,
      modifyPrescription,
      discontinuePrescription,
      recordSafetyCheck,
      resetDemo,
    }
  }, [accessToken, patientId, state.patient.doses, state.patient, state.prescriptions])

  const value = useMemo(() => ({
    ...state,
    ...actions,
    backendConnected,
    loading,
    connectionError,
  }), [state, actions, backendConnected, loading, connectionError])

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export { AppProvider }
export const useApp = () => useContext(AppContext)
