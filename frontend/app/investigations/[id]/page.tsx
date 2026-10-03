'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ShieldAlert,
  Users,
  FileSearch,
  GitBranch,
  FileText,
  Clock,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Lightbulb,
} from 'lucide-react';
import { Card, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { api } from '@/lib/api';
import { Investigation, RiskAssessment } from '@/types';

export default function InvestigationOverviewPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [investigation, setInvestigation] = useState<Investigation | null>(null);
  const [risk, setRisk] = useState<RiskAssessment | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [inv, rsk] = await Promise.all([
          api.getInvestigation(id),
          api.getRiskAssessment(id).catch(() => null),
        ]);
        setInvestigation(inv);
        setRisk(rsk);
      } catch (err) {
        console.error('Failed to load overview:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [id]);

  if (loading || !investigation) {
    return (
      <div className="py-12 text-center text-xs text-foreground-subtle font-mono">
        Loading case intelligence overview...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 2-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Scope & Risk Breakdown */}
        <div className="lg:col-span-2 space-y-6">
          {/* Executive Briefing Card */}
          <Card>
            <CardHeader
              title="Executive Intelligence Briefing"
              subtitle="Case mandate, scope, and investigative context"
            />
            <div className="space-y-4">
              <p className="text-xs text-foreground leading-relaxed">
                {investigation.description ||
                  'No detailed case description has been entered for this investigation.'}
              </p>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-3 border-t border-border/60">
                <div className="p-3 rounded-lg bg-surface-elevated/40 border border-border">
                  <div className="text-[10px] font-mono text-foreground-subtle uppercase">Case Number</div>
                  <div className="text-xs font-mono font-semibold text-blue-400 mt-1">
                    {investigation.case_number}
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-surface-elevated/40 border border-border">
                  <div className="text-[10px] font-mono text-foreground-subtle uppercase">Lead Investigator</div>
                  <div className="text-xs font-semibold text-foreground mt-1 truncate">
                    {investigation.lead_investigator?.full_name || 'Unassigned'}
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-surface-elevated/40 border border-border">
                  <div className="text-[10px] font-mono text-foreground-subtle uppercase">Created Date</div>
                  <div className="text-xs font-mono text-foreground mt-1">
                    {new Date(investigation.created_at).toLocaleDateString()}
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-surface-elevated/40 border border-border">
                  <div className="text-[10px] font-mono text-foreground-subtle uppercase">Custody Integrity</div>
                  <div className="text-xs font-semibold text-emerald-400 mt-1 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Verified</span>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Explainable Risk Assessment */}
          <Card>
            <CardHeader
              title="Assessed Investigative Risk Factors"
              subtitle="Transparent, heuristic-weighted score calculation"
              action={
                <Badge variant={risk?.risk_tier === 'CRITICAL' || risk?.risk_tier === 'HIGH' ? 'danger' : 'warning'}>
                  {risk?.risk_tier || 'MODERATE'} ({risk?.overall_score || 0}/100)
                </Badge>
              }
            />

            <div className="space-y-4">
              <div className="p-3 rounded-lg bg-surface-elevated/50 border border-border flex items-center justify-between text-xs font-mono">
                <span className="text-foreground-muted">Model Mode:</span>
                <span className="text-blue-400 font-semibold">{risk?.assessment_mode || 'HEURISTIC_EXPLAINABLE'}</span>
              </div>

              <div className="space-y-3">
                {risk?.factors?.map((factor, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-lg bg-surface-elevated/30 border border-border/70 space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-foreground">{factor.name}</span>
                      <span className="text-xs font-mono font-bold text-rose-400">
                        +{factor.score} / {factor.weight} pts
                      </span>
                    </div>
                    <p className="text-xs text-foreground-muted">{factor.description}</p>
                  </div>
                ))}

                {(!risk?.factors || risk.factors.length === 0) && (
                  <div className="text-center py-6 text-xs text-foreground-subtle">
                    No risk factor triggers recorded yet.
                  </div>
                )}
              </div>

              <div className="p-3 rounded-lg bg-slate-900/50 border border-border text-[11px] text-foreground-subtle">
                <strong className="text-slate-300">Human Verification Requirement:</strong> Risk scores are
                derived from deterministic heuristic weights across corroborated findings, entity density, and
                tamper markers. They are designed for investigative triage and do not constitute legal determinations.
              </div>
            </div>
          </Card>
        </div>

        {/* Right Column: Quick Navigation & Members */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <Card>
            <CardHeader title="Investigative Workflows" subtitle="Jump directly to inquiry modules" />
            <div className="space-y-2">
              <Link href={`/investigations/${id}/evidence`}>
                <div className="p-3 rounded-lg bg-surface-elevated/50 hover:bg-surface-elevated border border-border hover:border-border-active transition-colors flex items-center justify-between group">
                  <div className="flex items-center gap-3">
                    <FileSearch className="w-4 h-4 text-emerald-400" />
                    <div>
                      <div className="text-xs font-medium text-foreground">Evidence Vault</div>
                      <div className="text-[10px] text-foreground-subtle">Inspect hashes &amp; EXIF</div>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-foreground-subtle group-hover:text-foreground group-hover:translate-x-0.5 transition-all" />
                </div>
              </Link>

              <Link href={`/investigations/${id}/graph`}>
                <div className="p-3 rounded-lg bg-surface-elevated/50 hover:bg-surface-elevated border border-border hover:border-border-active transition-colors flex items-center justify-between group">
                  <div className="flex items-center gap-3">
                    <GitBranch className="w-4 h-4 text-blue-400" />
                    <div>
                      <div className="text-xs font-medium text-foreground">Intelligence Graph</div>
                      <div className="text-[10px] text-foreground-subtle">Explore entity correlations</div>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-foreground-subtle group-hover:text-foreground group-hover:translate-x-0.5 transition-all" />
                </div>
              </Link>

              <Link href={`/investigations/${id}/findings`}>
                <div className="p-3 rounded-lg bg-surface-elevated/50 hover:bg-surface-elevated border border-border hover:border-border-active transition-colors flex items-center justify-between group">
                  <div className="flex items-center gap-3">
                    <Lightbulb className="w-4 h-4 text-amber-400" />
                    <div>
                      <div className="text-xs font-medium text-foreground">AI Findings Review</div>
                      <div className="text-[10px] text-foreground-subtle">Verify or dismiss hypotheses</div>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-foreground-subtle group-hover:text-foreground group-hover:translate-x-0.5 transition-all" />
                </div>
              </Link>

              <Link href={`/investigations/${id}/reports`}>
                <div className="p-3 rounded-lg bg-surface-elevated/50 hover:bg-surface-elevated border border-border hover:border-border-active transition-colors flex items-center justify-between group">
                  <div className="flex items-center gap-3">
                    <FileText className="w-4 h-4 text-purple-400" />
                    <div>
                      <div className="text-xs font-medium text-foreground">Generate Dossier</div>
                      <div className="text-[10px] text-foreground-subtle">Export PDF / JSON report</div>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-foreground-subtle group-hover:text-foreground group-hover:translate-x-0.5 transition-all" />
                </div>
              </Link>
            </div>
          </Card>

          {/* Assigned Investigation Team */}
          <Card>
            <CardHeader title="Assigned Investigators" subtitle="Active case team members" />
            <div className="space-y-3">
              {investigation.members?.map((member) => (
                <div key={member.id} className="flex items-center justify-between p-2 rounded-lg bg-surface-elevated/40">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-blue-600/20 text-blue-400 font-semibold text-xs flex items-center justify-center">
                      {member.user.full_name.charAt(0)}
                    </div>
                    <div>
                      <div className="text-xs font-medium text-foreground">{member.user.full_name}</div>
                      <div className="text-[10px] text-foreground-subtle font-mono">{member.role_in_case}</div>
                    </div>
                  </div>
                  <Badge variant="outline" size="sm">
                    {member.user.role}
                  </Badge>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
