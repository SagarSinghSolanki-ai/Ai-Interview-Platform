'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { HelpCircle } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-neutral-950 text-neutral-100 p-6 text-center">
      <div className="p-4 bg-purple-500/10 rounded-full text-purple-400 mb-4">
        <HelpCircle className="h-12 w-12" />
      </div>
      <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl text-white">404</h1>
      <p className="text-lg font-bold mt-2 text-neutral-200">Page Not Found</p>
      <p className="max-w-md text-neutral-400 mt-2 text-xs leading-relaxed">
        The workspace link you are trying to access does not exist or has been relocated.
      </p>
      <Link href="/dashboard" className="mt-6">
        <Button className="flex items-center gap-2">
          Return to Dashboard
        </Button>
      </Link>
    </div>
  );
}
