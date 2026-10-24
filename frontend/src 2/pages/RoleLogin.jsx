import { useState } from 'react';
import { signIn, signUp } from 'aws-amplify/auth';
import { useNavigate, useParams, Link } from 'react-router-dom';

const ROLE_DISPLAY_NAMES = {
  patient: 'Patient',
  doctor: 'Doctor',
  pharmacy: 'Pharmacy',
  caretaker: 'Caretaker',
  admin: 'Administrator'
};

export default function RoleLogin() {
  const { role } = useParams();
  const navigate = useNavigate();
  const [isSignUp, setIsSignUp] = useState(false);
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [verificationNumber, setVerificationNumber] = useState('');
  const [error, setError] = useState('');

  const displayName = ROLE_DISPLAY_NAMES[role] || 'User';

  const resetForm = () => {
    setName('');
    setEmail('');
    setPassword('');
    setVerificationNumber('');
    setError('');
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    setError('');
    
    try {
      if (isSignUp) {
        await signUp({
          username: email,
          password,
          options: {
            userAttributes: {
              name,
              'custom:role': role,
              ...(role === 'doctor' && { 'custom:license': verificationNumber }),
              ...(role === 'pharmacy' && { 'custom:registration': verificationNumber })
            }
          }
        });
        setIsSignUp(false);
        setError('Account created successfully. Please sign in.');
      } else {
        await signIn({ username: email, password });
        localStorage.setItem('userRole', role);
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.message);
    }
  };

  if (!ROLE_DISPLAY_NAMES[role]) {
    navigate('/login');
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 text-gray-100 p-4 font-sans">
      <div className="w-full max-w-md p-8 rounded-2xl backdrop-blur-md bg-white/5 border border-cyan-500/30 shadow-[0_0_20px_rgba(0,255,255,0.15)]">
        
        <Link to="/login" className="text-sm text-cyan-400 hover:text-cyan-300 mb-6 inline-flex items-center transition-colors">
          ← Back to roles
        </Link>
        
        <h2 className="text-2xl font-bold mb-2 text-cyan-400 drop-shadow-md">
          {displayName} {isSignUp ? 'Registration' : 'Login'}
        </h2>
        <p className="text-gray-400 text-sm mb-6">
          {isSignUp ? 'Create your account to get started' : 'Sign in to access your portal'}
        </p>
        
        {error && (
          <div className={`mb-4 text-sm p-3 rounded border ${error.includes('successfully') ? 'bg-green-900/20 text-green-400 border-green-500/30' : 'bg-red-900/20 text-red-400 border-red-500/30'}`}>
            {error}
          </div>
        )}
        
        <form onSubmit={handleAuth} className="space-y-4">
          {isSignUp && (
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-300">Full Name / Business Name</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full px-4 py-2 bg-gray-800/50 border border-gray-600 rounded-lg focus:outline-none focus:border-cyan-400" required />
            </div>
          )}

          {isSignUp && role === 'doctor' && (
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-300">Medical Registration Number</label>
              <input type="text" value={verificationNumber} onChange={(e) => setVerificationNumber(e.target.value)} className="w-full px-4 py-2 bg-gray-800/50 border border-gray-600 rounded-lg focus:outline-none focus:border-cyan-400" required />
            </div>
          )}

          {isSignUp && role === 'pharmacy' && (
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-300">Pharmacy License Number</label>
              <input type="text" value={verificationNumber} onChange={(e) => setVerificationNumber(e.target.value)} className="w-full px-4 py-2 bg-gray-800/50 border border-gray-600 rounded-lg focus:outline-none focus:border-cyan-400" required />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-1 text-gray-300">Email Address</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-4 py-2 bg-gray-800/50 border border-gray-600 rounded-lg focus:outline-none focus:border-cyan-400" required />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-300">Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-4 py-2 bg-gray-800/50 border border-gray-600 rounded-lg focus:outline-none focus:border-cyan-400" required />
          </div>

          <button type="submit" className="w-full py-2.5 mt-2 font-semibold text-gray-900 bg-cyan-400 rounded-lg hover:bg-cyan-300">
            {isSignUp ? 'Create Account' : 'Sign In'}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-400">
          {isSignUp ? 'Already have an account?' : 'Need an account?'}
          <button onClick={() => { setIsSignUp(!isSignUp); resetForm(); }} className="ml-2 text-cyan-400 hover:text-cyan-300 font-medium">
            {isSignUp ? 'Sign In' : 'Sign Up'}
          </button>
        </div>
      </div>
    </div>
  );
}