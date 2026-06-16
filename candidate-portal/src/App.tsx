/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from 'react';
import { Routes, Route, Link, useNavigate } from 'react-router-dom';

import Authenticate from './components/Authenticate';
import CandidateLogin from './components/CandidateLogin';
import CandidateDashboard from './components/CandidateDashboard';
import RecruiterDashboard from './components/RecruiterDashboard';

      // PAGE 1: The Public Landing Page
      // ---------------------------------------------------------
      function LandingPage() {
  return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">
        <div className="text-center max-w-2xl">
          <h1 className="text-5xl font-extrabold text-gray-900 mb-6">Hiring Portal</h1>
          <p className="text-xl text-gray-600 mb-12">The intelligent hiring platform that keeps candidates engaged and helps recruiters move faster.</p>

          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <Link to="/candidate-login" className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-8 rounded-lg shadow-lg transition-transform transform hover:-translate-y-1">
              Candidate Login
            </Link>
            <Link to="/recruiter" className="bg-gray-800 hover:bg-gray-900 text-white font-bold py-4 px-8 rounded-lg shadow-lg transition-transform transform hover:-translate-y-1">
              Recruiter Login
            </Link>
          </div>
        </div>
      </div>
      );
}

        // PAGE 3: The Recruiter Flow 
        // ---------------------------------------------------------
        function RecruiterFlow() {
  const navigate = useNavigate();
        const [isLoggedIn, setIsLoggedIn] = useState(false);
        const [user, setUser] = useState<any>(null);
          const [username, setUsername] = useState('');
          const [password, setPassword] = useState('');
          const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
            e.preventDefault();
          try {
      const {AuthService} = await import('./services/auth');
          const loggedInUser = await AuthService.recruiterLogin(username, password);
          if (loggedInUser) {
            setUser(loggedInUser);
            setIsLoggedIn(true);
          } else {
            setError('Invalid login');
          }
    } catch (err: any) {
            setError(err.message || 'Login failed');
    }
  };

          if (!isLoggedIn) {
    return (
          <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-6">
            <button onClick={() => navigate('/')} className="absolute top-6 left-6 text-gray-600 hover:underline font-medium">&larr; Back to Home</button>
            <div className="bg-white p-8 rounded-lg shadow-md border border-gray-200 max-w-sm w-full text-center">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Recruiter Login</h2>
              {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
              <form onSubmit={handleLogin} className="text-left">
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2">Username</label>
                  <input type="text" value={username} onChange={e => setUsername(e.target.value)} className="w-full p-2 border rounded" required />
                </div>
                <div className="mb-6">
                  <label className="block text-gray-700 text-sm font-bold mb-2">Password</label>
                  <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full p-2 border rounded" required />
                </div>
                <button type="submit" className="w-full bg-gray-800 hover:bg-gray-900 text-white font-bold py-3 rounded transition-colors">
                  Login
                </button>
              </form>
              <div className="mt-4 text-xs text-gray-500 text-left bg-gray-50 p-2 rounded border">
                <p><strong>Demo Hint:</strong> Use <br />User: admin / Pass: admin123</p>
              </div>
            </div>
          </div>
          );
  }

          return (
          <div className="min-h-screen bg-gray-100 p-6">
            <button onClick={() => navigate('/')} className="text-gray-600 hover:underline mb-6 font-medium">
              &larr; Back to Home
            </button>

            <div className="max-w-6xl mx-auto animate-fade-in">
              <div className="bg-white p-8 rounded-lg shadow-md border border-gray-200">
                <div className="flex justify-between items-center mb-6 pb-4 border-b">
                  <div>
                    <h1 className="text-2xl font-bold text-gray-800">Recruiter Operations</h1>
                    <p className="text-sm text-gray-500 mt-1">Logged in as: <span className="font-semibold text-gray-700">{user?.name}</span> ({user?.department})</p>
                  </div>
                  <button onClick={() => { setIsLoggedIn(false); setUser(null); }} className="text-sm bg-red-50 text-red-600 hover:bg-red-100 px-4 py-2 rounded transition-colors">
                    Secure Sign Out
                  </button>
                </div>
                <RecruiterDashboard />
              </div>
            </div>
          </div>
          );
}

          // ---------------------------------------------------------
          // MASTER ROUTER
          // ---------------------------------------------------------
          import ProtectedRoute from './components/ProtectedRoute';
import CandidateApplication from './components/CandidateApplication';

export default function App() {
  return (
          <Routes>
            <Route path='/' element={<LandingPage />} />
            <Route path='/candidate-login' element={<CandidateLogin />} />
            <Route path='/authenticate' element={<Authenticate />} />
            
            <Route element={<ProtectedRoute />}>
              <Route path='/apply' element={<CandidateApplication />} />
              <Route path='/candidate-dashboard/*' element={<CandidateDashboard />} />
            </Route>

            <Route path='/recruiter/*' element={<RecruiterFlow />} />
          </Routes>
          );
}
