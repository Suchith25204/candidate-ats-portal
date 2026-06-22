/* eslint-disable @typescript-eslint/no-explicit-any, react-hooks/set-state-in-effect */
import { useState, useEffect } from 'react';
import { APIService } from '../services/api';

const ALL_STAGES = ['Applied', 'Test Sent', 'Test Completed', 'Interview Scheduled', 'Offer Extended', 'Hired', 'Rejected'];

export default function RecruiterDashboard() {
  const [candidates, setCandidates] = useState<any[]>([]);
  const [selectedCandidate, setSelectedCandidate] = useState<any | null>(null);

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
      await APIService.updateCandidateStatus(candidate.email, 'Test Sent');
      setCandidates(prev => prev.map(c => c.email === candidate.email ? { ...c, stage: 'Test Sent' } : c));
      setSelectedCandidate((prev: any) => prev?.email === candidate.email ? { ...prev, stage: 'Test Sent' } : prev);
      alert('Test enabled! Candidate dashboard unlocked.');
    } catch (err: any) {
      console.error(err);
      alert('Failed to enable test: ' + (err.message || JSON.stringify(err)));
    }
  };

  const handleStageChange = async (candidate: any, newStage: string) => {
    try {
      await APIService.updateCandidateStatus(candidate.email, newStage);
      setCandidates(prev => prev.map(c => c.email === candidate.email ? { ...c, stage: newStage } : c));
      setSelectedCandidate((prev: any) => prev?.email === candidate.email ? { ...prev, stage: newStage } : prev);
    } catch (err: any) {
      console.error(err);
      alert('Failed to update stage: ' + err.message);
    }
  };

  const handleDaysChange = async (candidate: any, days: number) => {
    setCandidates(prev => prev.map(c => c.email === candidate.email ? { ...c, nextRoundDays: days } : c));
    setSelectedCandidate((prev: any) => prev?.email === candidate.email ? { ...prev, nextRoundDays: days } : prev);
    await APIService.updateNextRoundDays(candidate.email, days);
  };

  return (
    <div className="h-full p-8 bg-black">
      <div className="flex h-full gap-0 overflow-hidden border border-neutral-800 rounded-lg shadow-sm">
        {/* LEFT PANEL — Candidates List */}
        <div className="w-[360px] shrink-0 border-r border-neutral-800 flex flex-col overflow-hidden">
          <div className="px-6 py-4 border-b border-neutral-800">
            <h2 className="text-base font-bold text-neutral-400 uppercase tracking-wider">candidates</h2>
          </div>
          <div className="flex-1 overflow-y-auto bg-black">
            {candidates.map((candidate) => (
              <button
                key={candidate.email}
                onClick={() => setSelectedCandidate(candidate)}
                className={`w-full text-left px-6 py-5 border-b border-neutral-800 transition-colors ${selectedCandidate?.email === candidate.email
                  ? 'bg-neutral-900'
                  : 'bg-black hover:bg-neutral-900/50'
                  }`}
              >
                <div className="font-bold text-white text-base">{candidate.name || 'Unnamed'}</div>
                <div className="text-sm text-neutral-500 mt-1">{candidate.role || 'No role'}</div>
                <div className="text-sm text-neutral-600 font-mono mt-1">{candidate.email}</div>
              </button>
            ))}
            {candidates.length === 0 && (
              <div className="px-6 py-10 text-center text-neutral-600 text-base">
                No candidates found.
              </div>
            )}
          </div>
        </div>

        {/* RIGHT PANEL — Candidate Details */}
        <div className="flex-1 flex flex-col overflow-hidden bg-black">
          {selectedCandidate ? (
            <>
              {/* Detail content */}
              <div className="flex-1 overflow-y-auto p-8">
                <div className="space-y-8">
                  {/* Candidate Info */}
                  <div>
                    <h2 className="text-3xl font-bold text-white">{selectedCandidate.name}</h2>
                    <p className="text-neutral-400 text-base mt-2 font-mono">{selectedCandidate.email}</p>
                    <p className="text-neutral-500 text-base mt-2">{selectedCandidate.role || 'No role specified'}</p>
                  </div>

                  <div className="border-t border-neutral-800" />

                  {/* Stage */}
                  <div className="flex items-center gap-6">
                    <span className="text-base text-neutral-400 w-24">Stage</span>
                    <select
                      value={selectedCandidate.stage}
                      onChange={(e) => handleStageChange(selectedCandidate, e.target.value)}
                      className="text-base font-bold rounded px-4 py-3 border border-neutral-700 bg-neutral-900 text-white cursor-pointer outline-none focus:ring-1 focus:ring-white transition-all"
                    >
                      {ALL_STAGES.map(stage => {
                        const isDisabled = selectedCandidate.testCompleted && (stage === 'Applied' || stage === 'Test Sent');
                        return (
                          <option
                            key={stage}
                            value={stage}
                            disabled={isDisabled}
                            className={isDisabled ? 'text-neutral-600' : ''}
                          >
                            {stage} {isDisabled ? '(Locked)' : ''}
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  {/* Score */}
                  <div className="flex items-center gap-6">
                    <span className="text-base text-neutral-400 w-24">Score</span>
                    {selectedCandidate.testCompleted ? (
                      <span className="font-bold text-white text-lg">{selectedCandidate.testScore}%</span>
                    ) : (
                      <span className="text-neutral-600 italic text-base">Pending</span>
                    )}
                  </div>

                  {/* Days */}
                  <div className="flex items-center gap-6">
                    <span className="text-base text-neutral-400 w-24">Days</span>
                    <input
                      type="number"
                      min="0"
                      max="30"
                      value={selectedCandidate.nextRoundDays ?? 0}
                      onChange={(e) => handleDaysChange(selectedCandidate, parseInt(e.target.value) || 0)}
                      className="w-24 p-3 text-base border border-neutral-700 rounded text-center outline-none focus:border-white bg-neutral-900 text-white hover:bg-neutral-800 transition-colors"
                    />
                  </div>

                  {/* About */}
                  {selectedCandidate.aboutYourself && (
                    <div>
                      <span className="text-base text-neutral-400 block mb-3">About</span>
                      <p className="text-base text-neutral-300 leading-relaxed bg-neutral-900 border border-neutral-800 rounded p-5">
                        {selectedCandidate.aboutYourself}
                      </p>
                    </div>
                  )}

                  <div className="border-t border-neutral-800" />

                  {/* Actions */}
                  <div className="flex gap-4">
                    {selectedCandidate.stage === 'Applied' && (
                      <button
                        onClick={() => enableTest(selectedCandidate)}
                        className="text-base px-6 py-3 bg-white hover:bg-neutral-200 text-black rounded font-bold shadow-sm transition-colors"
                      >
                        Enable Test
                      </button>
                    )}
                    {selectedCandidate.stage === 'Test Sent' && !selectedCandidate.testCompleted && (
                      <span className="text-base px-6 py-3 bg-neutral-900 text-neutral-300 border border-neutral-700 rounded font-bold inline-block">
                        Awaiting Test
                      </span>
                    )}
                    {selectedCandidate.testCompleted && (
                      <span className="text-base text-neutral-300 font-bold px-6 py-3">✓ Test Done</span>
                    )}
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <p className="text-neutral-500 text-base">Select a candidate from the list to view details</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
