import MedicationTracker from './MedicationTracker';
import { useState } from 'react';
import api from '../services/api';

export default function PrescriptionManager() {
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [medicines, setMedicines] = useState([]);

  const handleUpload = async () => {
    if (!file) return;
    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      const response = await api.post('/analyze-prescription', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      // Pass the new medicines up to the Dashboard to update the Tracker
      if (onUploadSuccess) onUploadSuccess(response.data.medicines); 
    } catch (error) {
      console.error("Upload failed", error);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="p-4">
      <h2>Upload New Prescription</h2>
      <input type="file" accept="image/*,.pdf" onChange={(e) => setFile(e.target.files[0])} />
      <button onClick={handleUpload} disabled={isUploading || !file}>
        {isUploading ? 'Analyzing...' : 'Upload & Analyze'}
      </button>

      {/* Render Medication Tracker immediately after upload */}
      <MedicationTracker initialMedicines={medicines} />
    </div>
  );
}