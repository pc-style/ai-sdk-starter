'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function Home() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const success = searchParams.get('success');
    const error = searchParams.get('error');

    if (success) {
      // Redirect to inbox after successful auth
      router.push('/inbox');
    } else if (error) {
      console.error('Auth error:', error);
    } else {
      // Check if user has accounts, otherwise redirect to inbox which will show setup
      router.push('/inbox');
    }
  }, [searchParams, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-black">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">AI Mail Client</h1>
        <p className="text-zinc-500">Loading...</p>
      </div>
    </div>
  );
}
