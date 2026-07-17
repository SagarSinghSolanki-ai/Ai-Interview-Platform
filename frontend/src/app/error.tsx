'use client';

import React, { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log unexpected client-side exceptions to logging console
    console.error('Client-side error boundary caught exception:', error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-neutral-950 text-neutral-100 p-6 text-center">
      <div className="p-4 bg-red-500/10 rounded-full text-red-400 mb-4">
        <AlertTriangle className="h-12 w-12" />
      </div>
      <h1 className="text-2xl font-extrabold tracking-tight text-white">Something went wrong!</h1>
      <p className="max-w-md text-neutral-400 mt-2 text-xs leading-relaxed">
        An unexpected runtime application error occurred in this workspace view.
      </p>
      <pre className="mt-4 p-3 bg-neutral-900 border border-neutral-850 rounded text-[10px] font-mono text-red-350 max-w-lg overflow-x-auto text-left whitespace-pre-wrap">
        {error.message || 'Unknown execution trace.'}
      </pre>
      <div className="flex items-center gap-4 mt-6">
        <Button variant="outline" onClick={() => (window.location.href = '/dashboard')}>
          Go to Dashboard
        </Button>
        <Button onClick={() => reset()}>
          Try Again
        </Button>
      </div>
    </div>
  );
}
