'use client';

import React, { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { useAuth } from '@/lib/auth';

export function Shell({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading } = useAuth();

  // Exclude shell on landing page (/) and login (/login)
  const isPublicPage = pathname === '/' || pathname === '/login';

  useEffect(() => {
    if (!loading && !user && !isPublicPage) {
      router.replace('/login');
    }
  }, [loading, user, isPublicPage, router]);

  if (isPublicPage) {
    return <>{children}</>;
  }

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-6 h-6 border-2 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
          <span className="text-xs font-mono text-foreground-subtle tracking-wider uppercase">
            {loading ? 'Loading Sentinel Core...' : 'Redirecting to Secure Portal...'}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex">
      <Sidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
        <Topbar onMenuClick={() => setMobileOpen(true)} />
        <main className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto">{children}</main>
      </div>
    </div>
  );
}
