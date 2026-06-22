import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { APIService } from '../services/api';

export default function CandidateLogin() {
  const navigate = useNavigate();

  const [step, setStep] = useState<'email' | 'otp'>('email');
  const [email, setEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [methodId, setMethodId] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Step 1: Send OTP to email
  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      const response = await fetch('http://localhost:3001/api/b2b/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to send OTP');

      setMethodId(data.method_id || 'unknown');
      setStep('otp');
    } catch (err: any) {
      console.error('OTP Send Error:', err);
      setError(err.message || 'Failed to send verification code. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2: Verify OTP and route based on ATS status
  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      const response = await fetch('http://localhost:3001/api/b2b/authenticate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email, code: otpCode })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to verify OTP');

      // ATS Routing: check if user is a recruiter first
      const res = await fetch(`http://localhost:3001/api/recruiters/${encodeURIComponent(email)}`);
      const existingRecruiter = res.ok ? await res.json() : null;

      if (existingRecruiter) {
        localStorage.setItem('recruiterEmail', email);
        localStorage.setItem('recruiterRole', existingRecruiter.role || 'Recruiter');
        navigate('/recruiter-dashboard');
        return;
      }

      // Check if candidate exists in the database
      const existingCandidate = await APIService.getCandidateByEmail(email);

      if (existingCandidate) {
        localStorage.setItem('candidateEmail', email);
        // Existing candidate — route based on their current stage
        const advancedStages = ['Test Enabled', 'Test Sent', 'Test Completed', 'Interview Scheduled', 'Offer Extended', 'Hired'];
        if (advancedStages.includes(existingCandidate.stage)) {
          navigate('/candidate-dashboard'); // Skip onboarding, go straight to test/status
        } else {
          // Stage is 'Applied'
          navigate('/candidate-dashboard');
        }
      } else {
        localStorage.setItem('candidateEmail', email);
        // Brand new user — send to onboarding application form
        navigate('/apply');
      }
    } catch (err: any) {
      console.error('OTP Verify Error:', err);
      setError(err.message || 'Invalid or expired code. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-obsidian flex flex-col items-center justify-center p-6 font-sans">
      <button onClick={() => navigate('/')} className="absolute top-6 left-6 text-teal-500 hover:text-teal-400 font-medium flex items-center gap-2 transition-colors">&larr; Back to Home</button>

      <div className="bg-carbon p-8 rounded-xl shadow-2xl border border-gray-800 max-w-sm w-full text-center relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-teal-500/10 rounded-full blur-2xl"></div>
        <h2 className="text-2xl font-bold text-gray-100 mb-6 relative z-10">AcmeHire Login</h2>

        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

        {step === 'email' ? (
          <form onSubmit={handleSendCode} className="text-left relative z-10">
            <div className="mb-6">
              <label className="block text-gray-400 text-sm font-bold mb-2">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full p-3 bg-obsidian border border-gray-700 text-gray-200 rounded-lg focus:ring-1 focus:ring-teal-500 outline-none transition-all"
                required
              />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-teal-600 hover:bg-teal-500 text-white font-bold py-3 rounded-lg transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Sending...' : 'Send Verification Code'}
            </button>
            <div className="mt-6 text-xs text-gray-500 text-left bg-obsidian p-3 rounded-lg border border-gray-800">
              <p><strong>How it works:</strong> Enter your email to receive a 6-digit verification code. Use the code to securely sign in.</p>
            </div>
          </form>
        ) : (
          <form onSubmit={handleVerifyCode} className="text-left relative z-10">
            <div className="bg-teal-900/20 border border-teal-500/30 text-teal-400 p-3 rounded-lg mb-6 text-sm">
              <p>Code sent to <strong className="text-teal-300">{email}</strong></p>
            </div>
            <div className="mb-6">
              <label className="block text-gray-400 text-sm font-bold mb-2">Verification Code</label>
              <input
                type="text"
                value={otpCode}
                onChange={e => setOtpCode(e.target.value)}
                placeholder="Enter 6-digit code"
                maxLength={6}
                className="w-full p-3 bg-obsidian border border-gray-700 text-gray-200 rounded-lg focus:ring-1 focus:ring-teal-500 outline-none transition-all text-center text-2xl tracking-[0.5em] font-mono"
                required
                autoFocus
              />
            </div>
            <button
              type="submit"
              disabled={isLoading || otpCode.length < 6}
              className="w-full bg-teal-600 hover:bg-teal-500 text-white font-bold py-3 rounded-lg transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Verifying...' : 'Verify & Sign In'}
            </button>
            <button
              type="button"
              onClick={() => { setStep('email'); setOtpCode(''); setError(''); }}
              className="w-full text-teal-500 text-sm mt-4 hover:text-teal-400 hover:underline transition-colors"
            >
              Use a different email
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
