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
          // Note: In B2B Discovery, it usually returns an intermediate_session_token and discovered_organizations.
          // For simplicity, we can get the email address from the email_address field.
          const email = response?.email_address;

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
