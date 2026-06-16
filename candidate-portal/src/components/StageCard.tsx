/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from 'react';
import { APIService } from '../services/api';

export default function StageCard({ candidateId }: { candidateId?: string }) {
  const [candidate, setCandidate] = useState<any>(null);

  useEffect(() => {
    if (!candidateId) return;
    
    const fetchData = async () => {
      const candidates = await APIService.getAllCandidates();
      const found = candidates.find((c: any) => c.id === candidateId);
      setCandidate(found);
    };
    
    // Fetch immediately
    fetchData();
    
    // Poll every 2 seconds to simulate real-time updates (like WebSockets/AppSync)
    const intervalId = setInterval(fetchData, 2000);
    
    return () => clearInterval(intervalId);
  }, [candidateId]);

  if (!candidate) {
    return <div className="p-6 bg-white rounded-lg shadow-sm border border-gray-200 mb-6 animate-pulse bg-gray-100 h-32"></div>;
  }

  return (
    <div className="p-6 bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
      <h2 className="text-2xl font-bold text-gray-800">{candidate.role}</h2>
      <p className="text-gray-600 mt-1">Current Stage: <span className="font-semibold">{candidate.stage}</span></p>
      <div className="mt-4 p-4 bg-blue-50 rounded border border-blue-100">
        <p className="text-blue-800 text-sm font-medium">
          Based on historical data, expect an update within <span className="text-lg font-bold">{candidate.nextRoundDays || 4} days</span>.
        </p>
      </div>
    </div>
  );
}

