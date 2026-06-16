/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from 'react';
import { APIService } from '../services/api';

export default function RolePulse({ candidateId }: { candidateId?: string }) {
  const [candidate, setCandidate] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!candidateId) return;
      const candidates = await APIService.getAllCandidates();
      const found = candidates.find((c: any) => c.id === candidateId);
      setCandidate(found);
    };
    fetchData();
  }, [candidateId]);

  if (!candidate) return null;

  const pulseSummary = "The team was impressed with your systems architecture knowledge. We are currently finalizing internal capacity and will reach out shortly with next steps.";

  return (
    <div className="p-6 bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
      <h3 className="text-lg font-bold text-gray-800 border-b pb-2 mb-3">AI Role Pulse for {candidate.name}</h3>
      <p className="text-gray-700 italic">"{pulseSummary}"</p>
      <p className="text-xs text-gray-400 mt-4 text-right">Updated: {new Date().toLocaleDateString()}</p>
    </div>
  );
}

