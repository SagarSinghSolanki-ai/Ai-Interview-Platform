'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Editor from '@monaco-editor/react';
import { useAuth } from '@/components/auth-provider';
import apiClient from '@/lib/api-client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Terminal,
  Play,
  CheckSquare,
  History,
  Code2,
  ArrowLeft,
  Loader2,
  ChevronRight,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';

interface Submission {
  id: string;
  language: string;
  code: string;
  status: string;
  stdout: string | null;
  stderr: string | null;
  compileOutput: string | null;
  createdAt: string;
}

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

export default function CodingPracticePage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, loading } = useAuth();

  const [language, setLanguage] = useState<string>('javascript');
  const [code, setCode] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'console' | 'history'>('console');
  
  // Output screen states
  const [runStatus, setRunStatus] = useState<string | null>(null);
  const [stdout, setStdout] = useState<string | null>(null);
  const [stderr, setStderr] = useState<string | null>(null);
  const [compileOutput, setCompileOutput] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Authentication guard
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  // Set default boilerplates when changing language
  useEffect(() => {
    setCode(BOILERPLATE_CODE[language] || '');
  }, [language]);

  // Fetch previous submissions
  const { data: historyResponse, isLoading: historyLoading } = useQuery({
    queryKey: ['coding-history'],
    queryFn: async () => {
      const response = await apiClient.get('/coding/history');
      return response.data;
    },
    enabled: !!user,
  });

  const submissions: Submission[] = historyResponse?.data || [];

  // Run Code Mutation (sandbox only)
  const runMutation = useMutation({
    mutationFn: async (payload: { language: string; code: string }) => {
      const response = await apiClient.post('/coding/run', payload);
      return response.data;
    },
    onSuccess: (resData) => {
      const data = resData.data;
      setRunStatus(data.status);
      setStdout(data.stdout);
      setStderr(data.stderr);
      setCompileOutput(data.compileOutput);
      setActiveTab('console');
    },
    onError: (error: any) => {
      setErrorMsg(error.response?.data?.message || 'Code execution failed. Please verify configurations.');
    },
  });

  // Submit Code Mutation (sandbox + PostgreSQL persistence)
  const submitMutation = useMutation({
    mutationFn: async (payload: { language: string; code: string }) => {
      const response = await apiClient.post('/coding/submit', payload);
      return response.data;
    },
    onSuccess: (resData) => {
      const data = resData.data;
      setRunStatus(data.status);
      setStdout(data.stdout);
      setStderr(data.stderr);
      setCompileOutput(data.compileOutput);
      setActiveTab('console');
      
      // Refresh the query client cache to load the newly logged submission
      queryClient.invalidateQueries({ queryKey: ['coding-history'] });
    },
    onError: (error: any) => {
      setErrorMsg(error.response?.data?.message || 'Code submission failed. Please verify configurations.');
    },
  });

  const handleRunCode = () => {
    setErrorMsg(null);
    runMutation.mutate({ language, code });
  };

  const handleSubmitCode = () => {
    setErrorMsg(null);
    submitMutation.mutate({ language, code });
  };

  const handleSelectHistorySubmission = (sub: Submission) => {
    setLanguage(sub.language);
    setCode(sub.code);
    setRunStatus(sub.status);
    setStdout(sub.stdout);
    setStderr(sub.stderr);
    setCompileOutput(sub.compileOutput);
    setActiveTab('console');
  };

  if (loading || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-neutral-950 text-neutral-400">
        <Loader2 className="animate-spin h-8 w-8 text-purple-500" />
      </div>
    );
  }

  const isExecuting = runMutation.isPending || submitMutation.isPending;

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col h-screen overflow-hidden">
      {/* Top Navbar */}
      <header className="px-6 h-14 flex items-center justify-between border-b border-neutral-800 bg-neutral-950 shrink-0">
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="text-neutral-400 hover:text-white text-xs font-semibold flex items-center gap-1.5">
            <ArrowLeft className="h-4 w-4" /> Dashboard
          </Link>
          <div className="h-4 w-[1px] bg-neutral-800" />
          <div className="flex items-center gap-2">
            <Code2 className="h-5 w-5 text-purple-500" />
            <span className="font-bold text-sm text-white">Coding Sandbox Workspace</span>
          </div>
        </div>

        {/* Action controls */}
        <div className="flex items-center gap-4">
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            disabled={isExecuting}
            className="h-9 px-3 text-xs bg-neutral-900 border border-neutral-800 rounded-md outline-none text-neutral-350 focus:ring-1 focus:ring-purple-600"
          >
            <option value="javascript">JavaScript (Node.js)</option>
            <option value="python">Python 3</option>
            <option value="cpp">C++ (Clang)</option>
            <option value="java">Java (JDK)</option>
          </select>

          <Button variant="outline" size="sm" onClick={handleRunCode} disabled={isExecuting} className="flex items-center gap-1.5 h-9">
            <Play className="h-3.5 w-3.5 text-green-400" /> Run Code
          </Button>
          <Button size="sm" onClick={handleSubmitCode} disabled={isExecuting} className="flex items-center gap-1.5 h-9">
            <CheckSquare className="h-3.5 w-3.5" /> Submit Code
          </Button>
        </div>
      </header>

      {/* Editor Split Columns */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Column: Monaco Code Editor */}
        <div className="flex-1 relative h-full bg-[#1e1e1e]">
          <Editor
            height="100%"
            language={language === 'cpp' ? 'cpp' : language === 'java' ? 'java' : language}
            value={code}
            onChange={(val) => setCode(val || '')}
            theme="vs-dark"
            options={{
              minimap: { enabled: false },
              fontSize: 14,
              cursorBlinking: 'smooth',
              formatOnType: true,
              automaticLayout: true,
            }}
          />
        </div>

        {/* Right Column: Console Terminal / Output View */}
        <div className="w-[420px] border-l border-neutral-800 bg-neutral-950 flex flex-col h-full overflow-hidden shrink-0">
          {/* Tab selectors */}
          <div className="flex border-b border-neutral-800 bg-neutral-950/40 shrink-0">
            <button
              onClick={() => setActiveTab('console')}
              className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider text-center border-b-2 transition-all flex items-center justify-center gap-2 ${
                activeTab === 'console'
                  ? 'border-purple-600 text-white bg-purple-500/5'
                  : 'border-transparent text-neutral-500 hover:text-neutral-300'
              }`}
            >
              <Terminal className="h-4 w-4" /> Terminal Output
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider text-center border-b-2 transition-all flex items-center justify-center gap-2 ${
                activeTab === 'history'
                  ? 'border-purple-600 text-white bg-purple-500/5'
                  : 'border-transparent text-neutral-500 hover:text-neutral-300'
              }`}
            >
              <History className="h-4 w-4" /> Submissions
            </button>
          </div>

          {/* Panel contents */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {errorMsg && (
              <Alert>
                <AlertTitle>Execution Error</AlertTitle>
                <AlertDescription>{errorMsg}</AlertDescription>
              </Alert>
            )}

            {/* TAB: Console Logs */}
            {activeTab === 'console' && (
              <div className="space-y-4 h-full flex flex-col">
                {isExecuting ? (
                  <div className="flex-grow flex flex-col items-center justify-center text-neutral-500 gap-3 py-12">
                    <Loader2 className="h-6 w-6 animate-spin text-purple-500" />
                    <span className="text-xs font-medium">Running script inside Judge0 sandbox...</span>
                  </div>
                ) : runStatus ? (
                  <div className="space-y-4 flex-grow flex flex-col">
                    {/* Status Badge */}
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Status:</span>
                      <span
                        className={`text-xs px-2 py-0.5 rounded font-bold ${
                          runStatus === 'Accepted'
                            ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                            : 'bg-red-500/10 text-red-400 border border-red-500/20'
                        }`}
                      >
                        {runStatus}
                      </span>
                    </div>

                    {/* Output Terminal Stream */}
                    <div className="flex-1 bg-neutral-900 border border-neutral-850 rounded-lg p-4 font-mono text-xs text-neutral-300 overflow-y-auto min-h-[250px] leading-relaxed">
                      {runStatus === 'Compilation Error' && compileOutput && (
                        <pre className="text-red-400 whitespace-pre-wrap">{compileOutput}</pre>
                      )}

                      {runStatus === 'Runtime Error' && stderr && (
                        <pre className="text-red-400 whitespace-pre-wrap">{stderr}</pre>
                      )}

                      {stdout ? (
                        <pre className="whitespace-pre-wrap">{stdout}</pre>
                      ) : (
                        runStatus === 'Accepted' && <pre className="text-neutral-500">Execution success (empty output streams).</pre>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex-grow flex flex-col items-center justify-center text-neutral-600 text-center py-20">
                    <Code2 className="h-8 w-8 text-neutral-800 mb-2" />
                    <p className="text-sm font-semibold">Workspace Console Idle</p>
                    <p className="text-xs text-neutral-650 mt-1 max-w-[250px] mx-auto">
                      Click "Run Code" to compile or "Submit" to persist outcomes.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* TAB: Submission History */}
            {activeTab === 'history' && (
              <div className="space-y-3">
                {historyLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-purple-500" />
                  </div>
                ) : submissions.length === 0 ? (
                  <div className="text-center py-12 text-neutral-600 text-xs">
                    No submissions recorded yet. Click "Submit Code" to save runs.
                  </div>
                ) : (
                  submissions.map((sub) => (
                    <div
                      key={sub.id}
                      onClick={() => handleSelectHistorySubmission(sub)}
                      className="p-3 border border-neutral-850 rounded-lg bg-neutral-900/30 hover:border-purple-500/20 hover:bg-neutral-900/60 cursor-pointer transition-all flex items-center justify-between group"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-white uppercase">{sub.language}</span>
                          <span className="text-[10px] text-neutral-500">
                            {new Date(sub.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-[10px] text-neutral-400 truncate max-w-[200px]">
                          {sub.code.substring(0, 45)}...
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider ${
                            sub.status === 'Accepted' ? 'text-green-400 bg-green-500/5' : 'text-red-400 bg-red-500/5'
                          }`}
                        >
                          {sub.status === 'Accepted' ? 'PASS' : 'FAIL'}
                        </span>
                        <ChevronRight className="h-4 w-4 text-neutral-600 group-hover:text-purple-400 transition-colors" />
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
