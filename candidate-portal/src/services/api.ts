/* eslint-disable @typescript-eslint/no-explicit-any */

const API_BASE_URL = 'http://localhost:3001/api';

export const APIService = {

  // 1. Fetch all candidates
  getAllCandidates: async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/candidates`);
      if (!res.ok) throw new Error('Failed to fetch candidates');
      return await res.json();
    } catch (err) {
      console.error(err);
      return [];
    }
  },

  getCandidateByEmail: async (email: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/candidates/${encodeURIComponent(email)}`);
      if (!res.ok) return null;
      return await res.json();
    } catch (err) {
      console.error(err);
      return null;
    }
  },

  // 1b. Add a new candidate from the self-serve application form
  addCandidateFromApplication: async (candidate: { name: string; email: string; role: string; aboutYourself?: string }) => {
    try {
      const res = await fetch(`${API_BASE_URL}/candidates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...candidate,
          stage: 'Applied',
          testCompleted: false,
          testEnabled: false
        })
      });
      if (!res.ok) throw new Error('Failed to create candidate');
      return await res.json();
    } catch (err) {
      console.error(err);
      throw err;
    }
  },

  // 2. Update a candidate's stage (Kanban Drag & Drop)
  updateCandidateStage: async (email: string, newStage: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/candidates/${encodeURIComponent(email)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stage: newStage })
      });
      return await res.json();
    } catch (err) {
      console.error(err);
    }
  },

  // 2b. Update candidate status (Alias for invite workflow)
  updateCandidateStatus: async (email: string, stage: string) => {
    return APIService.updateCandidateStage(email, stage);
  },

  // 3. Toggle the MCQ test status for a candidate
  updateCandidateTestStatus: async (email: string, testEnabled: boolean) => {
    try {
      const res = await fetch(`${API_BASE_URL}/candidates/${encodeURIComponent(email)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ testEnabled })
      });
      return await res.json();
    } catch (err) {
      console.error(err);
    }
  },

  // 4. Save unique AI-generated questions to the candidate's profile
  saveAIQuestions: async (email: string, questions: any[]) => {
    try {
      const res = await fetch(`${API_BASE_URL}/candidates/${encodeURIComponent(email)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uniqueQuestions: questions, hasPendingTest: true })
      });
      return await res.json();
    } catch (err) {
      console.error(err);
    }
  },

  // 5. Mark a candidate's test as completed with score
  completeTest: async (email: string, answers: Record<number, string>, score: number) => {
    try {
      const res = await fetch(`${API_BASE_URL}/candidates/${encodeURIComponent(email)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stage: 'Test Completed',
          testCompleted: true,
          testEnabled: false,
          hasPendingTest: false,
          testAnswers: answers,
          testScore: score
        })
      });
      return await res.json();
    } catch (err) {
      console.error(err);
    }
  },

  // 6. Save candidate profile (specialization, stream, interests)
  saveProfile: async (email: string, profile: { specialization: string; stream: string; interests: string[] }) => {
    try {
      const res = await fetch(`${API_BASE_URL}/candidates/${encodeURIComponent(email)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          specialization: profile.specialization,
          stream: profile.stream,
          interests: profile.interests,
          profileCompleted: true
        })
      });
      return await res.json();
    } catch (err) {
      console.error(err);
    }
  },

  // 7. Update number of days expected for next round
  updateNextRoundDays: async (email: string, days: number) => {
    try {
      const res = await fetch(`${API_BASE_URL}/candidates/${encodeURIComponent(email)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nextRoundDays: days })
      });
      return await res.json();
    } catch (err) {
      console.error(err);
    }
  },

  // 8. Abstracted AI Generation call
  generateQuestions: async (candidate: any) => {
    try {
      const res = await fetch(`${API_BASE_URL}/generate-questions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(candidate)
      });
      
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to generate questions via proxy');
      }
      
      return await res.json();
    } catch (err: any) {
      console.error(err);
      throw err; // Throw instead of silently returning []
    }
  }
};
