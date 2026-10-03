'use client';

import React, { useEffect, useState } from 'react';
import {
  ShieldCheck,
  Search,
  Filter,
  RefreshCw,
  Clock,
  User,
  Layers,
  FileSearch,
  CheckCircle2,
  Lock,
} from 'lucide-react';
import { Card, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { api } from '@/lib/api';
import { AuditLog } from '@/types';

export default function AuditLogPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState<string>('ALL');

  const loadAudit = async () => {
    setLoading(true);
    try {
      const data = await api.getAuditLogs(
        undefined,
        actionFilter !== 'ALL' ? actionFilter : undefined
      );
      setLogs(data);
    } catch (err) {
      console.error('Failed to load audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAudit();
  }, [actionFilter]);

  const getActionBadge = (action: string) => {
    if (action.includes('LOGIN') || action.includes('LOGOUT')) return <Badge variant="primary">{action}</Badge>;
    if (action.includes('UPLOAD') || action.includes('PROCESS')) return <Badge variant="success">{action}</Badge>;
    if (action.includes('REVIEW')) return <Badge variant="warning">{action}</Badge>;
    if (action.includes('REPORT')) return <Badge variant="purple">{action}</Badge>;
    return <Badge variant="default">{action}</Badge>;
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/70 pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-emerald-400">
            <Lock className="w-3.5 h-3.5" />
            <span>IMMUTABLE FORENSIC INTEGRITY</span>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-foreground mt-1">
            System Chain of Custody &amp; Audit Trail
          </h1>
          <p className="text-xs text-foreground-muted mt-1">
            Tamper-evident, append-oriented log of all investigator interactions, file views, and analytical transitions.
          </p>
        </div>

        <Button
          variant="secondary"
          size="sm"
          onClick={loadAudit}
          icon={<RefreshCw className="w-3.5 h-3.5" />}
        >
          Refresh Log
        </Button>
      </div>

      {/* Filter Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {[
          'ALL',
          'LOGIN',
          'EVIDENCE_UPLOAD',
          'EVIDENCE_PROCESS',
          'EVIDENCE_VIEW',
          'FINDING_REVIEW',
          'REPORT_GENERATE',
          'CASE_CREATE',
        ].map((act) => (
          <button
            key={act}
            onClick={() => setActionFilter(act)}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-colors whitespace-nowrap ${
              actionFilter === act
                ? 'bg-blue-600/10 text-blue-400 border border-blue-500/20'
                : 'bg-surface hover:bg-surface-elevated text-foreground-muted border border-border'
            }`}
          >
            {act}
          </button>
        ))}
      </div>

      {/* Audit Log Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border/80 text-[11px] font-mono uppercase text-foreground-subtle">
                <th className="py-3 px-4">Timestamp (UTC)</th>
                <th className="py-3 px-4">Operator</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Resource Target</th>
                <th className="py-3 px-4">IP Address</th>
                <th className="py-3 px-4">Audit Payload</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50 text-xs font-mono">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-surface-elevated/40 transition-colors">
                  <td className="py-3.5 px-4 text-foreground-muted text-[11px] whitespace-nowrap">
                    {new Date(log.timestamp).toISOString().replace('T', ' ').substring(0, 19)}
                  </td>

                  <td className="py-3.5 px-4 font-sans font-medium text-foreground">
                    {log.user_email || 'System'}
                  </td>

                  <td className="py-3.5 px-4">{getActionBadge(log.action)}</td>

                  <td className="py-3.5 px-4 text-foreground-muted text-[11px]">
                    <span className="text-foreground">{log.resource_type}</span>
                    {log.resource_id && (
                      <span className="text-foreground-subtle ml-1">
                        ({log.resource_id.substring(0, 8)}...)
                      </span>
                    )}
                  </td>

                  <td className="py-3.5 px-4 text-foreground-subtle text-[11px]">
                    {log.ip_address || '127.0.0.1'}
                  </td>

                  <td className="py-3.5 px-4 text-[11px] text-slate-300 max-w-xs truncate">
                    {log.details_json || '---'}
                  </td>
                </tr>
              ))}

              {logs.length === 0 && !loading && (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-xs text-foreground-muted font-sans">
                    No audit records matching criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
