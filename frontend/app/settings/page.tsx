'use client';

import React, { useEffect, useState } from 'react';
import {
  Settings,
  Database,
  Server,
  HardDrive,
  Cpu,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  User,
} from 'lucide-react';
import { Card, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { StatusDot } from '@/components/ui/StatusDot';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import { SystemStatus } from '@/types';

export default function SettingsPage() {
  const { user } = useAuth();
  const [status, setStatus] = useState<SystemStatus | null>(null);
  const [loading, setLoading] = useState(true);

  const loadStatus = async () => {
    setLoading(true);
    try {
      const data = await api.getSystemStatus();
      setStatus(data);
    } catch (err) {
      console.error('Failed to load system diagnostics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStatus();
  }, []);

  return (
    <div className="space-y-6 max-w-4xl animate-in fade-in duration-200">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/70 pb-6">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground">
            System Diagnostics &amp; Settings
          </h1>
          <p className="text-xs text-foreground-muted mt-1">
            Engine health, forensic processing subsystems, and local AI provider status.
          </p>
        </div>

        <Button
          variant="secondary"
          size="sm"
          onClick={loadStatus}
          icon={<RefreshCw className="w-3.5 h-3.5" />}
        >
          Check System Health
        </Button>
      </div>

      {/* System Subsystems Status */}
      <Card>
        <CardHeader
          title="Subsystem Diagnostics"
          subtitle="Real-time operational readiness of core infrastructure"
          action={
            <Badge variant="demo" size="md">
              DEMO ENVIRONMENT
            </Badge>
          }
        />

        <div className="space-y-3 font-mono text-xs">
          {/* Database */}
          <div className="p-3.5 rounded-lg bg-surface-elevated/40 border border-border flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Database className="w-4 h-4 text-emerald-400" />
              <div>
                <div className="font-semibold text-foreground">Relational Database Engine</div>
                <div className="text-[11px] text-foreground-subtle">
                  {status?.database.details || 'Connecting...'}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <StatusDot status={status?.database.status || 'online'} />
              <span className="text-emerald-400 font-semibold">{status?.database.status || 'OPERATIONAL'}</span>
            </div>
          </div>

          {/* Backend Service */}
          <div className="p-3.5 rounded-lg bg-surface-elevated/40 border border-border flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Server className="w-4 h-4 text-blue-400" />
              <div>
                <div className="font-semibold text-foreground">FastAPI Forensic Service</div>
                <div className="text-[11px] text-foreground-subtle">
                  {status?.backend.details || 'Operational'}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <StatusDot status={status?.backend.status || 'online'} />
              <span className="text-emerald-400 font-semibold">{status?.backend.status || 'OPERATIONAL'}</span>
            </div>
          </div>

          {/* Storage Vault */}
          <div className="p-3.5 rounded-lg bg-surface-elevated/40 border border-border flex items-center justify-between">
            <div className="flex items-center gap-3">
              <HardDrive className="w-4 h-4 text-purple-400" />
              <div>
                <div className="font-semibold text-foreground">Evidence File Vault</div>
                <div className="text-[11px] text-foreground-subtle">
                  {status?.storage.details || 'Local File Storage'}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <StatusDot status={status?.storage.status || 'online'} />
              <span className="text-emerald-400 font-semibold">{status?.storage.status || 'OPERATIONAL'}</span>
            </div>
          </div>

          {/* OCR Engine */}
          <div className="p-3.5 rounded-lg bg-surface-elevated/40 border border-border flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Cpu className="w-4 h-4 text-amber-400" />
              <div>
                <div className="font-semibold text-foreground">Optical Character Recognition (OCR)</div>
                <div className="text-[11px] text-foreground-subtle">
                  {status?.ocr_engine.details || 'Checking engine...'}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <StatusDot
                status={status?.ocr_engine.status === 'AVAILABLE' ? 'online' : 'warning'}
              />
              <span
                className={
                  status?.ocr_engine.status === 'AVAILABLE'
                    ? 'text-emerald-400 font-semibold'
                    : 'text-amber-400 font-semibold'
                }
              >
                {status?.ocr_engine.status === 'AVAILABLE' ? 'OPERATIONAL' : 'OCR UNAVAILABLE'}
              </span>
            </div>
          </div>

          {/* AI Intelligence Provider */}
          <div className="p-3.5 rounded-lg bg-surface-elevated/40 border border-border flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Sparkles className="w-4 h-4 text-blue-400" />
              <div>
                <div className="font-semibold text-foreground">AI Provider Architecture</div>
                <div className="text-[11px] text-foreground-subtle">
                  {status?.ai_provider.details || 'Demo Provider (Zero Paid APIs)'}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <StatusDot status="DEMO_MODE" />
              <span className="text-blue-400 font-semibold">
                {status?.ai_provider.details?.toLowerCase().includes('ollama') ? 'LOCAL OLLAMA' : 'DEMO AI'}
              </span>
            </div>
          </div>
        </div>
      </Card>

      {/* Investigator Profile */}
      <Card>
        <CardHeader title="Operator Profile" subtitle="Active session credentials and authorization role" />
        <div className="space-y-3 font-mono text-xs">
          <div className="flex items-center justify-between py-2 border-b border-border/50">
            <span className="text-foreground-subtle">Full Name:</span>
            <span className="text-foreground font-sans font-semibold">{user?.full_name}</span>
          </div>

          <div className="flex items-center justify-between py-2 border-b border-border/50">
            <span className="text-foreground-subtle">Authorized Email:</span>
            <span className="text-foreground">{user?.email}</span>
          </div>

          <div className="flex items-center justify-between py-2 border-b border-border/50">
            <span className="text-foreground-subtle">RBAC Permission Role:</span>
            <Badge variant="primary">{user?.role || 'INVESTIGATOR'}</Badge>
          </div>

          <div className="flex items-center justify-between py-2 border-b border-border/50">
            <span className="text-foreground-subtle">User Identifier (UUID):</span>
            <span className="text-foreground-subtle text-[11px]">{user?.id}</span>
          </div>
        </div>
      </Card>

      {/* About & Architectural Principles */}
      <Card>
        <CardHeader title="About Sentinel Fusion" subtitle="Design and operational ethics" />
        <div className="space-y-3 text-xs text-foreground-muted leading-relaxed">
          <p>
            Sentinel Fusion is an AI-assisted Digital Forensics and Intelligence Fusion platform engineered with
            strict adherence to explainability, evidence integrity, and user agency.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
            <div className="p-3 rounded-lg bg-surface-elevated/40 border border-border">
              <strong className="text-foreground block mb-1">Assisted Decision Support</strong>
              AI models generate hypotheses, highlight anomalies, and extract patterns. They never determine guilt or arrest actions.
            </div>
            <div className="p-3 rounded-lg bg-surface-elevated/40 border border-border">
              <strong className="text-foreground block mb-1">Zero Paid AI Subscriptions</strong>
              Built entirely on open-source, local-first architectures with transparent deterministic fallbacks.
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
