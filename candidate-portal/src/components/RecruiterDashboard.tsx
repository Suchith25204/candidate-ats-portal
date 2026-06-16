/* eslint-disable @typescript-eslint/no-explicit-any, react-hooks/set-state-in-effect */
import { useState, useEffect } from 'react';
import { APIService } from '../services/api';
import { useStytch } from '@stytch/react';

export default function RecruiterDashboard() {
  const [candidates, setCandidates] = useState<any[]>([]);
  const stytch = useStytch();

  const fetchData = async () => {
    const data = await APIService.getAllCandidates();
    setCandidates(data || []);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const sendInvite = async (candidate: any) => {
    if (!candidate.email) {
      alert('Candidate does not have an email address configured.');
      return;
    }
    
    try {
      // 1. Send the email invite via Stytch Magic Links
      await stytch.magicLinks.email.loginOrCreate(candidate.email);
      
      // 2. Update DB status
      await APIService.updateCandidateStatus(candidate.id, 'Test Sent');
      
      // 3. Update UI locally
      setCandidates(prev => prev.map(c => c.id === candidate.id ? { ...c, stage: 'Test Sent' } : c));
      
    } catch (err: any) {
      console.error(err);
      alert('Failed to send invite: ' + err.message);
    }
  };

  return (
    <div className="mt-4">
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
        <table className="min-w-full divide-y divide-gray-200 text-left">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Candidate Info</th>
              <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Email</th>
              <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Current Stage</th>
              <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Score</th>
              <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Days Pending</th>
              <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {candidates.map((candidate) => (
              <tr key={candidate.id} className="hover:bg-blue-50/50 transition-colors">
                <td className="px-6 py-4">
                  <div className="font-bold text-gray-900">{candidate.name}</div>
                  <div className="text-sm text-gray-500">{candidate.role}</div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600 font-mono">
                  {candidate.email || 'N/A'}
                </td>
                <td className="px-6 py-4">
                  <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full 
                    ${candidate.stage === 'Test Sent' ? 'bg-blue-100 text-blue-800 border border-blue-200' : 
                      candidate.stage === 'Applied' ? 'bg-gray-100 text-gray-800' : 
                      'bg-green-100 text-green-800 border border-green-200'}`}>
                    {candidate.stage}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm">
                  {candidate.testCompleted ? (
                    <span className="font-bold text-green-600">{candidate.testScore}%</span>
                  ) : (
                    <span className="text-gray-400 italic">Pending</span>
                  )}
                </td>
                <td className="px-6 py-4 text-sm">
                  <input 
                    type="number" 
                    min="1"
                    max="30"
                    value={candidate.nextRoundDays || 4} 
                    onChange={async (e) => {
                      const days = parseInt(e.target.value) || 4;
                      setCandidates(prev => prev.map(c => c.id === candidate.id ? {...c, nextRoundDays: days} : c));
                      await APIService.updateNextRoundDays(candidate.id, days);
                    }}
                    className="w-16 p-1 text-sm border rounded text-center outline-none focus:border-blue-400 bg-gray-50 hover:bg-white transition-colors"
                  />
                </td>
                <td className="px-6 py-4 text-right">
                  {candidate.testCompleted ? (
                    <span className="text-sm text-gray-500 font-medium px-4 py-2">Test Completed</span>
                  ) : candidate.stage === 'Test Sent' ? (
                    <button disabled className="text-sm px-4 py-2 bg-blue-50 text-blue-400 border border-blue-100 rounded cursor-not-allowed font-medium">
                      Invite Sent
                    </button>
                  ) : (
                    <button 
                      onClick={() => sendInvite(candidate)}
                      className="text-sm px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium shadow-sm transition-colors"
                    >
                      Send Invite
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {candidates.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                  No candidates found in the database.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
