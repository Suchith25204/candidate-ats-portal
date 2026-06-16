import { useState } from 'react';
import { useStytch } from '@stytch/react';
import { useNavigate } from 'react-router-dom';

export default function CandidateLogin() {
  const stytch = useStytch();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [isSent, setIsSent] = useState(false);
  const [error, setError] = useState('');

  const handleSendLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await stytch.magicLinks.email.loginOrCreate(email);
      setIsSent(true);
    } catch (err: any) {
      console.error('Magic Link Error:', err);
      setError(err.message || 'Failed to send magic link. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-blue-50/30 flex flex-col items-center justify-center p-6">
      <button onClick={() => navigate('/')} className="absolute top-6 left-6 text-blue-600 hover:underline font-medium">&larr; Back to Home</button>

      <div className="bg-white p-8 rounded-lg shadow-md border border-gray-200 max-w-sm w-full text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Candidate Login</h2>

        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

        {isSent ? (
          <div className="bg-green-50 border border-green-200 text-green-800 p-4 rounded text-left">
            <p className="font-bold mb-1">Link Sent!</p>
            <p className="text-sm">Check your inbox for <strong>{email}</strong> and click the Magic Link to start the test.</p>
            <button type="button" onClick={() => setIsSent(false)} className="text-blue-600 text-sm mt-4 hover:underline">Try a different email</button>
          </div>
        ) : (
          <form onSubmit={handleSendLink} className="text-left">
            <div className="mb-6">
              <label className="block text-gray-700 text-sm font-bold mb-2">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full p-3 border rounded focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                required
              />
            </div>
            <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded transition-colors shadow-sm">
              Send Magic Link
            </button>
          </form>
        )}

        <div className="mt-6 text-xs text-gray-500 text-left bg-gray-50 p-3 rounded border">
          <p><strong>How it works:</strong> Enter your email to receive a secure sign-in link. Click the link in your inbox to access your assessment dashboard.</p>
        </div>
      </div>
    </div>
  );
}
