'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { useAuth } from '@/components/auth-provider';
import apiClient from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ShieldAlert, Terminal } from 'lucide-react';

const loginSchema = z.object({
  email: z.string().trim().email({ message: 'Please enter a valid email address' }),
  password: z.string().min(1, { message: 'Password is required' }),
});

type LoginSchemaInput = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const { user, login } = useAuth();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [mounted, setMounted] = useState<boolean>(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // If already authenticated, bypass login and head straight to dashboard
  useEffect(() => {
    if (user) {
      router.push('/dashboard');
    }
  }, [user, router]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginSchemaInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const mutation = useMutation({
    mutationFn: async (payload: LoginSchemaInput) => {
      const response = await apiClient.post('/auth/login', payload);
      return response.data;
    },
    onSuccess: (resData) => {
      // Store user and tokens inside the auth context
      login(resData.data.user, resData.data.tokens.accessToken, resData.data.tokens.refreshToken);
      router.push('/dashboard');
    },
    onError: (error: any) => {
      setErrorMsg(error.response?.data?.message || 'Failed to authenticate. Please verify details.');
    },
  });

  const onSubmit = (data: LoginSchemaInput) => {
    setErrorMsg(null);
    mutation.mutate(data);
  };

  if (!mounted) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-neutral-950 text-neutral-400">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-purple-500 border-r-2" />
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-neutral-950 via-neutral-900 to-neutral-950 px-4">
      <Card className="w-full max-w-md border-neutral-800 bg-neutral-950/70 backdrop-blur-sm">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-extrabold tracking-tight bg-gradient-to-r from-white to-purple-400 bg-clip-text text-transparent">
            Welcome Back
          </CardTitle>
          <CardDescription>
            Enter your credentials to access your interview workspace
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            {errorMsg && (
              <Alert>
                <ShieldAlert className="h-4 w-4" />
                <AlertTitle>Authentication Failed</AlertTitle>
                <AlertDescription>{errorMsg}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email address</Label>
              <Input
                id="email"
                type="email"
                placeholder="developer@google.com"
                {...register('email')}
                className={errors.email ? 'border-red-500 focus-visible:ring-red-500' : ''}
              />
              {errors.email && <p className="text-xs text-red-500 font-medium">{errors.email.message}</p>}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
              </div>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                {...register('password')}
                className={errors.password ? 'border-red-500 focus-visible:ring-red-500' : ''}
              />
              {errors.password && <p className="text-xs text-red-500 font-medium">{errors.password.message}</p>}
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button type="submit" className="w-full" loading={mutation.isPending}>
              Sign In
            </Button>
            <p className="text-xs text-center text-neutral-400">
              New to the platform?{' '}
              <Link href="/register" className="text-purple-400 hover:text-purple-300 font-semibold underline underline-offset-4">
                Create an account
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
