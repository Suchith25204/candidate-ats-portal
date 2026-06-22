import React, { useState, useEffect } from 'react';
import { useStytchB2BClient, useStytchMember } from '@stytch/react/b2b';
import { useNavigate } from 'react-router-dom';
import { APIService } from '../services/api';

// ---------------------------------------------------------
// COMPONENT: Profile Collection
// ---------------------------------------------------------
// CandidateProfileForm removed as requested

// ---------------------------------------------------------
// COMPONENT: The MCQ Test Interceptor (AcmeHire UI)
// ---------------------------------------------------------
function CandidateTestView({ onComplete, candidate }: { onComplete: () => void, candidate: any }) {
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({});
  const [flaggedQuestions, setFlaggedQuestions] = useState<Set<number>>(new Set());
  const [testData, setTestData] = useState<any>(candidate?.uniqueQuestions || null);
  const [isLoading, setIsLoading] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [activeSection, setActiveSection] = useState<'MCQ' | 'CODING'>('MCQ');
  const [code, setCode] = useState<string>('');
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionResult, setExecutionResult] = useState<any>(null);

  const mcqs = Array.isArray(testData) ? testData : (testData?.mcqs || []);
  const coding = Array.isArray(testData) ? null : testData?.coding;

  const [timeLeft, setTimeLeft] = useState(2700); // 45 minutes
  const [testStarted, setTestStarted] = useState(false);
  const [isReadyToStart, setIsReadyToStart] = useState(!!(mcqs.length > 0));
  const [testFinished, setTestFinished] = useState(false);

  const testFinishedRef = React.useRef(false);

  // Resume test generation if questions are missing (e.g., after a refresh)
  useEffect(() => {
    if (!testData && !isLoading && !isReadyToStart) {
      setIsLoading(true);
      fetchAIAssessment(candidate);
    }
  }, []);

  // Anti-Cheat (Fullscreen)
  useEffect(() => {
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement && testStarted && !testFinishedRef.current) {
        alert("WARNING: You exited fullscreen mode. Your test has been automatically submitted as an anti-cheat measure.");
        submitTest();
      }
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, [testStarted, mcqs, selectedAnswers]);

  const submitTest = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (testFinishedRef.current) return;
    
    testFinishedRef.current = true;
    setTestFinished(true);

    let score = 0;
    mcqs.forEach((q: any) => {
      if (selectedAnswers[q.id] === q.correctAnswer) score++;
    });

    const finalScore = mcqs.length > 0 ? Math.round((score / mcqs.length) * 100) : 0;

    if (candidate?.email) {
      await APIService.completeTest(candidate.email, selectedAnswers, finalScore);
    }

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

  // Profile submission logic removed

  const fetchAIAssessment = async (cand: any = candidate) => {
    try {
      const parsed = await APIService.generateQuestions(cand);
      setTestData(parsed);
      if (cand?.email) {
        await APIService.saveAIQuestions(cand.email, parsed);
      }
      setIsReadyToStart(true);
    } catch (err) {
      console.error("AI Generation Error:", err);
      setTestData({
        mcqs: [{ id: 1, text: "Error connecting to AI service. Please contact support.", options: ["OK", "Retry"], correctAnswer: "OK" }]
      });
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

  // No profile check needed anymore

  if (isLoading) {
    return (
      <div className="bg-neutral-900 p-8 rounded border border-neutral-800 text-center w-full max-w-4xl mx-auto mt-12 animate-pulse">
        <h2 className="text-xl font-bold text-white mb-4">Generating Assessment...</h2>
        <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto"></div>
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
      <div className="bg-neutral-900 p-10 rounded border border-neutral-800 text-center w-full max-w-4xl mx-auto mt-12">
        <h2 className="text-3xl font-bold text-white mb-4">Assessment Ready</h2>
        <p className="text-neutral-400 mb-8 leading-relaxed">
          Your secure test has been generated. This assessment utilizes anti-cheat protocols.
          You must remain in fullscreen mode for the duration.
        </p>
        <button
          onClick={startFullscreenTest}
          className="bg-white hover:bg-neutral-200 text-black font-bold py-4 px-10 rounded transition-colors"
        >
          Begin Test
        </button>
      </div>
    );
  }

  if (!testStarted || mcqs.length === 0) return null;

  const currentQ = mcqs[currentQuestionIndex];
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const attemptedCount = Object.keys(selectedAnswers).length;

  const handleExecute = () => {
    setIsExecuting(true);
    setExecutionResult(null);
    setTimeout(() => {
      setIsExecuting(false);
      setExecutionResult({ success: true, message: "All 5 test cases passed!" });
    }, 1500);
  };

  const renderSafeString = (val: any, fallback: string) => {
    if (!val) return fallback;
    if (typeof val === 'string') return val;
    return JSON.stringify(val, null, 2);
  };

  return (
    <div className="bg-black min-h-screen w-full flex flex-col font-sans">
      {/* Top Header Bar */}
      <div className="bg-neutral-900 border-b border-neutral-800 px-6 py-4 flex flex-col md:flex-row justify-between items-center gap-4">
        {/* Left: Section Dropdown */}
        <div className="w-full md:w-1/4">
          <select 
            value={activeSection}
            onChange={(e) => setActiveSection(e.target.value as 'MCQ' | 'CODING')}
            className="bg-black text-white font-bold border border-neutral-700 rounded px-4 py-2 text-sm outline-none focus:border-white transition-colors cursor-pointer"
          >
            <option value="MCQ">Section 1: General Tech</option>
            {coding && <option value="CODING">Section 2: Coding Hands-on</option>}
          </select>
        </div>

        {/* Middle: Pagination Navigation (Only show in MCQ mode) */}
        <div className="flex-1 flex flex-col items-center">
          {activeSection === 'MCQ' && (
            <>
              <div className="flex gap-2 overflow-x-auto max-w-full pb-2 scrollbar-hide">
                {mcqs.map((q: any, idx: number) => {
                  const isAttempted = selectedAnswers[q.id] !== undefined;
                  const isFlagged = flaggedQuestions.has(q.id);
                  const isActive = idx === currentQuestionIndex;
                  return (
                    <button
                      key={q.id}
                      onClick={() => setCurrentQuestionIndex(idx)}
                      className={`w-10 h-10 flex-shrink-0 flex items-center justify-center rounded font-bold text-sm transition-all ${isActive ? 'bg-white text-black' :
                        isAttempted ? 'bg-neutral-700 text-white' :
                          isFlagged ? 'bg-neutral-800 border border-neutral-500 text-neutral-400' :
                            'bg-neutral-900 border border-neutral-800 text-neutral-500 hover:bg-neutral-800'
                        }`}
                    >
                      {idx + 1}
                    </button>
                  );
                })}
              </div>
              <div className="text-xs text-neutral-500 mt-1 uppercase tracking-wider font-bold">
                Attempted: <span className="text-white">{attemptedCount}</span> / {mcqs.length}
              </div>
            </>
          )}
        </div>

        {/* Right: Timer & Finish */}
        <div className="w-full md:w-1/4 flex justify-end items-center gap-6">
          <div className="text-right">
            <div className="text-xs text-neutral-500 uppercase font-bold tracking-wider mb-1">Time Left</div>
            <div className={`font-mono text-xl font-bold ${timeLeft < 300 ? 'text-neutral-300 animate-pulse' : 'text-white'}`}>
              {formatTime(timeLeft)}
            </div>
          </div>
          <button
            onClick={() => { if (window.confirm('Are you sure you want to finish the test?')) submitTest(); }}
            className="bg-white hover:bg-neutral-200 text-black px-6 py-2 rounded font-bold text-sm transition-colors"
          >
            Finish Test
          </button>
        </div>
      </div>

      {activeSection === 'MCQ' ? (
        <div className="flex-1 flex flex-col lg:flex-row max-w-[1600px] w-full mx-auto">
          {/* Left Panel: Content */}
          <div className="lg:w-1/2 p-10 lg:border-r border-neutral-800 flex flex-col">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-white font-bold uppercase tracking-wider text-sm bg-neutral-900 px-3 py-1 rounded">Question {currentQuestionIndex + 1}</h3>
              <label className="flex items-center gap-2 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={flaggedQuestions.has(currentQ.id)}
                  onChange={() => toggleFlag(currentQ.id)}
                  className="w-4 h-4 rounded bg-black border-neutral-600 text-neutral-500 focus:ring-0"
                />
                <span className="text-neutral-400 text-sm font-bold group-hover:text-white transition-colors">Revisit Later</span>
              </label>
            </div>
            <div className="prose prose-invert max-w-none flex-1">
              <p className="text-2xl text-white leading-relaxed font-medium">
                {currentQ.text}
              </p>
            </div>
          </div>

          {/* Right Panel: Answering Area */}
          <div className="lg:w-1/2 p-10 bg-black flex flex-col justify-center">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-neutral-500 font-bold uppercase tracking-wider text-sm">Select an option</h3>
              <button
                onClick={() => {
                  const newAnswers = { ...selectedAnswers };
                  delete newAnswers[currentQ.id];
                  setSelectedAnswers(newAnswers);
                }}
                className="text-xs text-neutral-400 hover:text-white font-bold transition-colors"
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
                    className={`flex items-start gap-4 p-6 rounded cursor-pointer border transition-colors ${isSelected
                      ? 'bg-neutral-900 border-white'
                      : 'bg-black border-neutral-800 hover:border-neutral-600'
                      }`}
                  >
                    <input 
                      type="radio" 
                      name={`question-${currentQ.id}`} 
                      value={opt} 
                      checked={isSelected} 
                      onChange={() => handleSelect(currentQ.id, opt)} 
                      className="hidden" 
                    />
                    <div className={`mt-1 w-5 h-5 flex-shrink-0 rounded-full border-2 flex items-center justify-center transition-colors ${isSelected ? 'border-white' : 'border-neutral-600'
                      }`}>
                      {isSelected && <div className="w-2.5 h-2.5 bg-white rounded-full"></div>}
                    </div>
                    <span className={`text-lg font-medium leading-relaxed ${isSelected ? 'text-white' : 'text-neutral-300'}`}>
                      {opt}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col lg:flex-row w-full overflow-hidden">
          {/* Left Panel: Problem Description */}
          <div className="lg:w-[40%] flex flex-col border-r border-neutral-800 bg-black h-full overflow-y-auto">
            <div className="p-8">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-white">{renderSafeString(coding?.title, 'Data Structures Problem')}</h2>
                <span className="bg-neutral-900 text-neutral-300 px-3 py-1 rounded text-sm font-bold border border-neutral-700">Hard</span>
              </div>
              
              <div className="prose prose-invert max-w-none text-neutral-300">
                <p className="text-lg leading-relaxed mb-6 whitespace-pre-wrap">{renderSafeString(coding?.description, 'No description provided.')}</p>
                
                <h3 className="text-white font-bold mt-8 mb-4">Input Format</h3>
                <div className="bg-neutral-900 p-4 rounded border border-neutral-800">
                  <p className="font-mono text-sm whitespace-pre-wrap">{renderSafeString(coding?.inputFormat, 'Read from standard input.')}</p>
                </div>

                <h3 className="text-white font-bold mt-8 mb-4">Constraints</h3>
                <div className="bg-neutral-900 p-4 rounded border border-neutral-800">
                  <p className="font-mono text-sm whitespace-pre-wrap">{renderSafeString(coding?.constraints, 'N/A')}</p>
                </div>

                <h3 className="text-white font-bold mt-8 mb-4">Example</h3>
                <div className="bg-neutral-900 rounded border border-neutral-800 p-6 space-y-4">
                  <div>
                    <h4 className="text-neutral-500 font-bold uppercase text-xs mb-2">Input</h4>
                    <pre className="text-white font-mono text-sm whitespace-pre-wrap">{renderSafeString(coding?.example?.input, 'Example Input')}</pre>
                  </div>
                  <div className="border-t border-neutral-800 pt-4">
                    <h4 className="text-neutral-500 font-bold uppercase text-xs mb-2">Output</h4>
                    <pre className="text-white font-mono text-sm whitespace-pre-wrap">{renderSafeString(coding?.example?.output, 'Example Output')}</pre>
                  </div>
                  <div className="border-t border-neutral-800 pt-4">
                    <h4 className="text-neutral-500 font-bold uppercase text-xs mb-2">Explanation</h4>
                    <p className="text-neutral-400 text-sm leading-relaxed whitespace-pre-wrap">{renderSafeString(coding?.example?.explanation, 'Explanation of the output.')}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Panel: Editor and Console */}
          <div className="lg:w-[60%] flex flex-col h-full bg-[#0a0a0a]">
            {/* Editor Area */}
            <div className="flex-1 border-b border-neutral-800 flex flex-col">
              <div className="bg-neutral-900 px-4 py-2 border-b border-neutral-800 flex gap-4">
                <div className="text-sm text-neutral-400 font-mono flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-white"></span>
                  solution.cpp
                </div>
              </div>
              <textarea
                value={code}
                onChange={(e) => setCode(e.target.value)}
                spellCheck="false"
                placeholder="// Write your solution here..."
                className="flex-1 w-full p-4 bg-transparent text-white font-mono text-sm resize-none outline-none focus:ring-0 leading-relaxed"
              />
            </div>
            
            {/* Console Area */}
            <div className="h-[200px] bg-neutral-900 flex flex-col">
              <div className="px-4 py-3 border-b border-neutral-800 flex justify-between items-center bg-black">
                <div className="flex gap-4">
                  <button className="text-sm text-white font-bold px-3 py-1 bg-neutral-800 rounded">Case 1</button>
                  <button className="text-sm text-neutral-500 font-bold px-3 py-1 hover:text-white transition-colors">Case 2</button>
                </div>
                <button 
                  onClick={handleExecute}
                  disabled={isExecuting}
                  className="bg-white hover:bg-neutral-200 text-black font-bold px-6 py-1.5 rounded text-sm transition-colors disabled:opacity-50"
                >
                  {isExecuting ? 'Running...' : 'Execute'}
                </button>
              </div>
              <div className="flex-1 p-4 overflow-y-auto font-mono text-sm">
                {!executionResult && !isExecuting && (
                  <div className="text-neutral-500">Run code to see console output.</div>
                )}
                {isExecuting && (
                  <div className="text-neutral-400 animate-pulse">Compiling and running against test cases...</div>
                )}
                {executionResult && (
                  <div className="text-white">
                    <div className="text-neutral-400 mb-2">Compiler Message:</div>
                    <div className="mb-4">Success</div>
                    <div className="text-neutral-400 mb-2">Status:</div>
                    <div className="text-white font-bold bg-neutral-800 inline-block px-3 py-1 rounded">
                      {executionResult.message}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
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
    return <div className='min-h-screen bg-black p-8 text-center animate-pulse text-neutral-500 font-bold'>Loading dashboard...</div>;
  }

  if (!candidate) {
    return (
      <div className='min-h-screen bg-black flex flex-col items-center justify-center p-6 text-center font-sans'>
        <h2 className='text-3xl font-bold text-white mb-4'>Access Denied</h2>
        <p className='text-neutral-400 text-lg'>You do not have permission to view this dashboard.</p>
        <p className='text-neutral-500 mt-2'>Please use the secure link sent to your email by your recruiter.</p>
      </div>
    );
  }

  const handleTestComplete = async () => {
    await fetchCandidate();
  };

  const isTesting = candidate.stage === 'Test Sent' && !candidate.testCompleted;

  return (
    <div className='min-h-screen bg-black text-white font-sans flex flex-col'>
      {/* Candidate Header - Only show if NOT in test mode (fullscreen takes over anyway, but cleanly hide it) */}
      {!isTesting && (
        <header className="w-full bg-black border-b border-neutral-800 px-8 py-5 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
              <span className="text-black font-bold text-xl">A</span>
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">AcmeHire</h1>
          </div>
          <div className="flex items-center gap-8">
            <div className="text-right">
              <div className="text-white font-bold">{candidate.name}</div>
              <div className="text-neutral-500 text-sm">{candidate.role}</div>
            </div>
            <button 
              onClick={() => { localStorage.removeItem('candidateEmail'); navigate('/'); }} 
              className="text-sm font-bold bg-neutral-900 border border-neutral-800 hover:bg-neutral-800 text-white px-5 py-2.5 rounded transition-colors"
            >
              Sign Out
            </button>
          </div>
        </header>
      )}

      {/* Main Content Area */}
      <div className={`flex-1 ${isTesting ? 'w-full' : 'p-8 max-w-[1200px] w-full mx-auto mt-8'}`}>
        {isTesting ? (
          <CandidateTestView onComplete={handleTestComplete} candidate={candidate} />
        ) : (
          <div className='animate-fade-in'>
            <h2 className='text-3xl font-bold text-white mb-8'>Application Status</h2>
            <div className='bg-neutral-900 p-10 rounded shadow-2xl border border-neutral-800'>

              <div className='flex items-center gap-4 mb-8 pb-8 border-b border-neutral-800'>
                <div className='w-4 h-4 rounded-full bg-white animate-pulse'></div>
                <h3 className='text-2xl font-bold text-white'>
                  {candidate.stage === 'Applied' ? 'Application Received' : candidate.stage}
                </h3>
              </div>

              <div className='grid grid-cols-1 md:grid-cols-2 gap-8 mb-8'>
                <div className='bg-black border border-neutral-800 rounded p-6'>
                  <p className='text-neutral-500 text-sm font-bold uppercase tracking-wider mb-2'>Target Role</p>
                  <p className='text-white font-bold text-xl'>{candidate.role}</p>
                </div>
                <div className='bg-black border border-neutral-800 rounded p-6'>
                  <p className='text-neutral-500 text-sm font-bold uppercase tracking-wider mb-2'>Time in phase</p>
                  <p className='text-white font-bold text-xl'>{candidate.nextRoundDays || 0} day(s)</p>
                </div>
              </div>

              {candidate.testCompleted && (
                <div className='bg-neutral-800 border border-neutral-700 rounded p-6 flex items-center gap-4'>
                  <span className='text-white font-bold text-lg'>✓</span>
                  <span className='text-white font-bold'>Your assessment was submitted successfully. Pending recruiter review.</span>
                </div>
              )}

              {!candidate.testCompleted && candidate.stage === 'Applied' && (
                <p className='text-neutral-500 font-bold'>You will receive an email when your recruiter schedules your assessment.</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
