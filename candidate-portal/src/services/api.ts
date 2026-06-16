/* eslint-disable @typescript-eslint/no-explicit-any */
import * as mockDb from '../utils/mockDb';

// This switch is controlled by the .env file (VITE_USE_MOCK_BACKEND=true/false)
const USE_MOCK = import.meta.env.VITE_USE_MOCK_BACKEND === 'true';

export const APIService = {

  // 1. Fetch all candidates
  getAllCandidates: async () => {
    if (USE_MOCK) {
      console.log("📡 [MOCK] Fetching candidates from localStorage");
      return mockDb.getCandidates();
    } else {
      console.log("☁️ [AWS] Fetching candidates from AppSync/DynamoDB");
      // FUTURE AWS CODE:
      // const client = generateClient();
      // const res = await client.graphql({ query: listCandidatesQuery });
      // return res.data.listCandidates.items;
      return [];
    }
  },

  getCandidateByEmail: async (email: string) => {
    if (USE_MOCK) {
      console.log(`📡 [MOCK] Fetching candidate by email: ${email}`);
      return mockDb.getCandidateByEmail(email);
    } else {
      console.log(`☁️ [AWS] Fetching candidate by email from DynamoDB`);
      // FUTURE AWS CODE
    }
  },

  // 1b. Add a new candidate from the self-serve application form
  addCandidateFromApplication: async (candidate: { name: string; email: string; role: string; aboutYourself?: string }) => {
    if (USE_MOCK) {
      console.log(`📡 [MOCK] Adding candidate from application: ${candidate.email}`);
      return mockDb.addCandidateFromApplication(candidate);
    } else {
      console.log(`☁️ [AWS] Creating candidate in DynamoDB`);
      // FUTURE AWS CODE
    }
  },

  // 2. Update a candidate's stage (Kanban Drag & Drop)
  updateCandidateStage: async (id: string, newStage: string) => {
    if (USE_MOCK) {
      console.log(`📡 [MOCK] Updating candidate ${id} to ${newStage}`);
      return mockDb.updateCandidate(id, { stage: newStage });
    } else {
      console.log(`☁️ [AWS] Mutating candidate ${id} in DynamoDB`);
      // FUTURE AWS CODE
    }
  },

  // 2b. Update candidate status (Alias for invite workflow)
  updateCandidateStatus: async (id: string, stage: string) => {
    return APIService.updateCandidateStage(id, stage);
  },

  // 3. Toggle the MCQ test status for a candidate
  updateCandidateTestStatus: async (id: string, testEnabled: boolean) => {
    if (USE_MOCK) {
      console.log(`📡 [MOCK] Updating candidate ${id} test status: ${testEnabled}`);
      return mockDb.updateCandidate(id, { testEnabled });
    } else {
      console.log(`☁️ [AWS] Mutating candidate ${id} test status in DynamoDB`);
      // FUTURE AWS CODE
    }
  },

  // 4. Save unique AI-generated questions to the candidate's profile
  saveAIQuestions: async (id: string, questions: any[]) => {
    if (USE_MOCK) {
      console.log(`📡 [MOCK] Saving AI questions for candidate ${id}`);
      return mockDb.updateCandidate(id, { uniqueQuestions: questions, hasPendingTest: true });
    } else {
      console.log(`☁️ [AWS] Saving AI questions to DynamoDB`);
      // FUTURE AWS CODE
    }
  },

  // 5. Mark a candidate's test as completed with score
  completeTest: async (id: string, answers: Record<number, string>, score: number) => {
    if (USE_MOCK) {
      console.log(`📡 [MOCK] Marking test completed for candidate ${id} — score: ${score}`);
      return mockDb.updateCandidate(id, {
        testCompleted: true,
        testEnabled: false,
        hasPendingTest: false,
        testAnswers: answers,
        testScore: score
      });
    } else {
      console.log(`☁️ [AWS] Marking test completed in DynamoDB`);
      // FUTURE AWS CODE
    }
  },

  // 6. Save candidate profile (specialization, stream, interests)
  saveProfile: async (id: string, profile: { specialization: string; stream: string; interests: string[] }) => {
    if (USE_MOCK) {
      console.log(`📡 [MOCK] Saving profile for candidate ${id}`);
      return mockDb.updateCandidate(id, {
        specialization: profile.specialization,
        stream: profile.stream,
        interests: profile.interests,
        profileCompleted: true
      });
    } else {
      console.log(`☁️ [AWS] Saving profile to DynamoDB`);
      // FUTURE AWS CODE
    }
  },

  // 7. Update number of days expected for next round
  updateNextRoundDays: async (id: string, days: number) => {
    if (USE_MOCK) {
      console.log(`📡 [MOCK] Updating next round days for candidate ${id} to ${days}`);
      return mockDb.updateCandidate(id, { nextRoundDays: days });
    } else {
      console.log(`☁️ [AWS] Mutating candidate ${id} next round days in DynamoDB`);
      // FUTURE AWS CODE
    }
  },

  // 8. Abstracted AI Generation call (routes to proxy instead of Groq directly)
  generateQuestions: async (candidate: any) => {
    if (USE_MOCK) {
      console.log(`📡 [MOCK] Generating questions via local proxy server`);
      // Calling our local express server running on port 3001
      const res = await fetch('http://localhost:3001/api/generate-questions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(candidate)
      });
      
      if (!res.ok) {
        throw new Error('Failed to generate questions via proxy');
      }
      
      return await res.json();
    } else {
      console.log(`☁️ [AWS] Generating questions via AppSync/Lambda`);
      // FUTURE AWS CODE: Call AppSync/API Gateway
      return [];
    }
  }
};
