'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  FolderLock,
  FileSearch,
  Clock,
  GitBranch,
  Lightbulb,
  FileText,
  ShieldCheck,
  Settings,
  LogOut,
  Layers,
} from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { StatusDot } from '@/components/ui/StatusDot';
import { Badge } from '@/components/ui/Badge';
import { api } from '@/lib/api';

export function Sidebar({
  mobileOpen = false,
  setMobileOpen,
}: {
  mobileOpen?: boolean;
  setMobileOpen?: (open: boolean) => void;
}) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [activeCaseNumber, setActiveCaseNumber] = useState<string | null>(null);

  // If inside an investigation route (/investigations/[id]/...)
  const isCaseRoute = pathname.startsWith('/investigations/') && pathname.split('/').length > 2;
  const currentCaseId = isCaseRoute ? pathname.split('/')[2] : null;

  useEffect(() => {
    if (currentCaseId) {
      api.getInvestigation(currentCaseId)
        .then((inv) => setActiveCaseNumber(inv.case_number))
        .catch(() => setActiveCaseNumber(null));
    } else {
      setActiveCaseNumber(null);
    }
  }, [currentCaseId]);

  const navItems = [
    { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { label: 'Investigations', href: '/investigations', icon: FolderLock },
    {
      label: 'Evidence',
      href: currentCaseId ? `/investigations/${currentCaseId}/evidence` : '/evidence',
      icon: FileSearch,
      match: '/evidence',
    },
    {
      label: 'Timeline',
      href: currentCaseId ? `/investigations/${currentCaseId}/timeline` : '/timeline',
      icon: Clock,
      match: '/timeline',
    },
    {
      label: 'Intelligence Graph',
      href: currentCaseId ? `/investigations/${currentCaseId}/graph` : '/graph',
      icon: GitBranch,
      match: '/graph',
    },
    {
      label: 'AI Findings',
      href: currentCaseId ? `/investigations/${currentCaseId}/findings` : '/findings',
      icon: Lightbulb,
      match: '/findings',
    },
    {
      label: 'Reports',
      href: currentCaseId ? `/investigations/${currentCaseId}/reports` : '/reports',
      icon: FileText,
      match: '/reports',
    },
    { label: 'Audit Log', href: '/audit', icon: ShieldCheck },
    { label: 'Settings', href: '/settings', icon: Settings },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen?.(false)}
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-surface border-r border-border flex flex-col justify-between transition-transform duration-200 lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="overflow-y-auto">
          {/* Logo & Branding */}
          <div className="h-16 flex items-center justify-between px-5 border-b border-border">
            <Link href="/dashboard" className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-600/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <span className="font-semibold text-sm tracking-wide text-foreground font-mono">SENTINEL</span>
                <span className="text-xs text-blue-400 font-mono ml-1 font-semibold">FUSION</span>
              </div>
            </Link>
            <Badge variant="demo" size="sm">
              DEMO
            </Badge>
          </div>

          {/* Active Case Context Pill if inside a case */}
          {isCaseRoute && currentCaseId && (
            <div className="p-3 pb-1">
              <Link
                href={`/investigations/${currentCaseId}`}
                className="block p-2 rounded-lg bg-blue-500/5 border border-blue-500/20 hover:border-blue-500/40 transition-colors"
              >
                <div className="flex items-center justify-between text-[10px] font-mono text-blue-400 mb-0.5">
                  <span className="uppercase tracking-wider">Active Workspace</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                </div>
                <div className="text-xs font-mono font-semibold text-foreground truncate">
                  {activeCaseNumber || 'Case Active'}
                </div>
              </Link>
            </div>
          )}

          {/* Navigation Links */}
          <nav className="p-3 space-y-1">
            <div className="px-3 py-1.5 text-[10px] font-mono uppercase text-foreground-subtle tracking-wider">
              Investigation Intelligence
            </div>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isDirectActive = pathname === item.href;
              const isMatchActive = item.match && pathname.includes(item.match);
              const isActive = isDirectActive || isMatchActive;

              return (
                <Link
                  key={item.label}
                  href={item.href}
                  onClick={() => setMobileOpen?.(false)}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                    isActive
                      ? 'bg-blue-600/10 text-blue-400 border border-blue-500/20 font-semibold'
                      : 'text-foreground-muted hover:text-foreground hover:bg-surface-elevated'
                  }`}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-blue-400' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Bottom Section: System Status & User */}
        <div className="p-3 border-t border-border space-y-2 bg-surface shrink-0">
          {/* System Status Link */}
          <Link
            href="/settings"
            className="flex items-center justify-between p-2 rounded-lg bg-surface-elevated/60 border border-border text-xs text-foreground-muted hover:border-border-active transition-colors"
          >
            <div className="flex items-center gap-2">
              <StatusDot status="online" size="sm" pulse />
              <span className="font-mono text-[11px]">System Status</span>
            </div>
            <span className="text-[10px] text-emerald-400 font-mono font-semibold">OPERATIONAL</span>
          </Link>

          {/* User profile */}
          {user && (
            <div className="flex items-center justify-between px-2 py-1.5">
              <div className="flex items-center gap-2.5 overflow-hidden">
                <div className="w-7 h-7 rounded-full bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-xs font-semibold text-blue-400 shrink-0">
                  {user.full_name.charAt(0)}
                </div>
                <div className="overflow-hidden">
                  <div className="text-xs font-medium text-foreground truncate">{user.full_name}</div>
                  <div className="text-[10px] text-foreground-subtle font-mono truncate">{user.role}</div>
                </div>
              </div>
              <button
                onClick={() => logout()}
                title="Logout"
                className="text-foreground-subtle hover:text-rose-400 p-1 rounded-md transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
