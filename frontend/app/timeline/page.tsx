'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';

export default function TimelineRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    async function redirect() {
      try {
        const storedId = typeof window !== 'undefined' ? localStorage.getItem('sentinel_active_case_id') : null;
        if (storedId) {
          router.replace(`/investigations/${storedId}/timeline`);
          return;
        }
        const invs = await api.getInvestigations();
        if (invs && invs.length > 0) {
          router.replace(`/investigations/${invs[0].id}/timeline`);
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
      Reconstructing investigation timeline...
    </div>
  );
}
