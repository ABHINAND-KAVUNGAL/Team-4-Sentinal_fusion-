'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldCheck, Lock, Mail, ArrowRight, AlertCircle, Key } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useAuth } from '@/lib/auth';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();

  const [email, setEmail] = useState('demo@sentinelfusion.local');
  const [password, setPassword] = useState('Password123!');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await login(email, password);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickFill = (roleEmail: string) => {
    setEmail(roleEmail);
    setPassword('Password123!');
    setError(null);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center items-center p-6">
      <div className="w-full max-w-md space-y-6">
        {/* Header Branding */}
        <div className="text-center space-y-2">
          <div className="inline-flex w-12 h-12 rounded-xl bg-blue-600/10 border border-blue-500/30 items-center justify-center text-blue-400 mb-2">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Sentinel Fusion
          </h1>
          <p className="text-xs text-foreground-muted">
            Digital Forensics &amp; Intelligence Fusion Workspace
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-surface border border-border rounded-xl p-6 shadow-xl space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-border/80">
            <span className="text-xs font-mono text-foreground-subtle uppercase">Secure Portal Access</span>
            <Badge variant="demo" size="sm">
              DEMO ENVIRONMENT
            </Badge>
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-start gap-2.5 text-xs text-rose-300">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-foreground-muted mb-1.5">
                Investigator Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-foreground-subtle absolute left-3 top-2.5" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="demo@sentinelfusion.local"
                  className="w-full bg-surface-elevated border border-border rounded-lg pl-9 pr-3 py-2 text-xs text-foreground placeholder:text-foreground-subtle focus:outline-none focus:border-blue-500 transition-colors font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-foreground-muted mb-1.5">
                Passphrase
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-foreground-subtle absolute left-3 top-2.5" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full bg-surface-elevated border border-border rounded-lg pl-9 pr-3 py-2 text-xs text-foreground placeholder:text-foreground-subtle focus:outline-none focus:border-blue-500 transition-colors font-mono"
                />
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="md"
              loading={loading}
              className="w-full justify-center"
              icon={<ArrowRight className="w-4 h-4" />}
            >
              Sign In to Platform
            </Button>
          </form>

          {/* Quick-fill Demo Profiles */}
          <div className="pt-4 border-t border-border/80 space-y-2.5">
            <div className="text-[11px] font-mono text-foreground-subtle uppercase flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-blue-400" />
                <span>Quick-Fill Demo Persona:</span>
              </span>
              <span className="text-[10px] text-foreground-subtle">Pass: Password123!</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleQuickFill('demo@sentinelfusion.local')}
                className="p-2.5 rounded-lg bg-surface-elevated hover:bg-surface-hover border border-blue-500/30 text-left transition-colors"
              >
                <div className="text-[11px] font-semibold text-blue-400 flex items-center justify-between">
                  <span>Demo Persona</span>
                  <Badge variant="demo" size="sm">DEFAULT</Badge>
                </div>
                <div className="text-[10px] text-foreground-muted font-mono truncate">demo@sentinelfusion.local</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickFill('lead.investigator@sentinel.local')}
                className="p-2.5 rounded-lg bg-surface-elevated hover:bg-surface-hover border border-border text-left transition-colors"
              >
                <div className="text-[11px] font-semibold text-foreground">Sarah Lin</div>
                <div className="text-[10px] text-blue-400 font-mono">Lead Investigator</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickFill('analyst@sentinel.local')}
                className="p-2.5 rounded-lg bg-surface-elevated hover:bg-surface-hover border border-border text-left transition-colors"
              >
                <div className="text-[11px] font-semibold text-foreground">Marcus Vance</div>
                <div className="text-[10px] text-indigo-400 font-mono">Senior Analyst</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickFill('admin@sentinel.local')}
                className="p-2.5 rounded-lg bg-surface-elevated hover:bg-surface-hover border border-border text-left transition-colors"
              >
                <div className="text-[11px] font-semibold text-foreground">SysAdmin</div>
                <div className="text-[10px] text-amber-400 font-mono">Administrator</div>
              </button>
            </div>
          </div>
        </div>

        {/* Security Notice */}
        <p className="text-center text-[11px] text-foreground-subtle font-mono">
          Authorized personnel only. All access events are cryptographically audited.
        </p>
      </div>
    </div>
  );
}
