import { useState } from 'react';
import { useStytchMember } from '@stytch/react/b2b';
import { useNavigate } from 'react-router-dom';
import { APIService } from '../services/api';

export default function CandidateApplication() {
  const navigate = useNavigate();

  const verifiedEmail = localStorage.getItem('candidateEmail') || '';

  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [aboutYourself, setAboutYourself] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

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
    <div className="min-h-screen bg-blue-50/30 flex flex-col items-center justify-center p-6">
      <div className="bg-white p-8 rounded-lg shadow-md border border-gray-200 max-w-lg w-full">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Tell Us About Yourself</h2>
        <p className="text-gray-500 mb-6">Complete your application to be considered for a role.</p>

        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

        <form onSubmit={handleSubmit}>
          {/* Email — read-only from Stytch */}
          <div className="mb-4">
            <label className="block text-sm font-bold text-gray-700 mb-2">Verified Email</label>
            <input
              type="email"
              value={verifiedEmail}
              disabled
              className="w-full p-3 border rounded bg-gray-100 text-gray-500 cursor-not-allowed"
            />
          </div>

          {/* Full Name */}
          <div className="mb-4">
            <label className="block text-sm font-bold text-gray-700 mb-2">Full Name</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Alex Johnson"
              className="w-full p-3 border rounded focus:ring-2 focus:ring-blue-500 outline-none text-gray-900"
              required
            />
          </div>

          {/* Desired Role */}
          <div className="mb-4">
            <label className="block text-sm font-bold text-gray-700 mb-2">Desired Role</label>
            <input
              type="text"
              value={role}
              onChange={e => setRole(e.target.value)}
              placeholder="e.g. Senior React Developer"
              className="w-full p-3 border rounded focus:ring-2 focus:ring-blue-500 outline-none text-gray-900"
              required
            />
          </div>

          {/* About Yourself */}
          <div className="mb-6">
            <label className="block text-sm font-bold text-gray-700 mb-2">Tell us about yourself</label>
            <textarea
              value={aboutYourself}
              onChange={e => setAboutYourself(e.target.value)}
              placeholder="Describe your experience, skills, and what excites you about this role..."
              rows={4}
              className="w-full p-3 border rounded focus:ring-2 focus:ring-blue-500 outline-none resize-none text-gray-900"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Submitting...' : 'Submit Application'}
          </button>
        </form>
      </div>
    </div>
  );
}
