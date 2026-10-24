
import { useState } from 'react'
import {
  AlertTriangle,
  Check,
  History as HistoryIcon,
  MapPin,
  Pill,
  Search,
  ShieldCheck,
  Undo2,
} from 'lucide-react'

import { useApp } from '../context/AppContext'
import {
  EmptyState,
  SafetyResult,
  SectionHeading,
  StatusBadge,
} from '../components/ui'
import PrescriptionManager from '../components/PrescriptionManager'
import { checkMedication } from '../services/safety'
import { demoPlaces } from '../data/pharmacies'

export function Medications() {
  const { patient } = useApp()
  const [search, setSearch] = useState('')

  const medications = (patient.medications || []).filter((medication) =>
    medication.name.toLowerCase().includes(search.toLowerCase()),
  )

  return (
    <div className="space-y-5">
      <SectionHeading
        title="Medication profile"
        subtitle="A shared view of current and discontinued medicines."
      />

      <div className="card">
        <div className="relative mb-5 max-w-md">
          <Search
            className="absolute left-3 top-3 text-slate-400"
            size={17}
          />
          <input
            className="field pl-10"
            placeholder="Search medication..."
            aria-label="Search medication"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>

        {medications.length === 0 ? (
          <EmptyState
            title="No medicines found"
            detail="Try another search, or add a medication."
          />
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {medications.map((medication) => (
              <article
                key={medication.id || medication.medicationId || medication.name}
                className="rounded-2xl border border-slate-100 p-5"
              >
                <div className="flex items-start justify-between">
                  <div className="rounded-xl bg-mint p-3 text-forest">
                    <Pill size={20} />
                  </div>
                  <StatusBadge status={medication.status} />
                </div>

                <h3 className="mt-4 text-lg font-semibold">
                  {medication.name}
                </h3>

                <p className="mt-1 text-sm text-muted">
                  {medication.strength || `${medication.dose || ''} ${medication.unit || ''}`.trim() || 'Dose not specified'}
                  {' · '}
                  {medication.route || 'Route not specified'}
                </p>

                <div className="mt-4 space-y-2 border-t border-slate-100 pt-4 text-sm">
                  <p>
                    <span className="text-muted">Frequency:</span>{' '}
                    {medication.frequency || 'Not specified'}
                  </p>
                  <p>
                    <span className="text-muted">Time:</span>{' '}
                    {medication.time ||
                      (Array.isArray(medication.schedule)
                        ? medication.schedule.join(', ')
                        : 'See prescription')}
                  </p>
                  <p>
                    <span className="text-muted">Start date:</span>{' '}
                    {medication.startDate || 'Not specified'}
                  </p>
                  <p>
                    <span className="text-muted">Prescriber:</span>{' '}
                    {medication.prescriber || 'Not specified'}
                  </p>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export function Schedule() {
  const { patient, markDose } = useApp()

  return (
    <div className="space-y-5">
      <SectionHeading
        title="Dose schedule"
        subtitle="Record doses after following the prescribed instructions."
      />

      <div className="card">
        {(patient.doses || []).length === 0 ? (
          <EmptyState
            title="No dose events yet"
            detail="Dose records will appear here when available. This list does not generate future scheduled doses."
          />
        ) : (
          patient.doses.map((dose) => (
            <div
              key={dose.id || dose.doseEventId}
              className="flex flex-wrap items-center gap-4 border-t border-slate-100 py-4 first:border-0"
            >
              <div className="w-24 text-sm font-semibold text-forest">
                {dose.time || dose.scheduledAt || dose.recordedAt || 'Time unavailable'}
              </div>

              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-mint text-forest">
                <Pill size={18} />
              </div>

              <div className="min-w-[150px] flex-1">
                <p className="font-semibold">
                  {dose.medicine || dose.name || dose.medicationId || 'Medication'}
                </p>
                <p className="mt-1 text-sm text-muted">
                  {dose.dose || 'Refer to prescription'}
                </p>
              </div>

              <StatusBadge status={dose.status} />

              {dose.status === 'pending' ? (
                <div className="flex gap-2">
                  <button
                    onClick={() => markDose(dose.id, 'taken')}
                    className="btn-small-primary"
                  >
                    <Check size={14} /> Taken
                  </button>
                  <button
                    onClick={() => markDose(dose.id, 'missed')}
                    className="btn-small-secondary"
                  >
                    Missed
                  </button>
                </div>
              ) : (
                <span className="text-xs text-muted">
                  Recorded events cannot be undone here.
                </span>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export function SafetyCenter() {
  const { patient, history, recordSafetyCheck } = useApp()
  const [name, setName] = useState('')
  const [ingredient, setIngredient] = useState('')
  const [result, setResult] = useState(null)
  const [checkedAt, setCheckedAt] = useState('')

  const medications = patient.medications || []
  const allergies = patient.allergies || []
  const active = medications.filter(
    (medication) =>
      ['active'].includes(String(medication.status).toLowerCase()),
  )
  const safetyHistory = (history || []).filter((item) =>
    String(item.type).toLowerCase().includes('safety'),
  )

  const check = (event) => {
    event.preventDefault()

    const checkResult = checkMedication(
      { name, ingredient },
      patient,
      active,
    )

    setResult(checkResult)
    setCheckedAt(new Date().toLocaleString())

    if (!checkResult.incomplete) {
      recordSafetyCheck(
        name.trim(),
        ingredient.trim().toLowerCase(),
        checkResult.findings.length,
      )
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="rounded-xl bg-mint p-3 text-forest">
          <ShieldCheck size={24} />
        </div>
        <div>
          <h2 className="text-xl font-semibold">Medication Safety Shield</h2>
          <p className="mt-1 text-sm text-muted">
            A review aid, not a substitute for a pharmacist or clinician.
          </p>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_.8fr]">
        <section className="card">
          <SectionHeading
            title="Check proposed medication"
            subtitle="Runs local demo rules against the current medication list and allergies."
          />

          <form onSubmit={check} className="space-y-4">
            <label className="form-label">
              Proposed medication
              <input
                className="field"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="e.g. Amoxil"
                required
              />
            </label>

            <label className="form-label">
              Active ingredient
              <input
                className="field"
                value={ingredient}
                onChange={(event) => setIngredient(event.target.value)}
                placeholder="e.g. amoxicillin"
              />
            </label>

            <button className="btn-primary" type="submit">
              <ShieldCheck size={17} /> Run demo check
            </button>
          </form>

          <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm font-semibold">Checked against</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {active.map((medication) => (
                <span
                  key={medication.id || medication.medicationId || medication.name}
                  className="rounded-full bg-white px-3 py-1.5 text-xs text-slate-700 ring-1 ring-slate-200"
                >
                  {medication.name}
                </span>
              ))}

              {allergies.map((allergy) => (
                <span
                  key={allergy}
                  className="rounded-full bg-amber-50 px-3 py-1.5 text-xs text-amber-800 ring-1 ring-amber-200"
                >
                  Allergy: {allergy}
                </span>
              ))}
            </div>
          </div>
        </section>

        <section className="card">
          <SectionHeading
            title="Check result"
            subtitle="Results require professional review."
          />

          {!result ? (
            <EmptyState
              title="No check performed"
              detail="Enter a proposed medicine to see the demo workflow."
            />
          ) : (
            <>
              <SafetyResult result={result} />
              <p className="mt-4 text-xs leading-5 text-muted">
                Source: local demo rules. Checked {checkedAt}.
              </p>
              <p className="mt-3 text-xs text-amber-800">
                This demo does not verify every drug interaction and must not
                be used to make medication decisions.
              </p>
            </>
          )}
        </section>
      </div>

      <section className="card">
        <SectionHeading title="Recent safety history" />
        {safetyHistory.length === 0 ? (
          <EmptyState
            title="No recorded safety events"
            detail="Completed demo checks may appear here."
          />
        ) : (
          safetyHistory.slice(0, 6).map((item) => (
            <div
              key={item.id}
              className="border-t border-slate-100 py-3 first:border-0"
            >
              <p className="font-medium">{item.detail}</p>
              <p className="mt-1 text-xs text-muted">
                {item.time} · {item.actor}
              </p>
            </div>
          ))
        )}
      </section>
    </div>
  )
}

export function Alerts() {
  const { alerts, acknowledgeAlert } = useApp()

  return (
    <div className="space-y-5">
      <SectionHeading
        title="Alerts & notifications"
        subtitle="In-app alerts. External notification delivery must be configured and verified separately."
      />

      {(alerts || []).length === 0 && (
        <EmptyState
          title="No alerts"
          detail="There are no alerts to display."
        />
      )}

      <div className="space-y-3">
        {(alerts || []).map((alert) => (
          <article
            key={alert.id}
            className="card flex flex-wrap items-start gap-4"
          >
            <div
              className={`rounded-xl p-3 ${
                alert.severity === 'warning'
                  ? 'bg-rose-50 text-rose-700'
                  : 'bg-amber-50 text-amber-700'
              }`}
            >
              <AlertTriangle size={20} />
            </div>

            <div className="min-w-[180px] flex-1">
              <h3 className="font-semibold">{alert.title}</h3>
              <p className="mt-1 text-sm text-muted">{alert.detail}</p>
              <p className="mt-2 text-xs text-slate-400">{alert.time}</p>
              <p className="mt-2 text-xs text-muted">
                In-app status does not confirm that an SMS or push notification
                was delivered.
              </p>
            </div>

            <StatusBadge status={alert.status} />

            {alert.status !== 'Acknowledged' && (
              <button
                onClick={() => acknowledgeAlert(alert.id)}
                className="btn-small-primary"
              >
                Acknowledge
              </button>
            )}
          </article>
        ))}
      </div>
    </div>
  )
}

export function History() {
  const { history } = useApp()
  const items = history || []

  return (
    <div className="space-y-5">
      <SectionHeading
        title="Shared medication history"
        subtitle="Chronological record of available dose events, prescriptions and reviews."
      />

      <div className="card">
        {items.length === 0 ? (
          <EmptyState
            title="No history yet"
            detail="Recorded events will appear here."
          />
        ) : (
          <div className="relative space-y-0">
            {items.map((item, index) => (
              <div
                key={item.id || `${item.type}-${item.time}-${index}`}
                className="relative flex gap-4 pb-7 last:pb-0"
              >
                <div className="relative flex flex-col items-center">
                  <div className="z-10 rounded-full border-4 border-white bg-mint p-2 text-forest">
                    <HistoryIcon size={15} />
                  </div>
                  {index !== items.length - 1 && (
                    <div className="absolute top-8 h-full w-px bg-slate-200" />
                  )}
                </div>

                <div className="flex-1 pb-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-semibold">{item.type}</p>
                    <span className="text-xs text-muted">{item.time}</span>
                  </div>
                  <p className="mt-1 text-sm text-muted">{item.detail}</p>
                  <p className="mt-2 text-xs text-slate-400">
                    Actor: {item.actor || 'System'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export function Patients() {
  const { patient } = useApp()

  return (
    <div className="space-y-5">
      <SectionHeading
        title="Authorized patient records"
        subtitle="This view displays the patient record available in the current app context."
      />

      <div className="card">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-mint font-semibold text-forest">
            {(patient.name || 'Patient')
              .split(' ')
              .map((part) => part[0])
              .join('')
              .slice(0, 2)
              .toUpperCase()}
          </div>

          <div className="flex-1">
            <h3 className="font-semibold">{patient.name || 'Patient'}</h3>
            <p className="mt-1 text-sm text-muted">
              {patient.age ? `Age ${patient.age}` : 'Age not specified'}
            </p>
            <p className="mt-1 text-sm text-muted">
              Allergies: {(patient.allergies || []).join(', ') || 'None recorded'}
            </p>
          </div>
          <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700">
            Record loaded
          </span>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          {(patient.medications || [])
            .filter(
              (medication) =>
                String(medication.status).toLowerCase() === 'active',
            )
            .map((medication) => (
              <div
                key={medication.id || medication.medicationId || medication.name}
                className="rounded-xl border border-slate-100 p-3"
              >
                <p className="font-semibold">{medication.name}</p>
                <p className="mt-1 text-sm text-muted">
                  {medication.strength ||
                    `${medication.dose || ''} ${medication.unit || ''}`.trim()}
                </p>
              </div>
            ))}
        </div>
      </div>
    </div>
  )
}

const stockLabel = {
  in: ['In stock', 'bg-emerald-50 text-emerald-700'],
  low: ['Low stock', 'bg-amber-50 text-amber-700'],
  out: ['Out of stock', 'bg-rose-50 text-rose-700'],
}

export function Pharmacies() {
  const { patient } = useApp()
  const [query, setQuery] = useState('')
  const [type, setType] = useState('All')
  const q = query.trim().toLowerCase()

  const places = demoPlaces
    .filter((place) => type === 'All' || place.type === type)
    .filter(
      (place) =>
        !q ||
        Object.entries(place.stock || {}).some(
          ([ingredient, status]) =>
            ingredient.toLowerCase().includes(q) && status !== 'out',
        ) ||
        place.name.toLowerCase().includes(q),
    )
    .sort((a, b) => a.distanceKm - b.distanceKm)

  const active = (patient.medications || []).filter(
    (medication) =>
      String(medication.status).toLowerCase() === 'active',
  )

  return (
    <div className="space-y-5">
      <SectionHeading
        title="Find medicines nearby"
        subtitle="Location and stock information below is fictional demo data, not live pharmacy inventory."
      />

      <div className="card">
        <div className="mb-5 flex flex-wrap gap-3">
          <div className="relative min-w-[220px] max-w-md flex-1">
            <Search
              className="absolute left-3 top-3 text-slate-400"
              size={17}
            />
            <input
              className="field pl-10"
              placeholder="e.g. metformin"
              aria-label="Search medicine or place"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>

          <select
            className="field !mt-0 max-w-[160px]"
            value={type}
            onChange={(event) => setType(event.target.value)}
            aria-label="Filter by type"
          >
            <option>All</option>
            <option>Pharmacy</option>
            <option>Hospital</option>
          </select>
        </div>

        {places.length === 0 ? (
          <EmptyState
            title="Nothing found"
            detail="No demo location matches that search."
          />
        ) : (
          <div className="space-y-3">
            {places.map((place) => (
              <article
                key={place.id}
                className="flex flex-wrap items-start gap-4 rounded-2xl border border-slate-100 p-4"
              >
                <div className="rounded-xl bg-mint p-3 text-forest">
                  <MapPin size={20} />
                </div>

                <div className="min-w-[200px] flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold">{place.name}</h3>
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                      {place.type}
                    </span>
                  </div>

                  <p className="mt-1 text-sm text-muted">
                    {place.address} · {place.hours}
                  </p>
                  <p className="mt-1 text-sm text-muted">
                    Distance: {place.distanceKm} km
                  </p>

                  <div className="mt-3 flex flex-wrap gap-2">
                    {Object.entries(place.stock || {}).map(
                      ([ingredient, status]) => {
                        const [label, style] =
                          stockLabel[status] || stockLabel.out

                        return (
                          <span
                            key={ingredient}
                            className={`rounded-full px-3 py-1.5 text-xs ${style}`}
                          >
                            {ingredient}: {label}
                          </span>
                        )
                      },
                    )}
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      <section className="card">
        <SectionHeading
          title="Your active medicines"
          subtitle="Use this list when discussing availability with a pharmacist."
        />
        {active.length === 0 ? (
          <EmptyState
            title="No active medicines"
            detail="No active medication is available in the current record."
          />
        ) : (
          <div className="flex flex-wrap gap-2">
            {active.map((medication) => (
              <span
                key={medication.id || medication.medicationId || medication.name}
                className="rounded-full bg-mint px-3 py-1.5 text-xs text-forest"
              >
                {medication.name}
              </span>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

export function Prescriptions() {
  return (
    <div className="space-y-5">
      <SectionHeading
        title="Prescription management"
        subtitle="Prescription actions depend on the configured prescription service."
      />
      <PrescriptionManager />
    </div>
  )
}
