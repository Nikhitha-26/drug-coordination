import { useState } from 'react';
import api from '../services/api';

export default function PatientOnboarding({ onComplete }) {
  const [doctorCode, setDoctorCode] = useState('');
  const [status, setStatus] = useState('');

  const handleLink = async () => {
    try {
      setStatus('Linking...');
      // Sends the code to your teammate's backend to link patient -> doctor
      await api.post('/link-doctor', { code: doctorCode });
      setStatus('Success! Redirecting...');
      setTimeout(onComplete, 1000); // Trigger transition to Dashboard
    } catch (error) {
      setStatus('Invalid code or connection error.');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <h1 className="text-2xl font-bold mb-4">Connect to Your Doctor</h1>
      <p className="mb-4 text-gray-600">Enter the unique code provided by your doctor.</p>
      
      <input 
        type="text" 
        placeholder="e.g. DOC-8F92A" 
        value={doctorCode}
        onChange={(e) => setDoctorCode(e.target.value.toUpperCase())}
        className="border-2 border-gray-300 p-2 rounded mb-4 w-64 text-center uppercase"
      />
      
      <button 
        onClick={handleLink} 
        className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
      >
        Link Account
      </button>
      
      {status && <p className="mt-4 font-medium">{status}</p>}
    </div>
  );
}