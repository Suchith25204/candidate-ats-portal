import React, { useState, useEffect } from 'react';
import { useStytch, useStytchUser } from '@stytch/react';
import { useNavigate } from 'react-router-dom';
import { APIService } from '../services/api';
import StageCard from './StageCard';
import RolePulse from './RolePulse';
import AsyncQuestion from './AsyncQuestion';

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
            className="w-full p-3 border rounded focus:ring-2 focus:ring-blue-500 outline-none"
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
            className="w-full p-3 border rounded focus:ring-2 focus:ring-blue-500 outline-none"
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
            className="w-full p-3 border rounded focus:ring-2 focus:ring-blue-500 outline-none"
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
// COMPONENT: The MCQ Test Interceptor
// ---------------------------------------------------------
function CandidateTestView({ onComplete, candidate }: { onComplete: () => void, candidate: any }) {
  const [profileCompleted, setProfileCompleted] = useState(candidate?.profileCompleted || false);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({});
  const [questions, setQuestions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  const [timeLeft, setTimeLeft] = useState(600);
  const [testStarted, setTestStarted] = useState(false);
  const [isReadyToStart, setIsReadyToStart] = useState(false);
  const [testFinished, setTestFinished] = useState(false);

  // Fullscreen Anti-Cheat Listener
  useEffect(() => {
    const handleFullscreenChange = () => {
      // If we exit fullscreen and the test is actively running (not already finished)
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
      if (selectedAnswers[q.id] === q.correctAnswer) {
        score++;
      }
    });

    const finalScore = questions.length > 0 ? Math.round((score / questions.length) * 100) : 0;

    if (candidate?.id) {
      await APIService.completeTest(candidate.id, selectedAnswers, finalScore);
    }

    setTestFinished(true);
    // Attempt to exit fullscreen cleanly if we are in it
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(err => console.error(err));
    }

    alert(`Test submitted successfully! Your score: ${finalScore}%. Your recruiter has been notified.`);
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
      // Auto submit when timer reaches 0
      submitTest();
    }
    return () => clearInterval(timer);
  }, [testStarted, timeLeft]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleProfileSubmit = async (profileData: any) => {
    setIsLoading(true);
    setProfileCompleted(true);

    if (candidate?.id) {
      await APIService.saveProfile(candidate.id, profileData);
    }

    const mergedCandidate = {
      ...candidate,
      stream: profileData.stream,
      specialization: profileData.specialization,
      interests: profileData.interests
    };

    await fetchAIAssessment(mergedCandidate);
  };

  const fetchAIAssessment = async (cand: any = candidate) => {
    try {
      // Direct call to the backend service (Local Proxy or AWS later)
      const parsed = await APIService.generateQuestions(cand);
      setQuestions(parsed);
      
      if (cand?.id) {
        await APIService.saveAIQuestions(cand.id, parsed);
      }
      setIsReadyToStart(true);
    } catch (err) {
      console.error("AI Generation Error:", err);
      // Fallback
      setQuestions([
        { id: 1, text: "Error connecting to AI service. Please contact support.", options: ["OK", "Retry", "Cancel", "Help"], correctAnswer: "OK" }
      ]);
      setIsReadyToStart(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelect = (qId: number, answer: string) => {
    setSelectedAnswers(prev => ({ ...prev, [qId]: answer }));
  };

  if (!profileCompleted) {
    return <CandidateProfileForm onComplete={handleProfileSubmit} />;
  }

  if (isLoading) {
    return (
      <div className="bg-white p-8 rounded-lg shadow-md border border-gray-200">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Generating Personalized Assessment...</h2>
        <div className="animate-pulse flex space-x-4">
          <div className="flex-1 space-y-6 py-1">
            <div className="h-2 bg-slate-200 rounded"></div>
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-4"><div className="h-2 bg-slate-200 rounded col-span-2"></div><div className="h-2 bg-slate-200 rounded col-span-1"></div></div>
              <div className="h-2 bg-slate-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const startFullscreenTest = async () => {
    try {
      await document.documentElement.requestFullscreen();
      setTestStarted(true);
    } catch (err) {
      alert("Failed to enter fullscreen mode. Please ensure your browser allows fullscreen to take this assessment.");
    }
  };

  if (isReadyToStart && !testStarted) {
    return (
      <div className="bg-white p-8 rounded-lg shadow-md border border-gray-200 text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Assessment Ready</h2>
        <p className="text-gray-600 mb-6 max-w-lg mx-auto">
          Your personalized technical assessment has been generated. 
          <br /><br />
          <strong>ANTI-CHEAT WARNING:</strong> This test must be taken in Fullscreen mode. If you exit fullscreen, switch tabs, or press ESC during the test, your assessment will be <strong>automatically submitted</strong>.
        </p>
        <button 
          onClick={startFullscreenTest}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded transition-colors text-lg"
        >
          Enter Fullscreen & Start Test
        </button>
      </div>
    );
  }

  if (!testStarted || questions.length === 0) {
    return null;
  }

  const currentQ = questions[currentQuestionIndex];
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
      {/* Header / Timer */}
      <div className="bg-gray-50 border-b border-gray-200 p-4 flex justify-between items-center">
        <div>
          <span className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Question {currentQuestionIndex + 1} of {questions.length}</span>
        </div>
        <div className={`font-mono text-lg font-bold px-4 py-1 rounded ${timeLeft < 60 ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>
          ⏱ {formatTime(timeLeft)}
        </div>
      </div>

      <div className="p-8 flex flex-col md:flex-row gap-8 min-h-[400px]">
        {/* Left Side: Question */}
        <div className="md:w-1/2 flex flex-col justify-center border-b md:border-b-0 md:border-r border-gray-100 pb-6 md:pb-0 md:pr-8">
          <h2 className="text-2xl font-semibold text-gray-800 leading-relaxed">
            {currentQ.text}
          </h2>
        </div>

        {/* Right Side: Options */}
        <div className="md:w-1/2 flex flex-col justify-center">
          <div className="space-y-3">
            {currentQ.options.map((opt: string) => (
              <label
                key={opt}
                onClick={() => handleSelect(currentQ.id, opt)}
                className={`block w-full border p-4 rounded-xl cursor-pointer transition-all ${selectedAnswers[currentQ.id] === opt ? 'bg-blue-50 border-blue-400 ring-1 ring-blue-400' : 'bg-white border-gray-200 hover:border-gray-300 hover:bg-gray-50'}`}
              >
                {/* Changed to items-start so the bullet aligns with the top line of long text */}
                <div className="flex items-start gap-3">

                  {/* Added shrink-0 and mt-0.5 right here */}
                  <div className={`shrink-0 mt-0.5 w-5 h-5 rounded-full border flex items-center justify-center ${selectedAnswers[currentQ.id] === opt ? 'border-blue-500' : 'border-gray-300'}`}>
                    {selectedAnswers[currentQ.id] === opt && <div className="w-2.5 h-2.5 bg-blue-500 rounded-full"></div>}
                  </div>

                  <span className="text-gray-700 font-medium leading-relaxed">{opt}</span>
                </div>
              </label>
            ))}
          </div>
        </div>
      </div>
      {/* Footer / Controls */}
      <div className="bg-gray-50 border-t border-gray-200 p-4 flex justify-between items-center">
        <button
          type="button"
          disabled={currentQuestionIndex === 0}
          onClick={() => setCurrentQuestionIndex(prev => prev - 1)}
          className="px-6 py-2 rounded font-medium text-gray-600 hover:bg-gray-200 disabled:opacity-50 transition-colors"
        >
          Previous
        </button>

        {currentQuestionIndex < questions.length - 1 ? (
          <button
            type="button"
            onClick={() => setCurrentQuestionIndex(prev => prev + 1)}
            className="px-6 py-2 rounded font-bold text-white bg-blue-600 hover:bg-blue-700 transition-colors"
          >
            Next Question
          </button>
        ) : (
          <button
            type="button"
            onClick={submitTest}
            className="px-8 py-2 rounded font-bold text-white bg-green-600 hover:bg-green-700 transition-colors shadow-sm"
          >
            Submit Test
          </button>
        )}
      </div>
    </div>
  );
}

export default function CandidateDashboard() {
  const { user: stytchUser } = useStytchUser();
  const stytch = useStytch();
  const navigate = useNavigate();

  const [candidate, setCandidate] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchCandidate = async () => {
    if (stytchUser && stytchUser.emails && stytchUser.emails.length > 0) {
      const email = stytchUser.emails[0].email;
      const dbCandidate = await APIService.getCandidateByEmail(email);
      setCandidate(dbCandidate);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchCandidate();
  }, [stytchUser]);

  if (loading) {
    return <div className='p-8 text-center animate-pulse'>Loading dashboard...</div>;
  }

  if (!stytchUser || !candidate) {
    return (
      <div className='min-h-screen bg-blue-50/30 flex flex-col items-center justify-center p-6 text-center'>
        <h2 className='text-2xl font-bold text-red-600 mb-4'>Access Denied</h2>
        <p className='text-gray-700'>You do not have permission to view this dashboard.</p>
        <p className='text-gray-500 mt-2'>Please use the secure link sent to your email by your recruiter.</p>
      </div>
    );
  }

  const handleTestComplete = async () => {
    await fetchCandidate();
  };

  return (
    <div className='min-h-screen bg-blue-50/30 p-6'>
      <button onClick={() => navigate('/')} className='text-blue-600 hover:underline mb-6 font-medium'>
        &larr; Back to Home
      </button>

      <div className='max-w-4xl mx-auto animate-fade-in'>
        <div className='flex justify-between items-start mb-8'>
          <div>
            <h1 className='text-3xl font-extrabold text-gray-900'>Hiring Portal</h1>
            <p className='text-gray-500 mt-2'>Welcome back, <span className='font-semibold'>{candidate.name}</span>.</p>
          </div>
          <button onClick={() => { stytch.session.revoke(); navigate('/'); }} className='text-sm bg-gray-200 hover:bg-gray-300 px-4 py-2 rounded transition-colors shadow-sm'>
            Sign Out
          </button>
        </div>

        {candidate.stage === 'Test Sent' && !candidate.testCompleted ? (
           <CandidateTestView onComplete={handleTestComplete} candidate={candidate} />
        ) : candidate.stage === 'Applied' ? (
          <div className='animate-fade-in max-w-3xl'>
            <div className='bg-white p-8 rounded-lg shadow-md border border-gray-200'>
              <div className='flex items-center gap-3 mb-4'>
                <div className='w-3 h-3 bg-yellow-400 rounded-full animate-pulse'></div>
                <h2 className='text-xl font-bold text-gray-800'>Application Received</h2>
              </div>
              <div className='bg-blue-50 border border-blue-200 rounded p-4 mb-4'>
                <p className='text-blue-800 font-medium'>Status: <span className='font-bold'>Applied</span></p>
                <p className='text-blue-700 text-sm mt-1'>
                  Waiting for Recruiter action for <strong>{candidate.nextRoundDays || 0} day(s)</strong>.
                </p>
              </div>
              <div className='text-sm text-gray-500 space-y-1'>
                <p><strong>Role:</strong> {candidate.role}</p>
                <p><strong>Email:</strong> {candidate.email}</p>
              </div>
              <p className='text-gray-400 text-xs mt-6'>You will receive an email when your recruiter schedules your assessment.</p>
            </div>
          </div>
        ) : (
          <div className='animate-fade-in max-w-3xl'>
            <StageCard candidateId={candidate.id} />
            <RolePulse candidateId={candidate.id} />
            <AsyncQuestion candidateId={candidate.id} />
          </div>
        )}
      </div>
    </div>
  );
}
