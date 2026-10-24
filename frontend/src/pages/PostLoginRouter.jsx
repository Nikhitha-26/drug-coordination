import { useContext } from 'react';
import { AppContext } from '../context/AppContext';
import DoctorOnboarding from './DoctorOnboarding'; // Assuming you created this
import PatientOnboarding from './PatientOnboarding'; // Assuming you created this
import Dashboard from './Dashboard';

export default function PostLoginRouter() {
  const { user, isOnboarded, setIsOnboarded } = useContext(AppContext);

  const handleOnboardingComplete = () => {
    setIsOnboarded(true);
    // Optional: Make an API call here to save their onboarded status to the database
  };

  if (!isOnboarded) {
    return user?.role === 'doctor' 
      ? <DoctorOnboarding onComplete={handleOnboardingComplete} /> 
      : <PatientOnboarding onComplete={handleOnboardingComplete} />;
  }

  return <Dashboard />;
}