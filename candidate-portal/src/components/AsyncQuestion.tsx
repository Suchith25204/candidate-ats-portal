/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from 'react';
import { APIService } from '../services/api';

export default function AsyncQuestion({ candidateId }: { candidateId?: string }) {
  const [answer, setAnswer] = useState('');
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

  const mockQuestionText = "Could you briefly describe a time you had to optimize a slow database query?";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert(`Answer saved for ${candidate.name}: ${answer}`);
    setAnswer('');
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-sm border border-orange-200 bg-orange-50/30">
      <div className="flex items-center gap-2 mb-3">
        <span className="bg-orange-100 text-orange-800 text-xs font-bold px-2 py-1 rounded">ACTION REQUIRED</span>
        <h3 className="text-lg font-bold text-gray-800">Pending Question</h3>
      </div>
      <p className="text-gray-800 font-medium mb-4">{mockQuestionText}</p>
      <form onSubmit={handleSubmit}>
        <textarea
          className="w-full p-3 border border-gray-300 rounded outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          rows={3}
          placeholder="Type your answer here..."
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
        />
        <button type="submit" className="mt-3 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded transition-colors">
          Submit Answer
        </button>
      </form>
    </div>
  );
}

