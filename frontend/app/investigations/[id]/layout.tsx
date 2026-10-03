'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useParams } from 'next/navigation';
import {
  FolderLock,
  FileSearch,
  Clock,
  GitBranch,
  Lightbulb,
  FileText,
  ShieldAlert,
  User as UserIcon,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { api } from '@/lib/api';
import { Investigation, InvestigationStatus, Priority } from '@/types';

export default function InvestigationWorkspaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const pathname = usePathname();
  const id = params?.id as string;

  const [investigation, setInvestigation] = useState<Investigation | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    if (typeof window !== 'undefined') {
      localStorage.setItem('sentinel_active_case_id', id);
    }
    async function loadCase() {
      try {
        const inv = await api.getInvestigation(id);
        setInvestigation(inv);
      } catch (err) {
        console.error('Failed to load investigation:', err);
      } finally {
        setLoading(false);
      }
    }
    loadCase();
  }, [id, pathname]);

  const handleStatusChange = async (newStatus: InvestigationStatus) => {
    if (!investigation) return;
    try {
      const updated = await api.updateInvestigation(investigation.id, { status: newStatus });
      setInvestigation((prev) => (prev ? { ...prev, status: updated.status } : null));
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  const tabs = [
    { label: 'Overview', href: `/investigations/${id}`, exact: true, icon: FolderLock },
    { label: 'Evidence', href: `/investigations/${id}/evidence`, icon: FileSearch },
    { label: 'Timeline', href: `/investigations/${id}/timeline`, icon: Clock },
    { label: 'Intelligence Graph', href: `/investigations/${id}/graph`, icon: GitBranch },
    { label: 'AI Findings', href: `/investigations/${id}/findings`, icon: Lightbulb },
    { label: 'Reports', href: `/investigations/${id}/reports`, icon: FileText },
  ];

  return (
    <div className="space-y-6">
      {/* Case Header Banner */}
      <div className="bg-surface border border-border rounded-xl p-6 shadow-sm">
        {/* Breadcrumb & Case ID */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-border/70">
          <div className="flex items-center gap-2 text-xs font-mono">
            <Link href="/investigations" className="text-foreground-subtle hover:text-foreground">
              Investigations
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-foreground-subtle" />
            <span className="text-blue-400 font-semibold">{investigation?.case_number || 'Loading...'}</span>
            {investigation?.case_number === 'SF-2026-001' && <Badge variant="demo">DEMO DATA</Badge>}
          </div>

          <div className="flex items-center gap-3">
            {/* Status Selector */}
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono text-foreground-subtle uppercase">Status:</span>
              <select
                value={investigation?.status || 'ACTIVE'}
                onChange={(e) => handleStatusChange(e.target.value as InvestigationStatus)}
                className="bg-surface-elevated border border-border text-foreground rounded-md px-2.5 py-1 text-xs font-mono focus:outline-none focus:border-blue-500"
              >
                <option value="ACTIVE">ACTIVE</option>
                <option value="REVIEW">REVIEW</option>
                <option value="CLOSED">CLOSED</option>
                <option value="DRAFT">DRAFT</option>
              </select>
            </div>

            <Badge
              variant={
                investigation?.priority === 'CRITICAL' || investigation?.priority === 'HIGH'
                  ? 'danger'
                  : 'warning'
              }
            >
              {investigation?.priority || 'MEDIUM'}
            </Badge>
          </div>
        </div>

        {/* Title and Key Metrics */}
        <div className="pt-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl md:text-2xl font-bold tracking-tight text-foreground">
              {investigation?.title || 'Loading case...'}
            </h1>
            <p className="text-xs text-foreground-muted mt-1 max-w-3xl">
              {investigation?.description}
            </p>
          </div>

          <div className="flex items-center gap-4 shrink-0 bg-surface-elevated/70 border border-border rounded-lg p-3">
            <div className="text-center px-2">
              <div className="text-xs font-mono text-foreground-subtle uppercase">Assessed Risk</div>
              <div className="text-lg font-bold font-mono text-rose-400">
                {investigation?.risk_score ?? 0} / 100
              </div>
            </div>
            <div className="w-px h-8 bg-border" />
            <div className="text-center px-2">
              <div className="text-xs font-mono text-foreground-subtle uppercase">Evidence</div>
              <div className="text-lg font-bold font-mono text-emerald-400">
                {investigation?.evidence_count ?? 0}
              </div>
            </div>
            <div className="w-px h-8 bg-border" />
            <div className="text-center px-2">
              <div className="text-xs font-mono text-foreground-subtle uppercase">Findings</div>
              <div className="text-lg font-bold font-mono text-amber-400">
                {investigation?.findings_count ?? 0}
              </div>
            </div>
          </div>
        </div>

        {/* Workspace Tab Bar */}
        <div className="mt-6 -mb-2 border-t border-border/80 flex items-center gap-1 overflow-x-auto pt-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = tab.exact ? pathname === tab.href : pathname.startsWith(tab.href);
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`flex items-center gap-2 px-3.5 py-2 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
                  isActive
                    ? 'bg-blue-600/10 text-blue-400 border border-blue-500/20'
                    : 'text-foreground-muted hover:text-foreground hover:bg-surface-elevated'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Main Tab Content */}
      <div className="min-h-[500px]">{children}</div>
    </div>
  );
}
