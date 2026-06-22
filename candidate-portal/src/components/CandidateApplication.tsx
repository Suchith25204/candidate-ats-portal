import { useState, useEffect } from 'react';
import { useStytchMember } from '@stytch/react/b2b';
import { useNavigate } from 'react-router-dom';
import { APIService } from '../services/api';

export default function CandidateApplication() {
  const navigate = useNavigate();

  const verifiedEmail = localStorage.getItem('candidateEmail') || '';

  const [name, setName] = useState('');
  const [roles, setRoles] = useState<any[]>([]);
  const [role, setRole] = useState('');
  const [aboutYourself, setAboutYourself] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchRoles = async () => {
      const fetchedRoles = await APIService.getRoles();
      setRoles(fetchedRoles || []);
    };
    fetchRoles();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    if (!role) {
      setError('Please select a role.');
      setIsSubmitting(false);
      return;
    }

    try {
      await APIService.addCandidateFromApplication({
        name,
        email: verifiedEmail,
        role,
        aboutYourself,
      });

      navigate('/candidate-dashboard');
    } catch (err: any) {
      console.error('Application Error:', err);
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-900 flex flex-col items-center justify-center p-6">
      <div className="bg-black p-8 rounded-lg shadow-xl border border-neutral-800 max-w-lg w-full">
        <h2 className="text-3xl font-bold text-white mb-2">Tell Us About Yourself</h2>
        <p className="text-neutral-400 mb-8">Complete your application to be considered for a role.</p>

        {error && <p className="text-red-500 text-sm mb-4 bg-red-500/10 p-3 rounded">{error}</p>}

        <form onSubmit={handleSubmit}>
          {/* Email — read-only from Stytch */}
          <div className="mb-5">
            <label className="block text-sm font-bold text-neutral-400 mb-2">Verified Email</label>
            <input
              type="email"
              value={verifiedEmail}
              disabled
              className="w-full p-3 border border-neutral-800 rounded bg-neutral-900 text-neutral-500 cursor-not-allowed"
            />
          </div>

          {/* Full Name */}
          <div className="mb-5">
            <label className="block text-sm font-bold text-neutral-400 mb-2">Full Name</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Alex Johnson"
              className="w-full p-3 bg-black border border-neutral-700 rounded focus:border-white outline-none text-white transition-colors"
              required
            />
          </div>

          {/* Desired Role */}
          <div className="mb-5">
            <label className="block text-sm font-bold text-neutral-400 mb-2">Desired Role</label>
            {roles.length > 0 ? (
              <select
                value={role}
                onChange={e => setRole(e.target.value)}
                className="w-full p-3 bg-black border border-neutral-700 rounded focus:border-white outline-none text-white transition-colors cursor-pointer"
                required
              >
                <option value="" disabled>Select a role...</option>
                {roles.map(r => (
                  <option key={r.id} value={r.title}>{r.title}</option>
                ))}
              </select>
            ) : (
              <div className="w-full p-3 bg-neutral-900 border border-neutral-800 rounded text-neutral-500">
                No roles are currently open for applications.
              </div>
            )}
          </div>

          {/* About Yourself */}
          <div className="mb-8">
            <label className="block text-sm font-bold text-neutral-400 mb-2">Tell us about yourself</label>
            <textarea
              value={aboutYourself}
              onChange={e => setAboutYourself(e.target.value)}
              placeholder="Describe your experience, skills, and what excites you about this role..."
              rows={4}
              className="w-full p-3 bg-black border border-neutral-700 rounded focus:border-white outline-none resize-none text-white transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-white hover:bg-neutral-200 text-black font-bold py-4 rounded transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Submitting...' : 'Submit Application'}
          </button>
        </form>
      </div>
    </div>
  );
}
