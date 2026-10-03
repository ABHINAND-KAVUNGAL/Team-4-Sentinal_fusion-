'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';

export default function FindingsRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    async function redirect() {
      try {
        const storedId = typeof window !== 'undefined' ? localStorage.getItem('sentinel_active_case_id') : null;
        if (storedId) {
          router.replace(`/investigations/${storedId}/findings`);
          return;
        }
        const invs = await api.getInvestigations();
        if (invs && invs.length > 0) {
          router.replace(`/investigations/${invs[0].id}/findings`);
        } else {
          router.replace('/investigations');
        }
      } catch (e) {
        router.replace('/investigations');
      }
    }
    redirect();
  }, [router]);

  return (
    <div className="py-24 text-center text-xs font-mono text-foreground-subtle animate-pulse">
      Retrieving AI-assisted findings...
    </div>
  );
}
