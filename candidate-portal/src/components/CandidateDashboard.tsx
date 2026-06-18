import React, { useState, useEffect } from 'react';
import { useStytchB2BClient, useStytchMember } from '@stytch/react/b2b';
import { useNavigate } from 'react-router-dom';
import { APIService } from '../services/api';

// ---------------------------------------------------------
// COMPONENT: Profile Collection
// ---------------------------------------------------------
function CandidateProfileForm({ onComplete }: { onComplete: (profile: any) => void }) {
  const [specialization, setSpecialization] = useState('');
  const [stream, setStream] = useState('');
  const [interests, setInterests] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onComplete({
      specialization,
      stream,
      interests: interests.split(',').map(i => i.trim()).filter(i => i)
    });
  };

  return (
    <div className="bg-white p-8 rounded-lg shadow-md border border-gray-200 max-w-lg mx-auto">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">Tell us about yourself</h2>
      <p className="text-gray-600 mb-6">We'll use this to personalize your assessment.</p>

      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-sm font-bold text-gray-700 mb-2">Area of Study / Stream</label>
          <input
            type="text"
            value={stream}
            onChange={(e) => setStream(e.target.value)}
            placeholder="e.g. Computer Science"
            className="w-full p-3 border rounded focus:ring-2 focus:ring-blue-500 outline-none text-gray-900"
            required
          />
        </div>
        <div className="mb-4">
          <label className="block text-sm font-bold text-gray-700 mb-2">Specialization</label>
          <input
            type="text"
            value={specialization}
            onChange={(e) => setSpecialization(e.target.value)}
            placeholder="e.g. Artificial Intelligence, Web Development"
            className="w-full p-3 border rounded focus:ring-2 focus:ring-blue-500 outline-none text-gray-900"
            required
          />
        </div>
        <div className="mb-6">
          <label className="block text-sm font-bold text-gray-700 mb-2">Interests (Comma separated)</label>
          <input
            type="text"
            value={interests}
            onChange={(e) => setInterests(e.target.value)}
            placeholder="e.g. React, Node.js, Machine Learning"
            className="w-full p-3 border rounded focus:ring-2 focus:ring-blue-500 outline-none text-gray-900"
            required
          />
        </div>
        <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded transition-colors">
          Continue to Assessment
        </button>
      </form>
    </div>
  );
}

// ---------------------------------------------------------
// COMPONENT: The MCQ Test Interceptor (AcmeHire UI)
// ---------------------------------------------------------
function CandidateTestView({ onComplete, candidate }: { onComplete: () => void, candidate: any }) {
  const [profileCompleted, setProfileCompleted] = useState(candidate?.profileCompleted || false);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({});
  const [flaggedQuestions, setFlaggedQuestions] = useState<Set<number>>(new Set());
  const [questions, setQuestions] = useState<any[]>(candidate?.uniqueQuestions || []);
  const [isLoading, setIsLoading] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  const [timeLeft, setTimeLeft] = useState(1800); // 30 minutes
  const [testStarted, setTestStarted] = useState(false);
  const [isReadyToStart, setIsReadyToStart] = useState(!!(candidate?.uniqueQuestions && candidate.uniqueQuestions.length > 0));
  const [testFinished, setTestFinished] = useState(false);

  // Resume test generation if profile is complete but questions are missing (e.g., after a refresh)
  useEffect(() => {
    if (profileCompleted && questions.length === 0 && !isLoading && !isReadyToStart) {
      setIsLoading(true);
      fetchAIAssessment(candidate);
    }
  }, [profileCompleted]);

  // Anti-Cheat (Fullscreen)
  useEffect(() => {
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement && testStarted && !testFinished) {
        alert("WARNING: You exited fullscreen mode. Your test has been automatically submitted as an anti-cheat measure.");
        submitTest();
      }
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, [testStarted, testFinished, questions, selectedAnswers]);

  const submitTest = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    let score = 0;
    questions.forEach(q => {
      if (selectedAnswers[q.id] === q.correctAnswer) score++;
    });

    const finalScore = questions.length > 0 ? Math.round((score / questions.length) * 100) : 0;

    if (candidate?.email) {
      await APIService.completeTest(candidate.email, selectedAnswers, finalScore);
    }

    setTestFinished(true);
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(err => console.error(err));
    }
    alert('Test submitted successfully! You will be redirected.');
    onComplete();
  };

  // Timer logic
  useEffect(() => {
    let timer: any;
    if (testStarted && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && testStarted) {
      submitTest();
    }
    return () => clearInterval(timer);
  }, [testStarted, timeLeft]); 

  const handleProfileSubmit = async (profileData: any) => {
    setIsLoading(true);
    setProfileCompleted(true);
    if (candidate?.email) {
      await APIService.saveProfile(candidate.email, profileData);
    }
    const mergedCandidate = { ...candidate, ...profileData };
    await fetchAIAssessment(mergedCandidate);
  };

  const fetchAIAssessment = async (cand: any = candidate) => {
    try {
      const parsed = await APIService.generateQuestions(cand);
      setQuestions(parsed);
      if (cand?.email) {
        await APIService.saveAIQuestions(cand.email, parsed);
      }
      setIsReadyToStart(true);
    } catch (err) {
      console.error("AI Generation Error:", err);
      setQuestions([{ id: 1, text: "Error connecting to AI service. Please contact support.", options: ["OK", "Retry"], correctAnswer: "OK" }]);
      setIsReadyToStart(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelect = (qId: number, answer: string) => {
    setSelectedAnswers(prev => ({ ...prev, [qId]: answer }));
  };

  const toggleFlag = (qId: number) => {
    setFlaggedQuestions(prev => {
      const next = new Set(prev);
      if (next.has(qId)) next.delete(qId);
      else next.add(qId);
      return next;
    });
  };

  if (!profileCompleted) {
    return <CandidateProfileForm onComplete={handleProfileSubmit} />;
  }

  if (isLoading) {
    return (
      <div className="bg-carbon p-8 rounded-xl shadow-2xl border border-gray-800 text-center animate-pulse">
        <h2 className="text-xl font-bold text-gray-200 mb-4">Generating AcmeHire Assessment...</h2>
        <div className="w-12 h-12 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
      </div>
    );
  }

  const startFullscreenTest = async () => {
    try {
      await document.documentElement.requestFullscreen();
      setTestStarted(true);
    } catch (err) {
      alert("Failed to enter fullscreen mode. Please ensure your browser allows fullscreen.");
    }
  };

  if (isReadyToStart && !testStarted) {
    return (
      <div className="bg-carbon p-10 rounded-xl shadow-2xl border border-gray-800 text-center max-w-2xl mx-auto">
        <h2 className="text-3xl font-extrabold text-white mb-4">Assessment Ready</h2>
        <p className="text-gray-400 mb-8 leading-relaxed">
          Your secure test has been generated. This assessment utilizes anti-cheat protocols. 
          You must remain in fullscreen mode for the duration.
        </p>
        <button 
          onClick={startFullscreenTest}
          className="bg-gradient-to-r from-teal-500 to-blue-600 hover:from-teal-400 hover:to-blue-500 text-white font-bold py-4 px-10 rounded-lg transition-all transform hover:scale-105"
        >
          Begin Test
        </button>
      </div>
    );
  }

  if (!testStarted || questions.length === 0) return null;

  const currentQ = questions[currentQuestionIndex];
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const attemptedCount = Object.keys(selectedAnswers).length;

  return (
    <div className="bg-carbon min-h-[85vh] flex flex-col rounded-xl shadow-2xl border border-gray-800 overflow-hidden font-sans">
      {/* Top Header Bar */}
      <div className="bg-obsidian border-b border-gray-800 px-6 py-4 flex flex-col md:flex-row justify-between items-center gap-4">
        {/* Left: Section Dropdown */}
        <div className="w-full md:w-1/4">
          <select className="bg-carbon text-gray-200 border border-gray-700 rounded-md px-3 py-1.5 text-sm outline-none focus:ring-1 focus:ring-teal-500">
            <option>Section 1: General Tech</option>
          </select>
        </div>

        {/* Middle: Pagination Navigation */}
        <div className="flex-1 flex flex-col items-center">
          <div className="flex gap-1 overflow-x-auto max-w-full pb-2 scrollbar-hide">
            {questions.map((q, idx) => {
              const isAttempted = selectedAnswers[q.id] !== undefined;
              const isFlagged = flaggedQuestions.has(q.id);
              const isActive = idx === currentQuestionIndex;
              return (
                <button
                  key={q.id}
                  onClick={() => setCurrentQuestionIndex(idx)}
                  className={`w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-md font-semibold text-sm transition-all ${
                    isActive ? 'border-2 border-teal-500 bg-teal-500/10 text-teal-400' :
                    isAttempted ? 'bg-blue-600 text-white' :
                    isFlagged ? 'bg-purple-600/20 border border-purple-500 text-purple-400' :
                    'bg-gray-800 text-gray-400 hover:bg-gray-700'
                  }`}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>
          <div className="text-xs text-gray-500 mt-1 uppercase tracking-wider font-semibold">
            Attempted: <span className="text-teal-400">{attemptedCount}</span> / {questions.length}
          </div>
        </div>

        {/* Right: Timer & Finish */}
        <div className="w-full md:w-1/4 flex justify-end items-center gap-4">
          <div className="text-right">
            <div className="text-xs text-gray-500 uppercase font-bold tracking-wider">Section Time</div>
            <div className={`font-mono text-xl font-bold ${timeLeft < 300 ? 'text-red-400 animate-pulse' : 'text-gray-100'}`}>
              {formatTime(timeLeft)}
            </div>
          </div>
          <button
            onClick={() => { if(window.confirm('Are you sure you want to finish the test?')) submitTest(); }}
            className="bg-gray-800 hover:bg-red-600/80 hover:text-white text-gray-300 px-4 py-2 rounded-md font-semibold text-sm transition-colors border border-gray-700"
          >
            Finish Test
          </button>
        </div>
      </div>

      {/* Two-Column Body Grid */}
      <div className="flex-1 flex flex-col lg:flex-row">
        {/* Left Panel: Content */}
        <div className="lg:w-1/2 p-8 border-b lg:border-b-0 lg:border-r border-gray-800 relative">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-teal-400 font-bold uppercase tracking-wider text-sm">Question {currentQuestionIndex + 1}</h3>
            <label className="flex items-center gap-2 cursor-pointer group">
              <input 
                type="checkbox" 
                checked={flaggedQuestions.has(currentQ.id)}
                onChange={() => toggleFlag(currentQ.id)}
                className="w-4 h-4 rounded bg-carbon border-gray-600 text-purple-500 focus:ring-purple-500/50"
              />
              <span className="text-gray-400 text-sm font-medium group-hover:text-purple-400 transition-colors">Revisit Later</span>
            </label>
          </div>
          <div className="prose prose-invert max-w-none">
            <p className="text-xl text-gray-100 leading-relaxed font-medium">
              {currentQ.text}
            </p>
          </div>
        </div>

        {/* Right Panel: Answering Area */}
        <div className="lg:w-1/2 p-8 bg-obsidian">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-gray-400 font-semibold uppercase tracking-wider text-sm">Select an option</h3>
            <button 
              onClick={() => {
                const newAnswers = { ...selectedAnswers };
                delete newAnswers[currentQ.id];
                setSelectedAnswers(newAnswers);
              }}
              className="text-xs text-blue-400 hover:text-blue-300 hover:underline font-medium"
            >
              Clear Response
            </button>
          </div>

          <div className="space-y-4">
            {currentQ.options.map((opt: string) => {
              const isSelected = selectedAnswers[currentQ.id] === opt;
              return (
                <label
                  key={opt}
                  className={`flex items-start gap-4 p-5 rounded-xl cursor-pointer border transition-all ${
                    isSelected 
                      ? 'bg-blue-900/20 border-blue-500 ring-1 ring-blue-500' 
                      : 'bg-carbon border-gray-800 hover:border-gray-600'
                  }`}
                >
                  <div className={`mt-1 w-5 h-5 flex-shrink-0 rounded-full border-2 flex items-center justify-center transition-colors ${
                    isSelected ? 'border-blue-400 bg-blue-400/20' : 'border-gray-500 bg-transparent'
                  }`}>
                    {isSelected && <div className="w-2.5 h-2.5 bg-blue-400 rounded-full"></div>}
                  </div>
                  <span className={`text-base font-medium leading-relaxed ${isSelected ? 'text-gray-100' : 'text-gray-300'}`}>
                    {opt}
                  </span>
                </label>
              );
            })}
          </div>
        </div>
      </div>

      {/* Footer Row */}
      <div className="bg-obsidian border-t border-gray-800 p-4 px-8 flex justify-between items-center text-xs text-gray-500">
        <div>
          Need Help? Call <span className="font-semibold text-gray-300">1-800-ACME-HR</span>
        </div>
        <div>
          AcmeHire Secure Assessment Platform v2.0
        </div>
      </div>
    </div>
  );
}

export default function CandidateDashboard() {
  const navigate = useNavigate();

  const [candidate, setCandidate] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchCandidate = async () => {
    const email = localStorage.getItem('candidateEmail');
    if (email) {
      const dbCandidate = await APIService.getCandidateByEmail(email);
      setCandidate(dbCandidate);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchCandidate();
  }, []);

  if (loading) {
    return <div className='p-8 text-center animate-pulse text-gray-400'>Loading dashboard...</div>;
  }

  if (!candidate) {
    return (
      <div className='min-h-screen bg-obsidian flex flex-col items-center justify-center p-6 text-center font-sans'>
        <h2 className='text-3xl font-extrabold text-red-500 mb-4'>Access Denied</h2>
        <p className='text-gray-300 text-lg'>You do not have permission to view this dashboard.</p>
        <p className='text-gray-500 mt-2'>Please use the secure link sent to your email by your recruiter.</p>
      </div>
    );
  }

  const handleTestComplete = async () => {
    await fetchCandidate();
  };

  return (
    <div className='min-h-screen bg-obsidian text-gray-100 p-6 font-sans selection:bg-teal-500/30'>
      <div className='max-w-5xl mx-auto'>
        <button onClick={() => navigate('/')} className='text-teal-400 hover:text-teal-300 hover:underline mb-8 font-semibold flex items-center gap-2 transition-colors'>
          &larr; Back to Home
        </button>

        <div className='flex justify-between items-start mb-10'>
          <div>
            <h1 className='text-4xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-teal-400 to-blue-500 tracking-tight'>
              AcmeHire Portal
            </h1>
            <p className='text-gray-400 mt-2 text-lg'>Welcome back, <span className='text-gray-200 font-semibold'>{candidate.name}</span></p>
          </div>
          <button onClick={() => { localStorage.removeItem('candidateEmail'); navigate('/'); }} className='text-sm bg-carbon border border-gray-700 hover:bg-gray-800 text-gray-300 px-5 py-2.5 rounded-lg transition-colors shadow-lg font-medium'>
            Sign Out
          </button>
        </div>

        {candidate.stage === 'Test Sent' && !candidate.testCompleted ? (
           <CandidateTestView onComplete={handleTestComplete} candidate={candidate} />
        ) : (
          <div className='animate-fade-in max-w-3xl mx-auto mt-12'>
            <div className='bg-carbon p-10 rounded-2xl shadow-2xl border border-gray-800 relative overflow-hidden'>
              
              {/* Decorative Gradient Background */}
              <div className='absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 bg-teal-500/10 rounded-full blur-3xl'></div>
              <div className='absolute bottom-0 left-0 -ml-20 -mb-20 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl'></div>

              <div className='relative z-10'>
                <div className='flex items-center gap-4 mb-6'>
                  <div className={`w-4 h-4 rounded-full animate-pulse shadow-lg ${
                    candidate.stage === 'Test Completed' ? 'bg-teal-400 shadow-teal-400/50' :
                    candidate.stage === 'Interview Scheduled' ? 'bg-purple-400 shadow-purple-400/50' :
                    candidate.stage === 'Offer Extended' ? 'bg-blue-400 shadow-blue-400/50' :
                    candidate.stage === 'Hired' ? 'bg-green-400 shadow-green-400/50' :
                    'bg-yellow-400 shadow-yellow-400/50'
                  }`}></div>
                  <h2 className='text-2xl font-bold text-white'>
                    {candidate.stage === 'Applied' ? 'Application Received' : candidate.stage}
                  </h2>
                </div>
                
                <div className='bg-gray-900/50 border border-gray-700/50 rounded-xl p-6 mb-8 backdrop-blur-sm'>
                  <p className='text-gray-300 text-lg'>
                    Current Pipeline Stage: <span className='font-bold text-white'>{candidate.stage}</span>
                  </p>
                  <p className='text-gray-400 mt-2'>
                    Time in current phase: <strong className='text-teal-400'>{candidate.nextRoundDays || 0} day(s)</strong>
                  </p>
                </div>

                <div className='text-sm text-gray-500 space-y-2 mb-8'>
                  <p><strong className='text-gray-400'>Target Role:</strong> {candidate.role}</p>
                  <p><strong className='text-gray-400'>Contact Email:</strong> {candidate.email}</p>
                </div>
                
                {candidate.testCompleted && (
                  <div className='bg-teal-500/10 border border-teal-500/20 rounded-lg p-4 inline-flex items-center gap-3'>
                    <svg className="w-5 h-5 text-teal-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path></svg>
                    <span className='text-teal-400 font-medium'>Your assessment was submitted successfully. Pending recruiter review.</span>
                  </div>
                )}
                
                {!candidate.testCompleted && candidate.stage === 'Applied' && (
                  <p className='text-gray-500 text-sm'>You will receive an email when your recruiter schedules your assessment.</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
