'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/components/auth-provider';
import apiClient from '@/lib/api-client';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  MessageSquare,
  User,
  Send,
  Loader2,
  Mic,
  AlertTriangle,
  Award,
  CheckCircle,
  HelpCircle,
  ArrowLeft,
  Play,
  Code2,
  Terminal,
} from 'lucide-react';
import Editor from '@monaco-editor/react';

const BOILERPLATE_CODE: Record<string, string> = {
  javascript: `// JavaScript Playground (Node.js)
function solve() {
  console.log("Hello, World!");
}

solve();`,
  python: `# Python Playground
def solve():
    print("Hello, World!")

solve()`,
  cpp: `// C++ Playground
#include <iostream>
using namespace std;

int main() {
    cout << "Hello, World!" << endl;
    return 0;
}`,
  java: `// Java Playground
public class Main {
    public static void main(String[] args) {
        System.out.println("Hello, World!");
    }
}`,
};

interface Answer {
  id: string;
  answerText: string;
  feedbackText: string | null;
  score: number | null;
}

interface Question {
  id: string;
  questionText: string;
  order: number;
  answer: Answer | null;
}

interface Interview {
  id: string;
  role: string;
  type: string;
  difficulty: string;
  status: 'ACTIVE' | 'COMPLETED';
  questions: Question[];
}

export default function InterviewRoomPage() {
  const router = useRouter();
  const params = useParams();
  const queryClient = useQueryClient();
  const { user, loading } = useAuth();
  
  const interviewId = params.id as string;
  const [answerText, setAnswerText] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isListening, setIsListening] = useState<boolean>(false);
  const recognitionRef = useRef<any>(null);

  const [showEditor, setShowEditor] = useState<boolean>(false);
  const [editorLanguage, setEditorLanguage] = useState<string>('javascript');
  const [editorCode, setEditorCode] = useState<string>('');
  
  // Output sandbox compilation states
  const [runStatus, setRunStatus] = useState<string | null>(null);
  const [runStdout, setRunStdout] = useState<string | null>(null);
  const [runStderr, setRunStderr] = useState<string | null>(null);
  const [runCompileOutput, setRunCompileOutput] = useState<string | null>(null);
  const [runLoading, setRunLoading] = useState<boolean>(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Authentication guard
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  // Initialize Web Speech API for real-time speech-to-text
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const rec = new SpeechRecognition();
        rec.continuous = true;
        rec.interimResults = false;
        rec.lang = 'en-US';

        rec.onstart = () => {
          setIsListening(true);
        };

        rec.onresult = (event: any) => {
          const transcript = event.results[event.results.length - 1][0].transcript;
          setAnswerText((prev) => (prev ? prev + ' ' + transcript : transcript));
        };

        rec.onerror = (event: any) => {
          console.error('Speech recognition error:', event.error);
          setIsListening(false);
        };

        rec.onend = () => {
          setIsListening(false);
        };

        recognitionRef.current = rec;
      }
    }
  }, []);

  // Fetch current interview history log
  const {
    data: interviewResponse,
    isLoading: fetchLoading,
    error: fetchError,
  } = useQuery({
    queryKey: ['interview', interviewId],
    queryFn: async () => {
      const response = await apiClient.get(`/interviews/${interviewId}`);
      return response.data;
    },
    enabled: !!user && !!interviewId,
  });

  const interview: Interview | null = interviewResponse?.data || null;

  // Set default boilerplates when changing language
  useEffect(() => {
    setEditorCode(BOILERPLATE_CODE[editorLanguage] || '');
  }, [editorLanguage]);

  // Auto-detect coding questions based on prompt keywords
  useEffect(() => {
    const questions = interview?.questions || [];
    const currentQuestionIndex = questions.findIndex((q: any) => !q.answer);
    const activeQuestion = currentQuestionIndex !== -1 ? questions[currentQuestionIndex] : null;

    if (activeQuestion && activeQuestion.id !== lastQuestionIdRef.current) {
      lastQuestionIdRef.current = activeQuestion.id;
      const text = activeQuestion.questionText.toLowerCase();
      const isCoding =
        text.includes('write code') ||
        text.includes('write a function') ||
        text.includes('implement a function') ||
        text.includes('coding challenge') ||
        text.includes('write typescript') ||
        text.includes('write javascript') ||
        text.includes('write c++') ||
        text.includes('write python') ||
        text.includes('write java') ||
        text.includes('code editor') ||
        text.includes('write a program') ||
        text.includes('algorithm to') ||
        text.includes('code snippet');

      if (isCoding) {
        setShowEditor(true);
        setEditorCode(BOILERPLATE_CODE[editorLanguage] || '');
      }
    }
  }, [interview, editorLanguage]);

  // Auto-scroll to the bottom of the chat logs when new messages are added
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [interview?.questions]);

  // If the interview is already completed, redirect directly to the results report page
  useEffect(() => {
    if (interview && interview.status === 'COMPLETED') {
      router.push(`/interview/${interviewId}/results`);
    }
  }, [interview, interviewId, router]);

  // Submit Answer Mutation
  const submitMutation = useMutation({
    mutationFn: async (text: string) => {
      const response = await apiClient.post(`/interviews/${interviewId}/answer`, {
        answerText: text,
      });
      return response.data;
    },
    onSuccess: (resData) => {
      setAnswerText('');
      setErrorMsg(null);
      
      // Invalidate the cache to fetch the updated list of questions/answers
      queryClient.invalidateQueries({ queryKey: ['interview', interviewId] });
      queryClient.invalidateQueries({ queryKey: ['user-stats'] });
      
      if (resData.data.isFinished) {
        router.push(`/interview/${interviewId}/results`);
      }
    },
    onError: (error: any) => {
      setErrorMsg(error.response?.data?.message || 'Failed to submit answer. Please try again.');
    },
  });

  const lastQuestionIdRef = useRef<string | null>(null);

  const handleSubmitAnswer = (e: React.FormEvent) => {
    e.preventDefault();
    let submissionText = answerText.trim();

    if (showEditor) {
      if (!editorCode.trim()) {
        setErrorMsg('Please write your code solution in the editor before submitting.');
        return;
      }

      submissionText = `${answerText.trim()}

### Candidate Code Implementation (${editorLanguage})
\`\`\`${editorLanguage}
${editorCode}
\`\`\`
`;
    }

    if (!submissionText || submissionText.length < 5) {
      setErrorMsg('Your answer must be at least 5 characters long');
      return;
    }
    setErrorMsg(null);
    submitMutation.mutate(submissionText);
  };

  const handleToggleListening = () => {
    if (!recognitionRef.current) {
      setErrorMsg('Vocal speech recognition is not supported in this browser. Please use Google Chrome or Microsoft Edge.');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
    } else {
      setErrorMsg(null);
      try {
        recognitionRef.current.start();
      } catch (e) {
        console.error(e);
      }
    }
  };

  const handleRunCode = async () => {
    if (runLoading) return;
    setRunLoading(true);
    setRunStatus(null);
    setRunStdout(null);
    setRunStderr(null);
    setRunCompileOutput(null);
    try {
      const response = await apiClient.post('/coding/run', {
        language: editorLanguage,
        code: editorCode,
      });
      const data = response.data.data;
      setRunStatus(data.status);
      setRunStdout(data.stdout);
      setRunStderr(data.stderr);
      setRunCompileOutput(data.compileOutput);
    } catch (err: any) {
      console.error(err);
      setRunStatus('Error');
      setRunStderr(err.response?.data?.message || 'Failed to execute code in sandbox.');
    } finally {
      setRunLoading(false);
    }
  };

  if (loading || !user || fetchLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-neutral-950 text-neutral-400">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="animate-spin h-8 w-8 text-purple-500" />
          <span>Entering interview room...</span>
        </div>
      </div>
    );
  }

  if (fetchError || !interview) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-neutral-950 p-4">
        <Card className="max-w-md border-red-500/20 bg-neutral-950 text-center">
          <CardHeader>
            <AlertTriangle className="mx-auto h-8 w-8 text-red-400 mb-2" />
            <CardTitle>Session Loading Error</CardTitle>
            <CardDescription>We could not retrieve this interview session profile.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-neutral-400">Please confirm you have authorization to view this interview or that the session ID is correct.</p>
          </CardContent>
          <CardFooter>
            <Button onClick={() => router.push('/dashboard')} className="w-full">
              Back to Dashboard
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // Determine the current question waiting for an answer
  const questions = interview.questions || [];
  const currentQuestionIndex = questions.findIndex((q) => !q.answer);
  const activeQuestion = currentQuestionIndex !== -1 ? questions[currentQuestionIndex] : null;



  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-950 via-neutral-900 to-neutral-950 text-neutral-100 flex flex-col overflow-hidden h-screen">
      {/* Header */}
      <header className="px-6 lg:px-12 h-16 flex items-center justify-between border-b border-neutral-800 bg-neutral-950/80 backdrop-blur-md sticky top-0 z-50 shrink-0">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push('/dashboard')}
            className="text-neutral-400 hover:text-white text-xs font-semibold flex items-center gap-1.5"
          >
            <ArrowLeft className="h-4 w-4" /> Exit Room
          </button>
          <div className="h-4 w-[1px] bg-neutral-800 hidden sm:block" />
          <div className="hidden sm:block">
            <span className="text-xs font-semibold text-neutral-400 capitalize">
              {interview.difficulty} Level · {interview.type} Interview
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowEditor(!showEditor)}
            className={`border-neutral-850 hover:bg-neutral-800 text-xs gap-1.5 h-8 transition-colors ${
              showEditor ? 'text-purple-400 border-purple-500/30 bg-purple-500/5' : 'text-neutral-400'
            }`}
          >
            <Code2 className="h-3.5 w-3.5" />
            {showEditor ? 'Hide Editor IDE' : 'Open Editor IDE'}
          </Button>
          <div className="px-3 py-1 bg-neutral-900 border border-neutral-800 rounded text-xs font-bold text-purple-400 h-8 flex items-center">
            Question {activeQuestion ? currentQuestionIndex + 1 : questions.length} of 5
          </div>
        </div>
      </header>

      {/* Main Split Body Workspace */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Side Panel: Chat Dialogue Transcript */}
        <div className={`flex-1 flex flex-col overflow-y-auto ${
          showEditor ? 'lg:max-w-[50%] border-r border-neutral-850 bg-neutral-950/20' : 'max-w-4xl mx-auto w-full'
        }`}>
          <div className="flex-1 p-6 space-y-6">
            <div className="p-4 rounded-lg bg-neutral-900/40 border border-neutral-800 text-center text-xs text-neutral-400">
              💼 You are interviewing for the <span className="text-white font-semibold">{interview.role}</span> position. Speak or type your responses carefully.
            </div>

            {/* Chat History Messages */}
            <div className="space-y-6">
              {questions.map((q, idx) => (
                <div key={q.id} className="space-y-4">
                  {/* Interviewer AI Question Card */}
                  <div className="flex gap-3 max-w-[85%]">
                    <div className="h-8 w-8 rounded-full bg-purple-900/30 border border-purple-500/20 text-purple-400 flex items-center justify-center shrink-0">
                      <HelpCircle className="h-4 w-4" />
                    </div>
                    <div className="p-4 rounded-xl bg-neutral-900 border border-neutral-800 text-sm text-neutral-200 leading-relaxed shadow-sm">
                      {q.questionText}
                    </div>
                  </div>

                  {/* Candidate Answer Card */}
                  {q.answer && (
                    <div className="flex gap-3 max-w-[85%] ml-auto justify-end">
                      <div className="p-4 rounded-xl bg-purple-950/20 border border-purple-500/10 text-sm text-neutral-100 leading-relaxed shadow-sm whitespace-pre-wrap">
                        {q.answer.answerText}
                      </div>
                      <div className="h-8 w-8 rounded-full bg-neutral-900 border border-neutral-850 text-neutral-400 flex items-center justify-center shrink-0">
                        <User className="h-4 w-4" />
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {/* AI Thinking/Analysis Pulse loader */}
              {submitMutation.isPending && (
                <div className="flex gap-3 max-w-[80%] animate-pulse">
                  <div className="h-8 w-8 rounded-full bg-purple-900/20 text-purple-400 flex items-center justify-center shrink-0">
                    <Loader2 className="h-4 w-4 animate-spin" />
                  </div>
                  <div className="p-4 rounded-xl bg-neutral-900/60 border border-neutral-800 text-xs text-neutral-400 flex items-center gap-2">
                    Evaluating response and formulating next questions...
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Footer Input Area */}
          <footer className="border-t border-neutral-800 bg-neutral-950/50 backdrop-blur-md p-4 sticky bottom-0 z-45 shrink-0">
            <div className="w-full space-y-4">
              {errorMsg && (
                <Alert>
                  <AlertDescription>{errorMsg}</AlertDescription>
                </Alert>
              )}

              {activeQuestion ? (
                <form onSubmit={handleSubmitAnswer} className="relative flex items-end gap-2 bg-neutral-900 border border-neutral-800 rounded-xl p-2 focus-within:ring-2 focus-within:ring-purple-600 transition-all">
                  <textarea
                    placeholder={
                      showEditor
                        ? "Type your code explanation or conceptual notes here..."
                        : "Type your detailed response here..."
                    }
                    value={answerText}
                    onChange={(e) => setAnswerText(e.target.value)}
                    disabled={submitMutation.isPending}
                    className="flex-1 bg-transparent border-0 outline-none ring-0 resize-none text-sm max-h-32 min-h-[44px] px-2 py-2 text-neutral-100 placeholder:text-neutral-500"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSubmitAnswer(e);
                      }
                    }}
                  />
                  <div className="flex items-center gap-1.5 shrink-0">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={handleToggleListening}
                      disabled={submitMutation.isPending}
                      className={`h-9 w-9 rounded-lg transition-all ${
                        isListening
                          ? 'text-red-400 bg-red-500/10 hover:bg-red-500/20 hover:text-red-300 animate-pulse border border-red-500/20'
                          : 'text-neutral-400 hover:text-purple-400 hover:bg-neutral-800'
                      }`}
                      title={isListening ? 'Stop listening' : 'Start speech-to-text'}
                    >
                      <Mic className="h-4 w-4" />
                    </Button>
                    <Button
                      type="submit"
                      size="icon"
                      disabled={submitMutation.isPending || (!answerText.trim() && !showEditor)}
                      className="h-9 w-9 bg-purple-600 hover:bg-purple-500 rounded-lg text-white"
                      title={showEditor ? 'Submit code & explanation' : 'Submit response'}
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </form>
              ) : (
                !submitMutation.isPending && (
                  <div className="p-4 bg-green-500/10 border border-green-500/20 text-green-400 rounded-xl text-center text-sm font-semibold flex flex-col items-center justify-center gap-3">
                    <div className="flex items-center justify-center gap-2">
                      <CheckCircle className="h-5 w-5" /> All questions answered! Finalizing evaluation report...
                    </div>
                    <Button
                      onClick={() => router.push(`/interview/${interviewId}/results`)}
                      className="bg-green-650 hover:bg-green-600 text-white font-bold text-xs h-8 px-4 rounded-md transition-all active:scale-95"
                    >
                      View My Feedback Report
                    </Button>
                  </div>
                )
              )}
              <div className="text-center text-[10px] text-neutral-500">
                Press <kbd className="bg-neutral-900 border border-neutral-850 px-1 py-0.5 rounded">Enter</kbd> to submit response, or <kbd className="bg-neutral-900 border border-neutral-850 px-1 py-0.5 rounded">Shift + Enter</kbd> to insert a new line.
              </div>
            </div>
          </footer>
        </div>

        {/* Right Side Panel: Monaco Code Editor Playground */}
        {showEditor && (
          <div className="hidden lg:flex flex-col w-[50%] bg-neutral-950 border-l border-neutral-800 overflow-hidden h-full">
            {/* Editor Workspace Header */}
            <div className="flex items-center justify-between px-6 py-3 border-b border-neutral-800 bg-neutral-950 shrink-0">
              <div className="flex items-center gap-2">
                <Code2 className="h-4 w-4 text-purple-400" />
                <span className="text-xs font-bold uppercase tracking-wider text-neutral-300">IDE Sandbox</span>
              </div>
              <div className="flex items-center gap-3">
                <select
                  value={editorLanguage}
                  onChange={(e) => setEditorLanguage(e.target.value)}
                  className="bg-neutral-900 border border-neutral-800 rounded px-2 py-1 text-xs text-neutral-200 outline-none focus:ring-1 focus:ring-purple-500"
                >
                  <option value="javascript">JavaScript</option>
                  <option value="python">Python</option>
                  <option value="cpp">C++ (GCC)</option>
                  <option value="java">Java</option>
                </select>
                <Button
                  onClick={handleRunCode}
                  disabled={runLoading}
                  className="bg-green-650 hover:bg-green-600 text-white text-xs h-7 px-3 flex items-center gap-1 rounded active:scale-95 transition-all"
                >
                  {runLoading ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Play className="h-3.5 w-3.5" />
                  )}
                  Run Code
                </Button>
              </div>
            </div>

            {/* Monaco Editor Instance */}
            <div className="flex-1 min-h-[250px] border-b border-neutral-900 bg-neutral-950 relative overflow-hidden">
              <Editor
                height="100%"
                language={editorLanguage === 'cpp' ? 'cpp' : editorLanguage}
                theme="vs-dark"
                value={editorCode}
                onChange={(val) => setEditorCode(val || '')}
                options={{
                  minimap: { enabled: false },
                  fontSize: 13,
                  lineHeight: 20,
                  fontFamily: "var(--font-mono), Menlo, Monaco, 'Courier New', monospace",
                  scrollbar: {
                    vertical: 'visible',
                    horizontal: 'visible',
                  },
                }}
              />
            </div>

            {/* Sandbox Console / Terminal Output */}
            <div className="h-[220px] flex flex-col bg-neutral-950 shrink-0 border-t border-neutral-900">
              <div className="flex items-center gap-2 px-6 py-2 border-b border-neutral-900 bg-neutral-950 shrink-0">
                <Terminal className="h-3.5 w-3.5 text-neutral-400" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">Terminal Output</span>
                {runStatus && (
                  <span className={`ml-auto text-[10px] font-bold px-2 py-0.5 rounded ${
                    runStatus === 'Accepted'
                      ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                      : 'bg-red-500/10 text-red-400 border border-red-500/20'
                  }`}>
                    {runStatus}
                  </span>
                )}
              </div>
              <div className="flex-1 p-4 font-mono text-xs overflow-y-auto bg-neutral-900/35 text-neutral-300">
                {runLoading ? (
                  <div className="flex items-center gap-2 text-neutral-500">
                    <Loader2 className="h-4 w-4 animate-spin text-purple-500" />
                    <span>Compiling and executing code in sandbox...</span>
                  </div>
                ) : runStatus ? (
                  <div className="space-y-2">
                    {runCompileOutput && (
                      <div className="text-amber-400 whitespace-pre-wrap border-b border-neutral-900 pb-2 mb-2">
                        {runCompileOutput}
                      </div>
                    )}
                    {runStdout && (
                      <div className="whitespace-pre-wrap text-emerald-400">
                        {runStdout}
                      </div>
                    )}
                    {runStderr && (
                      <div className="text-red-400 whitespace-pre-wrap">
                        {runStderr}
                      </div>
                    )}
                    {!runStdout && !runStderr && !runCompileOutput && (
                      <div className="text-neutral-500 italic">Program execution success. Output stream empty.</div>
                    )}
                  </div>
                ) : (
                  <div className="text-neutral-600 italic">No output. Press "Run Code" to compile inside container sandbox.</div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
