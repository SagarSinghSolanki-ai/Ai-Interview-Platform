'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/components/auth-provider';
import apiClient from '@/lib/api-client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  Award,
  BookOpen,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  Loader2,
  Calendar,
} from 'lucide-react';

interface Answer {
  id: string;
  answerText: string;
  feedbackText: string | null;
  score: number | null;
  technicalScore: number | null;
  communicationScore: number | null;
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
  overallScore: number | null;
  technicalScore: number | null;
  communicationScore: number | null;
  feedback: string | null;
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
  questions: Question[];
  createdAt: string;
}

export default function ResultsPage() {
  const router = useRouter();
  const params = useParams();
  const { user, loading } = useAuth();
  
  const interviewId = params.id as string;
  const [openQuestionId, setOpenQuestionId] = useState<string | null>(null);

  // Authentication guard
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  // Query interview details
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

  // Toggle accordion views
  const toggleQuestion = (id: string) => {
    setOpenQuestionId((prev) => (prev === id ? null : id));
  };

  if (loading || !user || fetchLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-neutral-950 text-neutral-400">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="animate-spin h-8 w-8 text-purple-500" />
          <span>Compiling feedback report...</span>
        </div>
      </div>
    );
  }

  if (fetchError || !interview || interview.status !== 'COMPLETED') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-neutral-950 p-4">
        <Card className="max-w-md border-neutral-800 bg-neutral-950 text-center">
          <CardHeader>
            <AlertTriangle className="mx-auto h-8 w-8 text-amber-400 mb-2" />
            <CardTitle>Report Unavailable</CardTitle>
            <CardDescription>This interview has not been completed or finalized yet.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-neutral-400 mb-4">You must complete all 5 questions in the interview room to generate an evaluation report.</p>
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

  const overall = interview.overallScore || 0;
  const technical = interview.technicalScore || 0;
  const communication = interview.communicationScore || 0;

  // Circular progress stroke calculation
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (overall / 100) * circumference;

  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-950 via-neutral-900 to-neutral-950 text-neutral-100 flex flex-col">
      {/* Header */}
      <header className="px-6 lg:px-12 h-16 flex items-center justify-between border-b border-neutral-800 bg-neutral-950/80 backdrop-blur-md sticky top-0 z-50">
        <button
          onClick={() => router.push('/dashboard')}
          className="text-neutral-400 hover:text-white text-xs font-semibold flex items-center gap-1.5"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Dashboard
        </button>
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-neutral-500" />
          <span className="text-xs text-neutral-400">
            Completed {new Date(interview.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
          </span>
        </div>
      </header>

      {/* Main Results Container */}
      <main className="flex-1 p-6 lg:p-12 max-w-5xl w-full mx-auto space-y-8">
        {/* Title Block */}
        <div className="space-y-1">
          <h1 className="text-3xl font-extrabold tracking-tight text-white capitalize">
            {interview.role} Interview Evaluation
          </h1>
          <p className="text-sm text-neutral-400">
            Focus Topic: <span className="text-purple-400 font-semibold">{interview.type}</span> · Difficulty: <span className="capitalize text-neutral-300 font-semibold">{interview.difficulty}</span>
          </p>
        </div>

        {/* Scores Ring & Progress Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Circular Overall Score Card */}
          <Card className="border-neutral-850 bg-neutral-950/40 flex flex-col justify-center items-center p-6">
            <CardHeader className="text-center p-0 pb-4">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-neutral-400">Overall Rating</CardTitle>
            </CardHeader>
            <CardContent className="p-0 flex flex-col items-center justify-center relative">
              <svg className="w-28 h-28 transform -rotate-90">
                {/* Background Ring */}
                <circle cx="56" cy="56" r={radius} className="stroke-neutral-800" strokeWidth="8" fill="transparent" />
                {/* Animated colored ring */}
                <circle
                  cx="56"
                  cy="56"
                  r={radius}
                  className="stroke-purple-500 transition-all duration-500"
                  strokeWidth="8"
                  fill="transparent"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                />
              </svg>
              {/* Inner score label */}
              <div className="absolute text-2xl font-black text-white">{overall}%</div>
              <p className="text-[10px] text-neutral-500 mt-4 text-center">Calculated average performance score</p>
            </CardContent>
          </Card>

          {/* Technical and Communication Progress Bars */}
          <Card className="border-neutral-850 bg-neutral-950/40 col-span-1 md:col-span-2 p-6 flex flex-col justify-between">
            <div className="space-y-6">
              {/* Tech Score progress */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs font-bold uppercase tracking-wider">
                  <span className="text-neutral-450 flex items-center gap-1.5"><Award className="h-4 w-4 text-purple-400" /> Technical Accuracy</span>
                  <span className="text-purple-400">{technical}%</span>
                </div>
                <div className="w-full bg-neutral-900 h-2.5 rounded-full border border-neutral-800 overflow-hidden">
                  <div className="bg-purple-500 h-full transition-all duration-500" style={{ width: `${technical}%` }} />
                </div>
                <p className="text-[10px] text-neutral-500">Evaluates domain understanding, code accuracy, and syntax execution.</p>
              </div>

              {/* Comm Score progress */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs font-bold uppercase tracking-wider">
                  <span className="text-neutral-450 flex items-center gap-1.5"><MessageSquare className="h-4 w-4 text-purple-400" /> Communication Clarity</span>
                  <span className="text-purple-400">{communication}%</span>
                </div>
                <div className="w-full bg-neutral-900 h-2.5 rounded-full border border-neutral-800 overflow-hidden">
                  <div className="bg-purple-500 h-full transition-all duration-500" style={{ width: `${communication}%` }} />
                </div>
                <p className="text-[10px] text-neutral-500">Evaluates explanation structures, conciseness, and problem decomposition.</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Global Feedback Card */}
        {interview.feedback && (
          <Card className="border-neutral-850 bg-neutral-950/40">
            <CardHeader>
              <CardTitle className="text-sm font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-purple-400" /> AI Executive Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-neutral-300 leading-relaxed whitespace-pre-wrap">
                {interview.feedback}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Strengths / Weaknesses / Suggestions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Strengths (Green) */}
          <Card className="border-neutral-850 bg-neutral-950/40">
            <CardHeader className="pb-3">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-green-400 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" /> Identified Strengths
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {interview.strengths.map((str, i) => (
                  <li key={i} className="text-xs text-neutral-300 leading-relaxed pl-2 border-l border-green-500/35">
                    {str}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Weaknesses (Orange) */}
          <Card className="border-neutral-850 bg-neutral-950/40">
            <CardHeader className="pb-3">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" /> Improvement Areas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {interview.weaknesses.map((weak, i) => (
                  <li key={i} className="text-xs text-neutral-300 leading-relaxed pl-2 border-l border-amber-500/35">
                    {weak}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Suggestions (Blue/Bulb) */}
          <Card className="border-neutral-850 bg-neutral-950/40">
            <CardHeader className="pb-3">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-blue-400 flex items-center gap-2">
                <Lightbulb className="h-4 w-4" /> Actionable Tips
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {interview.suggestions.map((sug, i) => (
                  <li key={i} className="text-xs text-neutral-300 leading-relaxed pl-2 border-l border-blue-500/35">
                    {sug}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Question-wise Feedback Accordion */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-purple-400" /> Question-wise Detailed Feedback
          </h2>

          <div className="space-y-3">
            {interview.questions.map((q, idx) => {
              const isOpen = openQuestionId === q.id;
              const hasAnswer = !!q.answer;
              const score = q.answer?.score || 0;
              
              return (
                <div key={q.id} className="border border-neutral-850 rounded-xl bg-neutral-950/20 overflow-hidden transition-all">
                  {/* Collapsible Header bar */}
                  <button
                    onClick={() => toggleQuestion(q.id)}
                    className="w-full p-4 flex items-center justify-between text-left hover:bg-neutral-900/30 transition-colors"
                  >
                    <div className="flex items-center gap-4 flex-1 mr-4">
                      <span className="text-xs font-bold text-purple-400 shrink-0">Q{idx + 1}</span>
                      <p className="text-xs font-semibold text-neutral-200 line-clamp-1 flex-1">
                        {q.questionText}
                      </p>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      {hasAnswer ? (
                        <span className="text-xs font-bold text-purple-400 bg-purple-500/5 px-2 py-0.5 border border-purple-500/10 rounded">
                          Score: {score}%
                        </span>
                      ) : (
                        <span className="text-xs font-semibold text-neutral-500 uppercase">UNANSWERED</span>
                      )}
                      {isOpen ? <ChevronUp className="h-4 w-4 text-neutral-500" /> : <ChevronDown className="h-4 w-4 text-neutral-500" />}
                    </div>
                  </button>

                  {/* Collapsible Content */}
                  {isOpen && (
                    <div className="p-5 border-t border-neutral-900 bg-neutral-950/60 space-y-4">
                      {/* Detailed Question text */}
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Full Question:</span>
                        <p className="text-xs text-neutral-350 bg-neutral-900/40 p-3 rounded-lg border border-neutral-900">
                          {q.questionText}
                        </p>
                      </div>

                      {/* Candidate response */}
                      {q.answer && (
                        <div className="space-y-1">
                          <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Your Answer:</span>
                          <p className="text-xs text-neutral-250 bg-neutral-900/40 p-3 rounded-lg border border-neutral-900 whitespace-pre-wrap leading-relaxed">
                            {q.answer.answerText}
                          </p>
                        </div>
                      )}

                      {/* AI Critique feedback */}
                      {q.answer?.feedbackText && (
                        <div className="space-y-2">
                          <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider">
                            <span className="text-purple-400">Interviewer Review Critique:</span>
                            <span className="text-neutral-500">
                              Tech: {q.answer.technicalScore}% · Comm: {q.answer.communicationScore}%
                            </span>
                          </div>
                          <p className="text-xs text-neutral-300 leading-relaxed bg-purple-500/5 p-4 rounded-lg border border-purple-500/10 whitespace-pre-wrap">
                            {q.answer.feedbackText}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
}
