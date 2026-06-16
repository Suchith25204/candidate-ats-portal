/* eslint-disable @typescript-eslint/no-explicit-any */
// Define our database schema
export type CandidateUser = {
  id: string;
  username: string;
  email: string;
  password: string;
  name: string;
  role: string;
  stage: string;
  hasPendingTest: boolean;
  uniqueQuestions: any[] | null;
  testEnabled: boolean;
  testCompleted: boolean;
  specialization: string | null;
  stream: string | null;
  interests: string[];
  profileCompleted: boolean;
  testAnswers: Record<string, string> | null;
  testScore: number | null;
  nextRoundDays: number | null;
};

export type RecruiterUser = {
  id: string;
  username: string;
  password: string;
  name: string;
  department: string;
};

const DB_VERSION = '5';

// Initialize the database if it's empty or outdated
export const initDB = () => {
  const version = localStorage.getItem('hiring_platform_version');

  // Reset if schema version changed
  if (version !== DB_VERSION) {
    localStorage.removeItem('hiring_platform_db');
    localStorage.removeItem('hiring_platform_recruiters');
  }

  const existing = localStorage.getItem('hiring_platform_db');
  if (!existing) {
    const initialData: CandidateUser[] = [
      { id: 'c-1', username: 'Suchith', email: 'suchith25204@gmail.com', password: 'pass_suchi', name: 'Suchith', role: 'Senior React Dev', stage: 'Applied', hasPendingTest: false, uniqueQuestions: null, testEnabled: false, testCompleted: false, specialization: null, stream: null, interests: [], profileCompleted: false, testAnswers: null, testScore: null, nextRoundDays: 4 },
      { id: 'c-2', username: 'Red', email: 'redtransform6@gmail.com', password: 'pass_red', name: 'Red', role: 'Django dev', stage: 'Applied', hasPendingTest: false, uniqueQuestions: null, testEnabled: true, testCompleted: false, specialization: null, stream: null, interests: [], profileCompleted: false, testAnswers: null, testScore: null, nextRoundDays: 4 }
    ];
    localStorage.setItem('hiring_platform_db', JSON.stringify(initialData));
  }

  const existingRecruiters = localStorage.getItem('hiring_platform_recruiters');
  if (!existingRecruiters) {
    const recruiterData: RecruiterUser[] = [
      { id: 'r-1', username: 'admin', password: 'admin123', name: 'Sarah Mitchell', department: 'Engineering' },
      { id: 'r-2', username: 'hr_lead', password: 'hr_pass', name: 'James Wilson', department: 'HR Operations' }
    ];
    localStorage.setItem('hiring_platform_recruiters', JSON.stringify(recruiterData));
  }

  localStorage.setItem('hiring_platform_version', DB_VERSION);
};

// Fetch all candidates
export const getCandidates = (): CandidateUser[] => {
  const data = localStorage.getItem('hiring_platform_db');
  return data ? JSON.parse(data) : [];
};

export const getCandidateByEmail = (email: string): CandidateUser | undefined => {
  return getCandidates().find(c => c.email === email);
};

// Fetch all recruiters
export const getRecruiters = (): RecruiterUser[] => {
  const data = localStorage.getItem('hiring_platform_recruiters');
  return data ? JSON.parse(data) : [];
};

// Save a new candidate from the self-serve application form
export const addCandidateFromApplication = (candidate: { name: string; email: string; role: string; aboutYourself?: string }) => {
  const db = getCandidates();

  // Don't add duplicates
  const existing = db.find(c => c.email === candidate.email);
  if (existing) return existing;

  const newId = `c-${Date.now()}`;
  const username = candidate.name.toLowerCase().replace(/\s+/g, '_');

  const newCandidate: CandidateUser = {
    id: newId,
    username,
    email: candidate.email,
    password: 'stytch_managed',
    name: candidate.name,
    role: candidate.role,
    stage: 'Applied',
    hasPendingTest: false,
    uniqueQuestions: null,
    testEnabled: false,
    testCompleted: false,
    specialization: null,
    stream: null,
    interests: [],
    profileCompleted: false,
    testAnswers: null,
    testScore: null,
    nextRoundDays: 0
  };

  db.push(newCandidate);
  localStorage.setItem('hiring_platform_db', JSON.stringify(db));

  return newCandidate;
};

// Update candidate data
export const updateCandidate = (id: string, updates: Partial<CandidateUser>) => {
  const db = getCandidates();
  const updatedDb = db.map(c => c.id === id ? { ...c, ...updates } : c);
  localStorage.setItem('hiring_platform_db', JSON.stringify(updatedDb));
};
