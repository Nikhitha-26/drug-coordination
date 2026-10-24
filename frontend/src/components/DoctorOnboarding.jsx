import { useState, useEffect } from 'react';
import api from '../services/api'; // Using your existing api service

export default function DoctorOnboarding({ onComplete }) {
  const [doctorCode, setDoctorCode] = useState('');

  useEffect(() => {
    // Assuming backend generates a human-readable code (e.g., DOC-8F92A)
    const fetchCode = async () => {
      const response = await api.post('/generate-doctor-code');
      setDoctorCode(response.data.code);
    };
    fetchCode();
  }, []);

  return (
    <div className="onboarding-container">
      <h1>Welcome, Doctor</h1>
      <p>Share this unique code with your patients so they can link to your profile:</p>
      <div className="code-display text-2xl font-bold p-4 bg-gray-100 rounded">
        {doctorCode || 'Generating...'}
      </div>
      <button onClick={onComplete}>Go to Dashboard</button>
    </div>
  );
}