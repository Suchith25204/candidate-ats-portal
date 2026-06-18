/* eslint-disable @typescript-eslint/no-explicit-any, react-hooks/set-state-in-effect */
import { useState, useEffect } from 'react';
import { APIService } from '../services/api';

const ALL_STAGES = ['Applied', 'Test Sent', 'Test Completed', 'Interview Scheduled', 'Offer Extended', 'Hired', 'Rejected'];

export default function RecruiterDashboard() {
  const [candidates, setCandidates] = useState<any[]>([]);
  const [newRecruiterEmail, setNewRecruiterEmail] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [addMsg, setAddMsg] = useState('');

  const fetchData = async () => {
    const data = await APIService.getAllCandidates();
    setCandidates(data || []);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const enableTest = async (candidate: any) => {
    if (!candidate.email) {
      alert('Candidate does not have an email address configured.');
      return;
    }
    
    try {
      // Update DB status to 'Test Sent' directly without sending Stytch email
      await APIService.updateCandidateStatus(candidate.email, 'Test Sent');
      
      // Update UI locally
      setCandidates(prev => prev.map(c => c.email === candidate.email ? { ...c, stage: 'Test Sent' } : c));
      
      alert('Test enabled successfully! The candidate can now access it from their dashboard.');
    } catch (err: any) {
      console.error(err);
      alert('Failed to enable test: ' + err.message);
    }
  };

  const handleStageChange = async (candidate: any, newStage: string) => {
    try {
      await APIService.updateCandidateStatus(candidate.email, newStage);
      setCandidates(prev => prev.map(c => c.email === candidate.email ? { ...c, stage: newStage } : c));
    } catch (err: any) {
      console.error(err);
      alert('Failed to update stage: ' + err.message);
    }
  };

  const handleAddRecruiter = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddMsg('');
    setIsAdding(true);
    try {
      const requesterEmail = localStorage.getItem('recruiterEmail');
      const res = await fetch('http://localhost:3001/api/recruiters/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: newRecruiterEmail, requesterEmail })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to add recruiter');
      setAddMsg(`Successfully added ${newRecruiterEmail} as a recruiter!`);
      setNewRecruiterEmail('');
    } catch (err: any) {
      setAddMsg(`Error: ${err.message}`);
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <div className="mt-4">
      {/* Add Recruiter Section */}
      <div className="bg-carbon rounded-lg border border-gray-800 shadow-sm p-6 mb-6">
        <h3 className="text-lg font-bold text-gray-100 mb-4">Manage Team</h3>
        <form onSubmit={handleAddRecruiter} className="flex flex-col sm:flex-row gap-4 items-end">
          <div className="flex-1 w-full">
            <label className="block text-gray-400 text-sm font-bold mb-2">Invite New Recruiter</label>
            <input
              type="email"
              required
              value={newRecruiterEmail}
              onChange={(e) => setNewRecruiterEmail(e.target.value)}
              placeholder="colleague@acmehire.com"
              className="w-full p-2.5 bg-obsidian border border-gray-700 text-gray-200 rounded-lg focus:ring-1 focus:ring-teal-500 outline-none transition-all text-sm"
            />
          </div>
          <button 
            type="submit" 
            disabled={isAdding || !newRecruiterEmail}
            className="w-full sm:w-auto bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white px-6 py-2.5 rounded-lg font-medium shadow-sm transition-colors text-sm"
          >
            {isAdding ? 'Adding...' : 'Add Recruiter'}
          </button>
        </form>
        {addMsg && (
          <p className={`mt-3 text-sm font-medium ${addMsg.startsWith('Error') ? 'text-red-400' : 'text-teal-400'}`}>
            {addMsg}
          </p>
        )}
      </div>

      <div className="bg-carbon rounded-lg border border-gray-800 overflow-hidden shadow-sm">
        <table className="min-w-full divide-y divide-gray-800 text-left">
          <thead className="bg-gray-900">
            <tr>
              <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Candidate Info</th>
              <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Email</th>
              <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Current Stage</th>
              <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Score</th>
              <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Days Pending</th>
              <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-carbon divide-y divide-gray-800">
            {candidates.map((candidate) => (
              <tr key={candidate.email} className="hover:bg-gray-800/50 transition-colors">
                <td className="px-6 py-4">
                  <div className="font-bold text-gray-200">{candidate.name}</div>
                  <div className="text-sm text-gray-400">{candidate.role}</div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-400 font-mono">
                  {candidate.email || 'N/A'}
                </td>
                <td className="px-6 py-4">
                  <select
                    value={candidate.stage}
                    onChange={(e) => handleStageChange(candidate, e.target.value)}
                    className="text-sm font-semibold rounded-lg px-3 py-1.5 border border-gray-700 bg-obsidian text-gray-200 cursor-pointer outline-none focus:ring-1 focus:ring-teal-500 transition-all"
                  >
                    {ALL_STAGES.map(stage => (
                      <option key={stage} value={stage}>{stage}</option>
                    ))}
                  </select>
                </td>
                <td className="px-6 py-4 text-sm">
                  {candidate.testCompleted ? (
                    <span className="font-bold text-teal-400">{candidate.testScore}%</span>
                  ) : (
                    <span className="text-gray-500 italic">Pending</span>
                  )}
                </td>
                <td className="px-6 py-4 text-sm">
                  <input 
                    type="number" 
                    min="0"
                    max="30"
                    value={candidate.nextRoundDays ?? 0} 
                    onChange={async (e) => {
                      const days = parseInt(e.target.value) || 0;
                      setCandidates(prev => prev.map(c => c.email === candidate.email ? {...c, nextRoundDays: days} : c));
                      await APIService.updateNextRoundDays(candidate.email, days);
                    }}
                    className="w-16 p-1 text-sm border border-gray-700 rounded text-center outline-none focus:border-teal-500 bg-obsidian text-gray-200 hover:bg-gray-800 transition-colors"
                  />
                </td>
                <td className="px-6 py-4 text-right">
                  {candidate.stage === 'Applied' ? (
                    <button 
                      onClick={() => enableTest(candidate)}
                      className="text-sm px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded font-medium shadow-sm transition-colors"
                    >
                      Enable Test
                    </button>
                  ) : candidate.stage === 'Test Sent' && !candidate.testCompleted ? (
                    <span className="text-sm px-4 py-2 bg-teal-900/20 text-teal-400 border border-teal-500/30 rounded font-medium inline-block">
                      Awaiting Test
                    </span>
                  ) : candidate.testCompleted ? (
                    <span className="text-sm text-green-400 font-medium px-4 py-2">✓ Test Done</span>
                  ) : (
                    <span className="text-sm text-gray-400 px-4 py-2">—</span>
                  )}
                </td>
              </tr>
            ))}
            {candidates.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
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
