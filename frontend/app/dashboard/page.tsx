'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  FolderLock,
  FileSearch,
  Lightbulb,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  Activity,
  Clock,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { StatusDot } from '@/components/ui/StatusDot';
import { api } from '@/lib/api';
import { Investigation, Finding, Evidence, AuditLog } from '@/types';

export default function DashboardPage() {
  const [investigations, setInvestigations] = useState<Investigation[]>([]);
  const [recentFindings, setRecentFindings] = useState<Finding[]>([]);
  const [recentEvidence, setRecentEvidence] = useState<Evidence[]>([]);
  const [recentAudit, setRecentAudit] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboard() {
      try {
        const invs = await api.getInvestigations();
        setInvestigations(invs);

        if (invs.length > 0) {
          const mainCaseId = invs[0].id;
          const [findings, evs, audit] = await Promise.all([
            api.getFindings(mainCaseId).catch(() => []),
            api.getEvidence(mainCaseId).catch(() => []),
            api.getAuditLogs().catch(() => []),
          ]);
          setRecentFindings(findings.slice(0, 4));
          setRecentEvidence(evs.slice(0, 4));
          setRecentAudit(audit.slice(0, 5));
        }
      } catch (err) {
        console.error('Failed to load dashboard:', err);
      } finally {
        setLoading(false);
      }
    }
    loadDashboard();
  }, []);

  const totalEvidenceCount = investigations.reduce((acc, inv) => acc + (inv.evidence_count || 0), 0);
  const totalFindingsCount = investigations.reduce((acc, inv) => acc + (inv.findings_count || 0), 0);
  const activeCasesCount = investigations.filter((inv) => inv.status === 'ACTIVE').length;
  const highPriorityCount = investigations.filter((inv) => inv.priority === 'HIGH' || inv.priority === 'CRITICAL').length;

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/70 pb-6">
        <div>
          <div className="flex items-center gap-2 text-[11px] font-mono uppercase tracking-wider text-blue-400">
            <span>Investigation Intelligence</span>
            <span>&bull;</span>
            <span>Sentinel Fusion</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground mt-1">
            Connect evidence. Understand relationships. Investigate with clarity.
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/investigations?create=true">
            <Button variant="primary" size="sm" icon={<FolderLock className="w-4 h-4" />}>
              New Investigation
            </Button>
          </Link>
        </div>
      </div>

      {/* 4 Primary Operational Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 bg-surface">
          <div className="flex items-center justify-between text-foreground-subtle mb-2">
            <span className="text-xs font-mono uppercase">Active Cases</span>
            <FolderLock className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-3xl font-bold font-mono text-foreground">{activeCasesCount}</div>
          <p className="text-[11px] text-foreground-subtle mt-1.5 flex items-center gap-1.5">
            <StatusDot status="online" size="sm" />
            <span>Currently under active inquiry</span>
          </p>
        </Card>

        <Card className="p-4 bg-surface">
          <div className="flex items-center justify-between text-foreground-subtle mb-2">
            <span className="text-xs font-mono uppercase">Evidence Items</span>
            <FileSearch className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-3xl font-bold font-mono text-foreground">{totalEvidenceCount}</div>
          <p className="text-[11px] text-foreground-subtle mt-1.5">
            SHA-256 byte-verified integrity
          </p>
        </Card>

        <Card className="p-4 bg-surface">
          <div className="flex items-center justify-between text-foreground-subtle mb-2">
            <span className="text-xs font-mono uppercase">AI Findings</span>
            <Lightbulb className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-3xl font-bold font-mono text-foreground">{totalFindingsCount}</div>
          <p className="text-[11px] text-foreground-subtle mt-1.5">
            Requiring investigator verification
          </p>
        </Card>

        <Card className="p-4 bg-surface">
          <div className="flex items-center justify-between text-foreground-subtle mb-2">
            <span className="text-xs font-mono uppercase">High Priority</span>
            <AlertTriangle className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-3xl font-bold font-mono text-rose-400">{highPriorityCount}</div>
          <p className="text-[11px] text-foreground-subtle mt-1.5">
            Elevated risk threshold identified
          </p>
        </Card>
      </div>

      {/* Main Grid: Recent Investigations & Priority Findings */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Recent Investigations (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader
              title="Recent Investigations"
              subtitle="Active inquiry workspaces and cross-evidence dossiers"
              action={
                <Link href="/investigations">
                  <Button variant="ghost" size="sm">
                    View All ({investigations.length})
                  </Button>
                </Link>
              }
            />

            <div className="space-y-3">
              {investigations.map((inv) => (
                <Link key={inv.id} href={`/investigations/${inv.id}`}>
                  <div className="p-4 rounded-lg bg-surface-elevated/60 hover:bg-surface-elevated border border-border hover:border-border-active transition-all group">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono text-blue-400 font-semibold">{inv.case_number}</span>
                          <span className="text-xs text-foreground-subtle">&bull;</span>
                          <Badge variant={inv.status === 'ACTIVE' ? 'primary' : 'default'}>{inv.status}</Badge>
                          <Badge variant={inv.priority === 'HIGH' || inv.priority === 'CRITICAL' ? 'danger' : 'warning'}>
                            {inv.priority}
                          </Badge>
                        </div>
                        <h4 className="text-sm font-semibold text-foreground group-hover:text-blue-400 transition-colors mt-1">
                          {inv.title}
                        </h4>
                        <p className="text-xs text-foreground-muted mt-1 line-clamp-1">{inv.description}</p>
                      </div>

                      <div className="text-right shrink-0">
                        <div className="text-xs font-mono font-semibold text-rose-400">
                          Risk: {inv.risk_score}/100
                        </div>
                        <div className="text-[11px] text-foreground-subtle font-mono mt-1">
                          {inv.evidence_count} Evidence &bull; {inv.findings_count} Findings
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}

              {investigations.length === 0 && (
                <div className="text-center py-10 text-xs text-foreground-muted">
                  No active investigations found. Create an inquiry to start ingesting evidence.
                </div>
              )}
            </div>
          </Card>

          {/* Evidence Processing Stream */}
          <Card>
            <CardHeader
              title="Evidence Processing Stream"
              subtitle="Live status across byte hashing, EXIF inspection, and text extraction"
            />
            <div className="space-y-3">
              {recentEvidence.map((ev) => (
                <div
                  key={ev.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-surface-elevated/40 border border-border/70"
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-slate-300 shrink-0 font-mono text-xs">
                      {ev.original_filename.split('.').pop()?.toUpperCase()}
                    </div>
                    <div className="overflow-hidden">
                      <div className="text-xs font-medium text-foreground truncate">{ev.original_filename}</div>
                      <div className="text-[11px] text-foreground-subtle font-mono truncate">
                        SHA-256: {ev.sha256_hash.substring(0, 16)}...
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <Badge variant="success">COMPLETE</Badge>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Right Column: Priority AI Findings & Audit (1 col) */}
        <div className="space-y-6">
          {/* Priority Findings */}
          <Card>
            <CardHeader
              title="Priority AI Findings"
              subtitle="Heuristic decision-support indicators"
            />
            <div className="space-y-3">
              {recentFindings.map((f) => (
                <div key={f.id} className="p-3 rounded-lg bg-surface-elevated/60 border border-border space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Badge variant={f.severity === 'CRITICAL' || f.severity === 'HIGH' ? 'danger' : 'warning'}>
                      {f.severity}
                    </Badge>
                    <span className="text-[10px] font-mono text-foreground-subtle">
                      Conf: {Math.round(f.confidence * 100)}%
                    </span>
                  </div>
                  <h5 className="text-xs font-semibold text-foreground line-clamp-2">{f.title}</h5>
                  <p className="text-[11px] text-foreground-muted line-clamp-2">{f.summary}</p>
                  <div className="pt-1 flex items-center justify-between text-[10px] font-mono text-foreground-subtle border-t border-border/50">
                    <span>Status: {f.review_status}</span>
                    <span className="text-blue-400">DEMO_ANALYSIS</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Recent Audit Activity */}
          <Card>
            <CardHeader
              title="Chain of Custody & Audit"
              subtitle="Append-only immutable record"
              action={
                <Link href="/audit">
                  <Button variant="ghost" size="sm">
                    View Log
                  </Button>
                </Link>
              }
            />
            <div className="space-y-2.5">
              {recentAudit.map((log) => (
                <div key={log.id} className="text-xs flex items-start gap-2.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5 shrink-0" />
                  <div className="overflow-hidden">
                    <span className="font-mono text-[10px] text-foreground-subtle block">
                      {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} &bull; {log.action}
                    </span>
                    <span className="text-foreground-muted text-[11px] truncate block">
                      {log.user_email} &bull; {log.resource_type}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
