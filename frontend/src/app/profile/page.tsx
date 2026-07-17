'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useAuth } from '@/components/auth-provider';
import apiClient from '@/lib/api-client';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  User,
  Mail,
  Camera,
  History,
  Award,
  ArrowLeft,
  Key,
  ShieldCheck,
  CheckCircle,
  AlertTriangle,
  Loader2,
  Trash2,
} from 'lucide-react';

// Form validation schemas
const nameSchema = z.object({
  name: z.string().trim().min(2, { message: 'Name must be at least 2 characters long' }).max(50),
});

const passwordSchema = z.object({
  oldPassword: z.string().min(1, { message: 'Current password is required' }),
  newPassword: z.string().min(6, { message: 'New password must be at least 6 characters long' }),
});

type NameSchemaInput = z.infer<typeof nameSchema>;
type PasswordSchemaInput = z.infer<typeof passwordSchema>;

export default function ProfilePage() {
  const router = useRouter();
  const { user, loading, login } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Avatar state (persisted locally keyed by user ID)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  
  // Alert message states
  const [nameSuccess, setNameSuccess] = useState<string | null>(null);
  const [nameError, setNameError] = useState<string | null>(null);
  const [passSuccess, setPassSuccess] = useState<string | null>(null);
  const [passError, setPassError] = useState<string | null>(null);

  // Authentication guard
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  // Load custom avatar from local storage if it exists
  useEffect(() => {
    if (user) {
      const storedAvatar = localStorage.getItem(`avatar_${user.id}`);
      if (storedAvatar) {
        setAvatarUrl(storedAvatar);
      }
    }
  }, [user]);

  // Fetch statistics summary
  const { data: statsResponse, isLoading: statsLoading } = useQuery({
    queryKey: ['user-stats'],
    queryFn: async () => {
      const response = await apiClient.get('/users/stats');
      return response.data;
    },
    enabled: !!user,
  });

  const stats = statsResponse?.data || { totalInterviews: 0, averageScore: 0 };

  // Forms registration
  const {
    register: registerNameForm,
    handleSubmit: handleSubmitNameForm,
    formState: { errors: nameFormErrors },
    reset: resetNameForm,
  } = useForm<NameSchemaInput>({
    resolver: zodResolver(nameSchema),
    values: {
      name: user?.name || '',
    },
  });

  const {
    register: registerPassForm,
    handleSubmit: handleSubmitPassForm,
    formState: { errors: passFormErrors },
    reset: resetPassForm,
  } = useForm<PasswordSchemaInput>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      oldPassword: '',
      newPassword: '',
    },
  });

  // Name Update mutation
  const updateNameMutation = useMutation({
    mutationFn: async (data: NameSchemaInput) => {
      const response = await apiClient.put('/users/profile', data);
      return response.data;
    },
    onSuccess: (resData) => {
      setNameSuccess('Profile name updated successfully');
      setNameError(null);
      
      // Update global context session details
      const token = localStorage.getItem('accessToken') || '';
      const refreshToken = localStorage.getItem('refreshToken') || '';
      login(resData.data, token, refreshToken);
    },
    onError: (err: any) => {
      setNameError(err.response?.data?.message || 'Failed to update name');
      setNameSuccess(null);
    },
  });

  // Password Update mutation
  const changePasswordMutation = useMutation({
    mutationFn: async (data: PasswordSchemaInput) => {
      const response = await apiClient.put('/users/change-password', data);
      return response.data;
    },
    onSuccess: () => {
      setPassSuccess('Password updated successfully.');
      setPassError(null);
      resetPassForm();
    },
    onError: (err: any) => {
      setPassError(err.response?.data?.message || 'Password update failed. Please check credentials.');
      setPassSuccess(null);
    },
  });

  // Profile Picture Upload Handler (Reads local file to Base64)
  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && user) {
      if (file.size > 2 * 1024 * 1024) {
        setNameError('Image size must be less than 2MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        localStorage.setItem(`avatar_${user.id}`, base64String);
        setAvatarUrl(base64String);
        setNameSuccess('Profile picture updated successfully');
        setNameError(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveAvatar = () => {
    if (user) {
      localStorage.removeItem(`avatar_${user.id}`);
      setAvatarUrl(null);
      setNameSuccess('Profile picture reverted to default avatar');
      setNameError(null);
    }
  };

  const onSubmitName = (data: NameSchemaInput) => {
    setNameSuccess(null);
    setNameError(null);
    updateNameMutation.mutate(data);
  };

  const onSubmitPassword = (data: PasswordSchemaInput) => {
    setPassSuccess(null);
    setPassError(null);
    changePasswordMutation.mutate(data);
  };

  if (loading || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-neutral-950 text-neutral-400">
        <Loader2 className="animate-spin h-8 w-8 text-purple-500" />
      </div>
    );
  }

  // Fallback initial avatar from dicebear
  const fallbackAvatar = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user.name)}`;

  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-950 via-neutral-900 to-neutral-950 text-neutral-100 flex flex-col">
      {/* Header */}
      <header className="px-6 lg:px-12 h-16 flex items-center justify-between border-b border-neutral-800 bg-neutral-950/80 backdrop-blur-md sticky top-0 z-50">
        <Link href="/dashboard" className="text-neutral-400 hover:text-white text-xs font-semibold flex items-center gap-1.5">
          <ArrowLeft className="h-4 w-4" /> Back to Dashboard
        </Link>
        <span className="font-bold text-sm text-neutral-400">Account Settings</span>
      </header>

      {/* Main Settings Grid */}
      <main className="flex-1 p-6 lg:p-12 max-w-4xl w-full mx-auto space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Left Column: Avatar & Summary Info */}
          <div className="space-y-6 col-span-1">
            <Card className="border-neutral-850 bg-neutral-950/40 p-6 flex flex-col items-center text-center">
              <div className="relative group mt-2">
                {/* Profile Photo Frame */}
                <div className="h-28 w-28 rounded-full overflow-hidden border-2 border-neutral-800 bg-neutral-900 flex items-center justify-center shadow-inner relative">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="Profile photo" className="h-full w-full object-cover" />
                  ) : (
                    <img src={fallbackAvatar} alt="Default initials avatar" className="h-full w-full object-cover" />
                  )}
                </div>
                {/* Upload camera badge */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-0 right-0 p-2 rounded-full bg-purple-600 hover:bg-purple-500 text-white shadow-md transition-all active:scale-95 cursor-pointer"
                  title="Upload profile picture"
                >
                  <Camera className="h-4 w-4" />
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleAvatarUpload}
                  accept="image/*"
                  className="hidden"
                />
              </div>

              {avatarUrl && (
                <button
                  type="button"
                  onClick={handleRemoveAvatar}
                  className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 hover:text-red-400 mt-3 transition-colors"
                >
                  Remove Photo
                </button>
              )}

              <div className="mt-4 space-y-1">
                <h3 className="font-bold text-white text-lg">{user.name}</h3>
                <p className="text-xs text-neutral-450 flex items-center justify-center gap-1.5">
                  <Mail className="h-3.5 w-3.5" /> {user.email}
                </p>
              </div>

              {/* Stats Block */}
              <div className="grid grid-cols-2 gap-4 border-t border-neutral-900 w-full mt-6 pt-6 text-left">
                <div className="space-y-0.5">
                  <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider flex items-center gap-1">
                    <History className="h-3 w-3" /> Interviews
                  </span>
                  <p className="text-xl font-black text-white">{stats.totalInterviews}</p>
                </div>
                <div className="space-y-0.5">
                  <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider flex items-center gap-1">
                    <Award className="h-3 w-3" /> Avg Score
                  </span>
                  <p className="text-xl font-black text-purple-400">
                    {stats.averageScore ? `${stats.averageScore.toFixed(1)}%` : '—'}
                  </p>
                </div>
              </div>
            </Card>
          </div>

          {/* Right Column: Editing Forms */}
          <div className="space-y-6 col-span-1 md:col-span-2">
            {/* Card Form: Update Profile Name */}
            <Card className="border-neutral-850 bg-neutral-950/40">
              <CardHeader>
                <CardTitle className="text-sm font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-2">
                  <User className="h-4 w-4 text-purple-400" /> Personal Details
                </CardTitle>
                <CardDescription>Update your display name. Changing your name rotates your default avatar representation.</CardDescription>
              </CardHeader>
              <form onSubmit={handleSubmitNameForm(onSubmitName)}>
                <CardContent className="space-y-4">
                  {nameSuccess && (
                    <Alert className="border-green-500/20 bg-green-500/10 text-green-400">
                      <CheckCircle className="h-4 w-4 text-green-400" />
                      <AlertTitle>Profile Updated</AlertTitle>
                      <AlertDescription>{nameSuccess}</AlertDescription>
                    </Alert>
                  )}
                  {nameError && (
                    <Alert>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertTitle>Update Failed</AlertTitle>
                      <AlertDescription>{nameError}</AlertDescription>
                    </Alert>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="name">Display Name</Label>
                    <Input
                      id="name"
                      placeholder="ADA Lovelace"
                      {...registerNameForm('name')}
                      className={nameFormErrors.name ? 'border-red-500 focus-visible:ring-red-500' : ''}
                    />
                    {nameFormErrors.name && (
                      <p className="text-xs text-red-500 font-medium">{nameFormErrors.name.message}</p>
                    )}
                  </div>
                </CardContent>
                <CardFooter>
                  <Button type="submit" loading={updateNameMutation.isPending} className="ml-auto">
                    Save Changes
                  </Button>
                </CardFooter>
              </form>
            </Card>

            {/* Card Form: Change Password */}
            <Card className="border-neutral-850 bg-neutral-950/40">
              <CardHeader>
                <CardTitle className="text-sm font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-2">
                  <Key className="h-4 w-4 text-purple-400" /> Change Security Password
                </CardTitle>
                <CardDescription>Modify your account credentials. Updating password logs out active sessions on other platforms.</CardDescription>
              </CardHeader>
              <form onSubmit={handleSubmitPassForm(onSubmitPassword)}>
                <CardContent className="space-y-4">
                  {passSuccess && (
                    <Alert className="border-green-500/20 bg-green-500/10 text-green-400">
                      <CheckCircle className="h-4 w-4 text-green-400" />
                      <AlertTitle>Password Reset</AlertTitle>
                      <AlertDescription>{passSuccess}</AlertDescription>
                    </Alert>
                  )}
                  {passError && (
                    <Alert>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertTitle>Update Failed</AlertTitle>
                      <AlertDescription>{passError}</AlertDescription>
                    </Alert>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="oldPassword">Current Password</Label>
                    <Input
                      id="oldPassword"
                      type="password"
                      placeholder="••••••••"
                      {...registerPassForm('oldPassword')}
                      className={passFormErrors.oldPassword ? 'border-red-500 focus-visible:ring-red-500' : ''}
                    />
                    {passFormErrors.oldPassword && (
                      <p className="text-xs text-red-500 font-medium">{passFormErrors.oldPassword.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="newPassword">New Password</Label>
                    <Input
                      id="newPassword"
                      type="password"
                      placeholder="••••••••"
                      {...registerPassForm('newPassword')}
                      className={passFormErrors.newPassword ? 'border-red-500 focus-visible:ring-red-500' : ''}
                    />
                    {passFormErrors.newPassword && (
                      <p className="text-xs text-red-500 font-medium">{passFormErrors.newPassword.message}</p>
                    )}
                  </div>
                </CardContent>
                <CardFooter>
                  <Button type="submit" loading={changePasswordMutation.isPending} className="ml-auto">
                    Reset Password
                  </Button>
                </CardFooter>
              </form>
            </Card>
          </div>
          
        </div>
      </main>
    </div>
  );
}
