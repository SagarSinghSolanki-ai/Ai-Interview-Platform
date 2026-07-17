'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/navigation';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { useAuth } from '@/components/auth-provider';
import apiClient from '@/lib/api-client';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  ArrowLeft,
  ArrowRight,
  MessageSquareCode,
  Award,
  Terminal,
  Database,
  Cpu,
  Globe,
  Users,
  Settings,
  ShieldCheck,
  CheckCircle,
} from 'lucide-react';

const setupSchema = z.object({
  role: z.string().trim().min(2, { message: 'Target role must be at least 2 characters long' }).max(50),
  difficulty: z.enum(['entry', 'mid', 'senior']),
  type: z.enum(['HR', 'Technical', 'Behavioral', 'DSA', 'OOP', 'DBMS', 'OS', 'Networks']),
});

type SetupSchemaInput = z.infer<typeof setupSchema>;

const roleSuggestions = [
  'Frontend Engineer',
  'Backend Developer',
  'Full Stack Developer',
  'Mobile App Engineer',
  'DevOps Engineer',
  'Data Scientist',
];

const difficultyOptions = [
  { value: 'entry', title: 'Entry Level', desc: '0-2 years experience. Core fundamentals, language syntax, and basic workflows.' },
  { value: 'mid', title: 'Mid Level', desc: '2-5 years experience. Problem-solving, system designs, best practices, and code review.' },
  { value: 'senior', title: 'Senior Level', desc: '5+ years experience. Architecture patterns, scaling constraints, leadership, and system design.' },
];

const typeOptions = [
  { value: 'Technical', title: 'Technical', desc: 'General programming concepts', icon: Terminal },
  { value: 'DSA', title: 'DSA', desc: 'Algorithms & Data Structures', icon: MessageSquareCode },
  { value: 'Behavioral', title: 'Behavioral', desc: 'Conflict resolution & leadership', icon: Users },
  { value: 'DBMS', title: 'DBMS', desc: 'Relational databases & indexing', icon: Database },
  { value: 'OOP', title: 'OOP', desc: 'Classes, design patterns, interfaces', icon: Settings },
  { value: 'OS', title: 'Operating Systems', desc: 'Memory, scheduling, threads', icon: Cpu },
  { value: 'Networks', title: 'Computer Networks', desc: 'TCP/IP, HTTP, routing, DNS', icon: Globe },
  { value: 'HR', title: 'HR Screening', desc: 'Cultural fit, motivations, background', icon: ShieldCheck },
];

export default function SetupPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [step, setStep] = useState<number>(1);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Authentication guard redirect
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    trigger,
    formState: { errors },
  } = useForm<SetupSchemaInput>({
    resolver: zodResolver(setupSchema),
    defaultValues: {
      role: '',
      difficulty: 'mid',
      type: 'Technical',
    },
  });

  const selectedRole = watch('role');
  const selectedDifficulty = watch('difficulty');
  const selectedType = watch('type');

  const mutation = useMutation({
    mutationFn: async (payload: SetupSchemaInput) => {
      const response = await apiClient.post('/interviews', payload);
      return response.data;
    },
    onSuccess: (resData) => {
      // Redirect to the newly created live interview chat room
      router.push(`/interview/${resData.data.interviewId}`);
    },
    onError: (error: any) => {
      setErrorMsg(error.response?.data?.message || 'Failed to initialize interview. Please try again.');
    },
  });

  const handleNextStep = async () => {
    if (step === 1) {
      // Validate role field before progressing
      const isValid = await trigger('role');
      if (!isValid) return;
    }
    setStep((prev) => Math.min(prev + 1, 4));
  };

  const handlePrevStep = () => {
    setStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSelectRoleSuggestion = (roleName: string) => {
    setValue('role', roleName);
    setStep(2);
  };

  const handleSelectDifficulty = (value: 'entry' | 'mid' | 'senior') => {
    setValue('difficulty', value);
    setStep(3);
  };

  const handleSelectType = (value: 'HR' | 'Technical' | 'Behavioral' | 'DSA' | 'OOP' | 'DBMS' | 'OS' | 'Networks') => {
    setValue('type', value);
    setStep(4);
  };

  const onSubmit = (data: SetupSchemaInput) => {
    setErrorMsg(null);
    mutation.mutate(data);
  };

  if (loading || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-neutral-950 text-neutral-400">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-purple-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-950 via-neutral-900 to-neutral-950 text-neutral-100 flex flex-col justify-center px-4 py-12">
      <div className="max-w-2xl w-full mx-auto space-y-6">
        {/* Nav Back Header */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => (step > 1 ? handlePrevStep() : router.push('/dashboard'))}
            className="flex items-center gap-2 text-xs font-semibold text-neutral-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-4 w-4" /> {step > 1 ? 'Previous Step' : 'Back to Dashboard'}
          </button>
          <div className="text-xs text-neutral-500 font-medium">Step {step} of 4</div>
        </div>

        {/* Wizard Progress Bar */}
        <div className="w-full bg-neutral-900 h-1.5 rounded-full overflow-hidden border border-neutral-800">
          <div
            className="bg-purple-600 h-full transition-all duration-300"
            style={{ width: `${(step / 4) * 100}%` }}
          />
        </div>

        {errorMsg && (
          <Alert>
            <AlertTitle>Configuration Error</AlertTitle>
            <AlertDescription>{errorMsg}</AlertDescription>
          </Alert>
        )}

        {/* Step 1: Target Role / Topic */}
        {step === 1 && (
          <Card className="border-neutral-800 bg-neutral-950/70">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-white">Specify Target Role</CardTitle>
              <CardDescription>What role or technology stack are you interviewing for?</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="role">Job Title / Focus Topic</Label>
                <Input
                  id="role"
                  placeholder="e.g. Senior React Developer, Node.js Engineer"
                  {...register('role')}
                  className={errors.role ? 'border-red-500 focus-visible:ring-red-500' : ''}
                />
                {errors.role && <p className="text-xs text-red-500 font-medium">{errors.role.message}</p>}
              </div>

              {/* Role Suggestions */}
              <div className="space-y-2 pt-2">
                <Label>Quick Suggestions</Label>
                <div className="flex flex-wrap gap-2">
                  {roleSuggestions.map((suggestion) => (
                    <button
                      key={suggestion}
                      type="button"
                      onClick={() => handleSelectRoleSuggestion(suggestion)}
                      className="px-3 py-1.5 rounded-full text-xs font-semibold bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 hover:text-white transition-all"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button type="button" className="ml-auto flex items-center gap-2" onClick={handleNextStep}>
                Next Step <ArrowRight className="h-4 w-4" />
              </Button>
            </CardFooter>
          </Card>
        )}

        {/* Step 2: Experience / Difficulty Selection */}
        {step === 2 && (
          <Card className="border-neutral-800 bg-neutral-950/70">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-white">Experience Level</CardTitle>
              <CardDescription>Choose the seniority context for the interview question set.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                {difficultyOptions.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => handleSelectDifficulty(opt.value as 'entry' | 'mid' | 'senior')}
                    className={`p-4 rounded-lg text-left border transition-all flex flex-col space-y-1 ${
                      selectedDifficulty === opt.value
                        ? 'border-purple-500 bg-purple-500/5'
                        : 'border-neutral-800 bg-neutral-900/30 hover:border-neutral-700'
                    }`}
                  >
                    <span className="font-bold text-white text-sm capitalize">{opt.title}</span>
                    <span className="text-xs text-neutral-400">{opt.desc}</span>
                  </button>
                ))}
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" type="button" onClick={handlePrevStep}>
                Go Back
              </Button>
              <Button type="button" className="flex items-center gap-2" onClick={handleNextStep}>
                Next Step <ArrowRight className="h-4 w-4" />
              </Button>
            </CardFooter>
          </Card>
        )}

        {/* Step 3: Interview Type Selection */}
        {step === 3 && (
          <Card className="border-neutral-800 bg-neutral-950/70">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-white">Interview Type</CardTitle>
              <CardDescription>Select the core focus module for this hiring round.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {typeOptions.map((opt) => {
                  const Icon = opt.icon;
                  const isSelected = selectedType === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => handleSelectType(opt.value as any)}
                      className={`p-4 rounded-lg text-left border transition-all flex items-start gap-3 ${
                        isSelected
                          ? 'border-purple-500 bg-purple-500/5'
                          : 'border-neutral-800 bg-neutral-900/30 hover:border-neutral-700'
                      }`}
                    >
                      <div className={`p-2 rounded ${isSelected ? 'bg-purple-600/20 text-purple-400' : 'bg-neutral-900 text-neutral-400'}`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="space-y-1">
                        <span className="font-bold text-white text-sm block">{opt.title}</span>
                        <span className="text-xs text-neutral-450 leading-snug block">{opt.desc}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" type="button" onClick={handlePrevStep}>
                Go Back
              </Button>
              <Button type="button" className="flex items-center gap-2" onClick={handleNextStep}>
                Next Step <ArrowRight className="h-4 w-4" />
              </Button>
            </CardFooter>
          </Card>
        )}

        {/* Step 4: Summary Confirmation */}
        {step === 4 && (
          <Card className="border-neutral-800 bg-neutral-950/70">
            <CardHeader className="text-center">
              <div className="mx-auto p-3 bg-purple-500/10 rounded-full w-fit text-purple-400 mb-2">
                <CheckCircle className="h-8 w-8" />
              </div>
              <CardTitle className="text-xl font-bold text-white">Confirm Setup Configurations</CardTitle>
              <CardDescription>Double-check your choices. Starting the interview initiates the evaluation loop.</CardDescription>
            </CardHeader>
            <CardContent className="divide-y divide-neutral-900 bg-neutral-900/30 border border-neutral-800 rounded-lg p-6 space-y-4">
              <div className="flex justify-between items-center pb-3">
                <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500">Target Role</span>
                <span className="text-sm font-bold text-white">{selectedRole}</span>
              </div>
              <div className="flex justify-between items-center py-3">
                <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500">Difficulty</span>
                <span className="text-sm font-bold text-white capitalize">{selectedDifficulty} Level</span>
              </div>
              <div className="flex justify-between items-center pt-3">
                <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500">Interview Focus</span>
                <span className="text-sm font-bold text-white">{selectedType}</span>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between gap-4 pt-6">
              <Button variant="outline" type="button" onClick={handlePrevStep} className="flex-1">
                Go Back
              </Button>
              <Button
                type="button"
                onClick={handleSubmit(onSubmit)}
                loading={mutation.isPending}
                className="flex-1"
              >
                Start Mock Interview
              </Button>
            </CardFooter>
          </Card>
        )}
      </div>
    </div>
  );
}
