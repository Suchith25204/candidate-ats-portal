import * as mockDb from '../utils/mockDb';

export const AuthService = {
  // With Stytch, the actual login happens via Magic Link. 
  // Once Stytch authenticates the token, we use this method to get or create their profile in our DB.
  getOrCreateUserByEmail: async (email: string) => {
    const isMock = import.meta.env.VITE_USE_MOCK_BACKEND === 'true';

    if (isMock) {
      const db = mockDb.getCandidates();
      let user = db.find(c => c.email === email || c.username === email);

      if (!user) {
        // Auto-create a candidate record if it's their first time logging in via Stytch
        const newUser = {
          id: `cand_${Date.now()}`,
          username: email,
          email: email,
          password: 'stytch_managed',
          name: email.split('@')[0],
          role: 'Candidate',
          stage: 'Pending Assessment',
          testEnabled: true,
          testCompleted: false,
          profileCompleted: false,
          hasPendingTest: false,
          uniqueQuestions: null,
          specialization: null,
          stream: null,
          interests: [],
          testAnswers: null,
          testScore: null,
          nextRoundDays: 4
        };
        db.push(newUser);
        // Force save to local storage (mock DB atomic update)
        localStorage.setItem('hiring_platform_db', JSON.stringify(db));
        user = newUser;
      }

      return user;
    } else {
      // FUTURE AWS CODE:
      // return await fetchUserFromDynamo(email);
    }
  },

  // Simulates logging in a recruiter
  recruiterLogin: async (username: string, password: string) => {
    const isMock = import.meta.env.VITE_USE_MOCK_BACKEND === 'true';

    if (isMock) {
      const recruiters = mockDb.getRecruiters();
      const user = recruiters.find(r => r.username === username && r.password === password);

      if (!user) throw new Error("Invalid recruiter credentials");

      return user;
    } else {
      // FUTURE AWS COGNITO CODE:
      // const user = await signIn({ username, password });
      // return user;
    }
  }
};