import { useEffect, useRef } from 'react';
import { useStytchB2BClient } from '@stytch/react/b2b';
import { useNavigate } from 'react-router-dom';
import { APIService } from '../services/api';

export default function Authenticate() {
  const stytch = useStytchB2BClient();
  const navigate = useNavigate();
  const hasAttemptedAuth = useRef(false);

  useEffect(() => {
    // Prevent React Strict Mode from firing authentication twice (causes 400 error)
    if (hasAttemptedAuth.current) return;

    const token = new URLSearchParams(window.location.search).get('token');
    const tokenType = new URLSearchParams(window.location.search).get('stytch_token_type');

    if (token && tokenType === 'discovery') {
      hasAttemptedAuth.current = true;

      stytch.magicLinks.discovery.authenticate({ discovery_magic_links_token: token })
        .then(async (response) => {
          // Get the authenticated user's email from the Stytch B2B response
          const email = response?.email_address || response?.member?.email_address;

          if (email) {
            // Set the local session state
            localStorage.setItem('candidateEmail', email);

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
    <div className="min-h-screen bg-obsidian flex items-center justify-center p-6 font-sans">
      <div className="bg-carbon p-8 rounded-xl shadow-2xl border border-gray-800 text-center max-w-sm w-full animate-pulse relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-teal-500/10 rounded-full blur-2xl"></div>
        <h2 className="text-2xl font-bold text-gray-100 mb-2 relative z-10">Authenticating...</h2>
        <p className="text-gray-400 relative z-10">Verifying your secure link.</p>
        <div className="mt-6 w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto relative z-10"></div>
      </div>
    </div>
  );
}
