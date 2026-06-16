import { useEffect, useRef } from 'react';
import { useStytch } from '@stytch/react';
import { useNavigate } from 'react-router-dom';
import { APIService } from '../services/api';

export default function Authenticate() {
  const stytch = useStytch();
  const navigate = useNavigate();
  const hasAttemptedAuth = useRef(false);

  useEffect(() => {
    // Prevent React Strict Mode from firing authentication twice (causes 400 error)
    if (hasAttemptedAuth.current) return;

    const token = new URLSearchParams(window.location.search).get('token');
    const tokenType = new URLSearchParams(window.location.search).get('stytch_token_type');

    if (token && tokenType === 'magic_links') {
      hasAttemptedAuth.current = true;

      stytch.magicLinks.authenticate(token, { session_duration_minutes: 60 })
        .then(async (response) => {
          // Get the authenticated user's email from the Stytch response
          const email = response?.user?.emails?.[0]?.email;

          if (email) {
            // Check if this candidate already exists in the database
            const existingCandidate = await APIService.getCandidateByEmail(email);

            if (existingCandidate) {
              // Existing user → send straight to dashboard
              navigate('/candidate-dashboard');
            } else {
              // New user → send to application form
              navigate('/apply');
            }
          } else {
            // Fallback: if we can't get the email, send to apply
            navigate('/apply');
          }
        })
        .catch(err => {
          console.error('Authentication Error:', err);
          navigate('/?error=auth_failed');
        });
    } else {
      navigate('/');
    }
  }, [stytch, navigate]);

  return (
    <div className="min-h-screen bg-blue-50/30 flex items-center justify-center p-6">
      <div className="bg-white p-8 rounded-lg shadow-md border border-gray-200 text-center max-w-sm w-full animate-pulse">
        <h2 className="text-xl font-bold text-gray-800 mb-2">Authenticating...</h2>
        <p className="text-gray-500">Verifying your secure link.</p>
      </div>
    </div>
  );
}
