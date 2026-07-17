'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/components/auth-provider';
import apiClient from '@/lib/api-client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  MessageSquarePlus,
  Terminal,
  History,
  TrendingUp,
  Award,
  Calendar,
  LogOut,
  User,
  ArrowRight,
  Trash2,
} from 'lucide-react';

interface Interview {
  id: string;
  role: string;
  type: string;
  difficulty: string;
  status: 'ACTIVE' | 'COMPLETED';
  overallScore: number | null;
  createdAt: string;
}

interface UserStats {
  totalInterviews: number;
  averageScore: number;
  completedInterviews: number;
}

export default function DashboardPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, loading, logout } = useAuth();

  const [page, setPage] = useState<number>(1);
  const limit = 5;

  // Route security check: redirect to login if session is empty
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  // Fetch paginated interviews
  const { data: interviewsResponse, isLoading: historyLoading } = useQuery({
    queryKey: ['interviews', page],
    queryFn: async () => {
      const response = await apiClient.get(`/interviews?page=${page}&limit=${limit}`);
      return response.data;
    },
    enabled: !!user,
  });

  const interviews: Interview[] = interviewsResponse?.data?.interviews || [];
  const meta = interviewsResponse?.data?.meta || { total: 0, page: 1, limit: 5, totalPages: 1 };

  // Fetch user aggregate stats
  const { data: statsResponse, isLoading: statsLoading } = useQuery({
    queryKey: ['user-stats'],
    queryFn: async () => {
      const response = await apiClient.get('/users/stats');
      return response.data;
    },
    enabled: !!user,
  });

  // Delete Interview session mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/interviews/${id}`);
    },
    onSuccess: () => {
      // Invalidate both cache pools to sync displays
      queryClient.invalidateQueries({ queryKey: ['interviews'] });
      queryClient.invalidateQueries({ queryKey: ['user-stats'] });
      
      // If the last item on the page was deleted, move back a page
      if (interviews.length === 1 && page > 1) {
        setPage((p) => p - 1);
      }
    },
  });

  const handleDeleteReport = (id: string) => {
    if (window.confirm('Are you sure you want to permanently delete this interview report record? This action cannot be undone.')) {
      deleteMutation.mutate(id);
    }
  };

  if (loading || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-neutral-950 text-neutral-400">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-purple-500 border-r-2" />
          <span>Verifying active session...</span>
        </div>
      </div>
    );
  }

  const stats: UserStats = statsResponse?.data || {
    totalInterviews: 0,
    averageScore: 0,
    completedInterviews: 0,
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-950 via-neutral-900 to-neutral-950 text-neutral-100 flex flex-col">
      {/* Top Navbar */}
      <header className="px-6 lg:px-12 h-16 flex items-center justify-between border-b border-neutral-800 bg-neutral-950/80 backdrop-blur-md sticky top-0 z-50">
        <Link className="flex items-center space-x-2" href="/dashboard">
          <MessageSquarePlus className="h-5 w-5 text-purple-500" />
          <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-white to-purple-400 bg-clip-text text-transparent">
            AI Interviewer
          </span>
        </Link>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-3 py-1 bg-neutral-900 border border-neutral-800 rounded-md">
            <User className="h-4 w-4 text-purple-400" />
            <span className="text-sm font-medium text-neutral-300">{user.name}</span>
          </div>
          <Button variant="ghost" size="sm" onClick={logout} className="flex items-center gap-2 hover:text-red-400">
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Sign Out</span>
          </Button>
        </div>
      </header>

      {/* Main Dashboard Container */}
      <main className="flex-grow p-6 lg:p-12 max-w-7xl w-full mx-auto space-y-8">
        {/* Welcome Card */}
        <div className="p-8 rounded-2xl border border-neutral-800 bg-gradient-to-r from-purple-950/30 via-neutral-900/50 to-neutral-950 shadow-md">
          <div className="space-y-2">
            <h1 className="text-3xl font-extrabold tracking-tight md:text-4xl text-white">
              Welcome back, {user.name}!
            </h1>
            <p className="text-neutral-400 max-w-2xl text-sm leading-relaxed">
              Select one of the options below to prepare for your hiring rounds. You can configure mock interview contexts or write clean code in our compilation sandbox.
            </p>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <Card className="border-neutral-800 bg-neutral-950/40">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-neutral-400">Total Interviews</CardTitle>
              <History className="h-4 w-4 text-purple-400" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">{stats.totalInterviews}</div>
              <p className="text-xs text-neutral-500 mt-1">Sessions started</p>
            </CardContent>
          </Card>

          <Card className="border-neutral-800 bg-neutral-950/40">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-neutral-400">Average AI Score</CardTitle>
              <Award className="h-4 w-4 text-purple-400" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">
                {stats.averageScore ? `${stats.averageScore.toFixed(1)}%` : 'N/A'}
              </div>
              <p className="text-xs text-neutral-500 mt-1">Based on graded attempts</p>
            </CardContent>
          </Card>

          <Card className="border-neutral-800 bg-neutral-950/40">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-neutral-400">Completed Audits</CardTitle>
              <TrendingUp className="h-4 w-4 text-purple-400" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">{stats.completedInterviews}</div>
              <p className="text-xs text-neutral-500 mt-1">Sessions fully reviewed</p>
            </CardContent>
          </Card>
        </div>

        {/* Action Panel: Start Interview / Code Sandbox */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Start Interview Card */}
          <Card className="border-neutral-800 bg-neutral-950/50 hover:border-purple-500/30 transition-all group">
            <CardHeader>
              <div className="p-3 bg-purple-500/10 rounded-lg w-fit text-purple-400">
                <MessageSquarePlus className="h-6 w-6" />
              </div>
              <CardTitle className="text-lg font-bold mt-4 text-white">Start Mock Interview</CardTitle>
              <CardDescription>
                Initiate a live interview session with our Gemini AI engine. Select your target role, difficulty, and interview topics (DSA, System Design, HR).
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/interview/setup">
                <Button className="w-full flex items-center justify-center gap-2 group-hover:bg-purple-500 transition-all">
                  Configure Settings <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Coding Practice Card */}
          <Card className="border-neutral-800 bg-neutral-950/50 hover:border-purple-500/30 transition-all group">
            <CardHeader>
              <div className="p-3 bg-purple-500/10 rounded-lg w-fit text-purple-400">
                <Terminal className="h-6 w-6" />
              </div>
              <CardTitle className="text-lg font-bold mt-4 text-white">Coding Practice Sandbox</CardTitle>
              <CardDescription>
                Practice coding puzzles using our Monaco Editor console. Select compilation languages and run sample codes inside a secure sandbox powered by Judge0.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/coding">
                <Button variant="outline" className="w-full flex items-center justify-center gap-2 group-hover:bg-neutral-900 group-hover:text-white transition-all">
                  Open Console <ArrowRight className="h-4 w-4 text-purple-400" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Recent Interviews History */}
        <Card className="border-neutral-800 bg-neutral-950/40">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
              <History className="h-5 w-5 text-purple-400" /> Recent Interviews History
            </CardTitle>
            <CardDescription>Review status logs and score feedback reports for your past mock trials.</CardDescription>
          </CardHeader>
          <CardContent>
            {historyLoading ? (
              <div className="flex flex-col space-y-3 py-6">
                <div className="h-4 bg-neutral-900 rounded animate-pulse w-full" />
                <div className="h-4 bg-neutral-900 rounded animate-pulse w-5/6" />
                <div className="h-4 bg-neutral-900 rounded animate-pulse w-4/5" />
              </div>
            ) : interviews.length === 0 ? (
              <div className="text-center py-12 text-neutral-500 border border-dashed border-neutral-800 rounded-lg">
                <Calendar className="mx-auto h-8 w-8 text-neutral-600 mb-2" />
                <p className="text-sm font-medium">No interviews recorded yet</p>
                <p className="text-xs text-neutral-600 mt-1">Configure and start a new session to log stats.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-neutral-800 text-neutral-400 font-semibold">
                      <th className="pb-3 pr-4">Date</th>
                      <th className="pb-3 px-4">Topic / Role</th>
                      <th className="pb-3 px-4">Difficulty</th>
                      <th className="pb-3 px-4">Score</th>
                      <th className="pb-3 px-4">Status</th>
                      <th className="pb-3 pl-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-900">
                    {interviews.map((interview) => (
                      <tr key={interview.id} className="text-neutral-300 hover:bg-neutral-900/30 transition-colors">
                        <td className="py-4 pr-4 text-xs">
                          {new Date(interview.createdAt).toLocaleDateString(undefined, {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </td>
                        <td className="py-4 px-4 font-semibold text-white">
                          {interview.role} <span className="text-xs font-normal text-neutral-500">({interview.type})</span>
                        </td>
                        <td className="py-4 px-4">
                          <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-medium bg-neutral-900 border border-neutral-800 capitalize">
                            {interview.difficulty}
                          </span>
                        </td>
                        <td className="py-4 px-4 font-semibold text-purple-400">
                          {interview.overallScore !== null ? `${interview.overallScore}%` : '—'}
                        </td>
                        <td className="py-4 px-4">
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${
                              interview.status === 'COMPLETED'
                                ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                                : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            }`}
                          >
                            {interview.status}
                          </span>
                        </td>
                        <td className="py-4 pl-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {interview.status === 'COMPLETED' ? (
                              <Link href={`/interview/${interview.id}/results`}>
                                <Button variant="ghost" size="sm" className="h-8 text-xs text-purple-400 hover:text-purple-300">
                                  View Report
                                </Button>
                              </Link>
                            ) : (
                              <Link href={`/interview/${interview.id}`}>
                                <Button variant="outline" size="sm" className="h-8 text-xs text-amber-400 border-amber-500/20 hover:bg-amber-500/15">
                                  Resume
                                </Button>
                              </Link>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              disabled={deleteMutation.isPending}
                              onClick={() => handleDeleteReport(interview.id)}
                              className="h-8 w-8 text-neutral-500 hover:text-red-400 rounded"
                              title="Delete report"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Pagination Controls */}
                {meta.totalPages > 1 && (
                  <div className="flex items-center justify-between border-t border-neutral-800 pt-4 mt-4 text-xs">
                    <span className="text-neutral-400">
                      Showing page <span className="text-white font-semibold">{meta.page}</span> of{' '}
                      <span className="text-white font-semibold">{meta.totalPages}</span>
                    </span>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={page === 1 || deleteMutation.isPending}
                        onClick={() => setPage((p) => Math.max(p - 1, 1))}
                        className="h-8 text-xs"
                      >
                        Previous
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={page >= meta.totalPages || deleteMutation.isPending}
                        onClick={() => setPage((p) => Math.min(p + 1, meta.totalPages))}
                        className="h-8 text-xs"
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
