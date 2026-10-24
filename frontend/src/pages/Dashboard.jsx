import { useContext, useEffect, useState } from 'react';
import { AppContext } from '../context/AppContext';
import PrescriptionManager from '../components/PrescriptionManager';
import MedicationTracker from '../components/MedicationTracker';
import api from '../services/api';

export default function Dashboard() {
  const { user } = useContext(AppContext);
  const [savedMedicines, setSavedMedicines] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch existing medicines on load if the user is a patient
    if (user?.role === 'patient') {
      api.get('/medicines')
         .then(res => {
           setSavedMedicines(res.data.medicines || []);
           setLoading(false);
         })
         .catch(err => {
           console.error("Failed to load medicines", err);
           setLoading(false);
         });
    }
  }, [user]);

  if (user?.role === 'doctor') {
    const [patients, setPatients] = useState([]);
    const [selectedPatient, setSelectedPatient] = useState(null);
    const [patientMeds, setPatientMeds] = useState([]);

    useEffect(() => {
      api.get('/doctor/patients')
         .then(res => setPatients(res.data.patients || []))
         .catch(err => console.error("Failed to load patients", err));
    }, []);

    const handleViewMedications = async (patient) => {
      setSelectedPatient(patient);
      try {
        // Fetch specific patient's medicines from teammate's backend
        const res = await api.get(`/doctor/patients/${patient.id}/medicines`);
        setPatientMeds(res.data.medicines || []);
      } catch (err) {
        console.error("Failed to fetch patient medications", err);
      }
    };

    return (
      <div className="p-6 max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Doctor Dashboard</h1>
        
        {/* Patient List */}
        <div className="bg-white p-4 border rounded shadow-sm mb-6">
          <h2 className="text-xl font-semibold mb-4">Your Linked Patients</h2>
          {patients.length === 0 ? (
            <p className="text-gray-500">No patients have linked to your account yet.</p>
          ) : (
            <ul>
              {patients.map(patient => (
                <li key={patient.id} className="border-b py-3 flex justify-between items-center">
                  <div>
                    <p className="font-bold">{patient.name}</p>
                    <p className="text-sm text-gray-600">Email: {patient.email}</p>
                  </div>
                  <button 
                    onClick={() => handleViewMedications(patient)}
                    className="bg-blue-100 text-blue-700 px-3 py-1 rounded text-sm hover:bg-blue-200"
                  >
                    View Medications
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Selected Patient Medication View */}
        {selectedPatient && (
          <div className="bg-white p-4 border rounded shadow-sm border-blue-200">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">
                Medications: {selectedPatient.name}
              </h2>
              <button onClick={() => setSelectedPatient(null)} className="text-gray-500 hover:text-red-500">
                Close
              </button>
            </div>
            
            {patientMeds.length === 0 ? (
              <p className="text-gray-500">No medications uploaded by this patient.</p>
            ) : (
              <ul>
                {patientMeds.map(med => (
                  <li key={med.id} className="py-2 border-b">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-bold">{med.name} - {med.dosage}</p>
                        <p className="text-sm text-gray-500">{med.frequency}</p>
                      </div>
                      <span className={`px-2 py-1 text-xs rounded font-bold ${med.taken ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {med.taken ? 'Taken' : 'Pending'}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Patient Dashboard</h1>
      
      {/* Upload new prescription */}
      <div className="mb-8 p-4 border rounded shadow-sm">
        <PrescriptionManager onUploadSuccess={(newMeds) => setSavedMedicines([...savedMedicines, ...newMeds])} />
      </div>

      {/* Track existing and newly uploaded medicines */}
      <div className="p-4 border rounded shadow-sm">
        {loading ? <p>Loading medications...</p> : <MedicationTracker initialMedicines={savedMedicines} />}
      </div>
    </div>
  );
}