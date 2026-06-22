/* eslint-disable @typescript-eslint/no-explicit-any */
import { Routes, Route, Link } from 'react-router-dom';

import CandidateLogin from './components/CandidateLogin';
import CandidateDashboard from './components/CandidateDashboard';
import RecruiterDashboard from './components/RecruiterDashboard';
import ProtectedRoute from './components/ProtectedRoute';
import CandidateApplication from './components/CandidateApplication';
import Authenticate from './components/Authenticate';

import Layout from './components/recruiter/Layout';
import HomePage from './components/recruiter/HomePage';
import RolesPage from './components/recruiter/RolesPage';
import OrganizationPage from './components/recruiter/OrganizationPage';

// ---------------------------------------------------------
// PAGE 1: The Public Landing Page
function LandingPage() {
  return (
    <div className="min-h-screen flex font-sans overflow-hidden relative bg-black">
      {/* Background Image spans full screen */}
      <img 
        src="/office.webp" 
        alt="AcmeHire Office" 
        className="absolute inset-0 w-full h-full object-cover"
      />
      {/* Optional overlay to darken image slightly if needed */}
      <div className="absolute inset-0 bg-black/50 pointer-events-none"></div>

      {/* Main Layout Container */}
      <div className="relative z-10 flex w-full min-h-screen">
        {/* Left spacer */}
        <div className="hidden lg:block lg:w-[50%]"></div>

        {/* Right side: Login Panel */}
        <div className="w-full lg:w-[50%] flex flex-col items-center justify-center p-8 relative">
          
          {/* Angled Backgrounds SVG */}
          <div className="hidden lg:block absolute inset-y-0 right-0 w-[160%] pointer-events-none -z-10">
            <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full">
              {/* Transparent protruding layer */}
              <path 
                d="M 100,0 L 25,0 L 0,100 L 100,100 Z" 
                fill="rgba(20, 20, 20, 0.8)" 
              />
              {/* Solid layer hugging the box */}
              <path 
                d="M 100,0 L 48,0 L 30,100 L 100,100 Z" 
                fill="#000000" 
              />
            </svg>
          </div>
          
          {/* Mobile solid background */}
          <div className="lg:hidden absolute inset-0 bg-black -z-10"></div>

          {/* Star decoration */}
          <div className="absolute bottom-8 right-8 text-gray-500 opacity-20 pointer-events-none z-10">
            <svg width="60" height="60" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0l2.5 9.5L24 12l-9.5 2.5L12 24l-2.5-9.5L0 12l9.5-2.5z"/></svg>
          </div>

          <div className="bg-gray-900 rounded-xl shadow-2xl p-10 w-full max-w-md border border-gray-800 relative z-30">
            <div className="text-center mb-8">
              <h1 className="text-4xl font-extrabold mb-4 tracking-tight drop-shadow-sm">
                <span className="text-white">AcmeHire</span> <span className="text-gray-400">Portal</span>
              </h1>
              <p className="text-gray-400 text-sm leading-relaxed px-2">
                The intelligent hiring platform that keeps candidates engaged and helps recruiters move faster.
              </p>
            </div>
            
            <div className="border-t border-gray-800 pt-8 text-center bg-gray-900">
              <h2 className="text-white text-lg font-bold mb-6 tracking-wide">Sign In to Your Account</h2>
              
              <div className="flex flex-col gap-4">
                <Link to="/login" className="flex items-center justify-center gap-3 bg-white hover:bg-gray-200 text-black font-bold py-3.5 px-6 rounded-md shadow-lg transition-transform transform hover:-translate-y-1">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd"></path></svg>
                  CANDIDATE LOGIN
                </Link>
                
                <Link to="/login" className="flex items-center justify-center gap-3 bg-gray-800 hover:bg-gray-700 text-white font-bold py-3.5 px-6 rounded-md shadow-lg transition-transform transform hover:-translate-y-1 border border-gray-600 hover:border-gray-500">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                  RECRUITER LOGIN
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------
// MASTER ROUTER
// ---------------------------------------------------------
export default function App() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path='/' element={<LandingPage />} />
      <Route path='/login' element={<CandidateLogin />} />
      <Route path='/authenticate' element={<Authenticate />} />
      
      {/* Protected Routes (Requires Stytch Auth) */}
      <Route element={<ProtectedRoute />}>
        {/* Candidate Routes */}
        <Route path='/apply' element={<CandidateApplication />} />
        <Route path='/candidate-dashboard/*' element={<CandidateDashboard />} />
        
        {/* Recruiter Routes */}
        <Route path='/recruiter-dashboard' element={<Layout><HomePage /></Layout>} />
        <Route path='/recruiter-dashboard/home' element={<Layout><HomePage /></Layout>} />
        <Route path='/recruiter-dashboard/candidates' element={<Layout><RecruiterDashboard /></Layout>} />
        <Route path='/recruiter-dashboard/organization' element={<Layout><OrganizationPage /></Layout>} />
        <Route path='/recruiter-dashboard/roles' element={<Layout><RolesPage /></Layout>} />
      </Route>
    </Routes>
  );
}
