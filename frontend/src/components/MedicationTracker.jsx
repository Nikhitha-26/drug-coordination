import { useState } from 'react';
import api from '../services/api'; // Connects to your existing api.js

export default function MedicationTracker({ initialMedicines }) {
  const [meds, setMeds] = useState(initialMedicines);

  const toggleTaken = async (medId, currentStatus) => {
    setMeds(meds.map(m => m.id === medId ? { ...m, taken: !currentStatus } : m));
    await api.patch(`/medicines/${medId}/status`, { taken: !currentStatus });
  };

  if (meds.length === 0) return null;

  return (
    <div className="mt-6">
      <h3>Your Daily Medications</h3>
      <ul>
        {meds.map((med) => (
          <li key={med.id} className="flex items-center gap-4 py-2 border-b">
            <input 
              type="checkbox" 
              checked={med.taken} 
              onChange={() => toggleTaken(med.id, med.taken)} 
              className="w-5 h-5"
            />
            <div>
              <p className="font-bold">{med.name} - {med.dosage}</p>
              <p className="text-sm text-gray-500">{med.frequency}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}