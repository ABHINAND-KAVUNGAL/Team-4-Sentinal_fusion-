'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  Lightbulb,
  CheckCircle2,
  XCircle,
  Clock,
  ExternalLink,
  ShieldCheck,
  AlertTriangle,
  UserCheck,
  MessageSquare,
  Sparkles,
} from 'lucide-react';
import { Card, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { api } from '@/lib/api';
import { Finding, FindingSeverity, ReviewStatus } from '@/types';

export default function CaseFindingsPage() {
  const params = useParams();
  const id = params?.id as string;

  const [findings, setFindings] = useState<Finding[]>([]);
  const [loading, setLoading] = useState(true);
  const [severityFilter, setSeverityFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Review action modal
  const [selectedFinding, setSelectedFinding] = useState<Finding | null>(null);
  const [targetStatus, setTargetStatus] = useState<ReviewStatus>('CONFIRMED');
  const [reviewNotes, setReviewNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadFindings = async () => {
    try {
      const data = await api.getFindings(
        id,
        severityFilter !== 'ALL' ? (severityFilter as FindingSeverity) : undefined,
        statusFilter !== 'ALL' ? (statusFilter as ReviewStatus) : undefined
      );
      setFindings(data);
    } catch (err) {
      console.error('Failed to load findings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFindings();
  }, [id, severityFilter, statusFilter]);

  const openReviewModal = (finding: Finding, status: ReviewStatus) => {
    setSelectedFinding(finding);
    setTargetStatus(status);
    setReviewNotes(finding.review_notes || '');
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFinding) return;
    setSubmitting(true);
    try {
      await api.reviewFinding(selectedFinding.id, targetStatus, reviewNotes.trim() || undefined);
      setSelectedFinding(null);
      setReviewNotes('');
      loadFindings();
    } catch (err: any) {
      alert(`Review error: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Filter Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-foreground">
            AI-Assisted Findings &amp; Hypotheses
          </h2>
          <p className="text-xs text-foreground-muted mt-0.5">
            Automated correlation indicators. Human verification required before evidentiary confirmation.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="bg-surface border border-border rounded-lg px-3 py-1.5 text-xs text-foreground focus:outline-none focus:border-blue-500 font-mono"
          >
            <option value="ALL">All Severities</option>
            <option value="CRITICAL">Critical</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-surface border border-border rounded-lg px-3 py-1.5 text-xs text-foreground focus:outline-none focus:border-blue-500 font-mono"
          >
            <option value="ALL">All Review Statuses</option>
            <option value="NEW">New (Unreviewed)</option>
            <option value="REVIEWED">Reviewed</option>
            <option value="CONFIRMED">Confirmed by Investigator</option>
            <option value="DISMISSED">Dismissed</option>
          </select>
        </div>
      </div>

      {/* Findings List */}
      <div className="space-y-4">
        {findings.map((f) => (
          <Card key={f.id} className="p-5 space-y-4">
            {/* Finding Top Row */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-border/60">
              <div className="flex items-center gap-2.5">
                <Badge
                  variant={
                    f.severity === 'CRITICAL' || f.severity === 'HIGH' ? 'danger' : 'warning'
                  }
                >
                  {f.severity}
                </Badge>

                <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-surface-elevated text-[11px] font-mono text-foreground-subtle border border-border">
                  <span>Confidence:</span>
                  <span className="text-foreground font-semibold">
                    {Math.round(f.confidence * 100)}%
                  </span>
                </div>

                <Badge
                  variant={
                    f.review_status === 'CONFIRMED'
                      ? 'success'
                      : f.review_status === 'DISMISSED'
                      ? 'outline'
                      : f.review_status === 'REVIEWED'
                      ? 'primary'
                      : 'default'
                  }
                >
                  {f.review_status === 'CONFIRMED'
                    ? 'CONFIRMED BY INVESTIGATOR'
                    : f.review_status}
                </Badge>
              </div>

              <div className="flex items-center gap-2 text-[11px] font-mono text-foreground-subtle">
                <span className="text-blue-400">{f.analysis_mode}</span>
                <span>&bull;</span>
                <span>{new Date(f.created_at).toLocaleDateString()}</span>
              </div>
            </div>

            {/* Finding Title & Content */}
            <div className="space-y-2">
              <h3 className="text-sm md:text-base font-semibold text-foreground">{f.title}</h3>
              <p className="text-xs text-foreground-muted leading-relaxed">{f.summary}</p>
            </div>

            {/* Explanation & Reasoning */}
            {f.explanation && (
              <div className="p-3 rounded-lg bg-surface-elevated/40 border border-border/80 text-xs text-foreground-muted font-mono leading-relaxed">
                <strong className="text-slate-300">Analytical Rationale:</strong> {f.explanation}
              </div>
            )}

            {/* Human Review Notes if confirmed/reviewed */}
            {f.review_notes && (
              <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300 font-mono">
                <strong>Investigator Verification Notes:</strong> {f.review_notes}
              </div>
            )}

            {/* Bottom Actions & Deep Links */}
            <div className="pt-3 border-t border-border/60 flex flex-wrap items-center justify-between gap-3">
              {f.evidence_id ? (
                <Link
                  href={`/investigations/${id}/evidence/${f.evidence_id}`}
                  className="inline-flex items-center gap-1.5 text-xs font-mono text-blue-400 hover:underline"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Inspect Source Evidence: {f.evidence_title || 'Linked File'}</span>
                </Link>
              ) : (
                <span className="text-xs font-mono text-foreground-subtle">
                  Cross-evidence multi-source synthesis
                </span>
              )}

              {/* Review Buttons */}
              <div className="flex items-center gap-2">
                {f.review_status !== 'CONFIRMED' && (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => openReviewModal(f, 'CONFIRMED')}
                    icon={<UserCheck className="w-3.5 h-3.5" />}
                  >
                    Confirm Finding
                  </Button>
                )}

                {f.review_status !== 'REVIEWED' && f.review_status !== 'CONFIRMED' && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => openReviewModal(f, 'REVIEWED')}
                    icon={<Clock className="w-3.5 h-3.5" />}
                  >
                    Mark Reviewed
                  </Button>
                )}

                {f.review_status !== 'DISMISSED' && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openReviewModal(f, 'DISMISSED')}
                    icon={<XCircle className="w-3.5 h-3.5" />}
                  >
                    Dismiss
                  </Button>
                )}
              </div>
            </div>
          </Card>
        ))}

        {findings.length === 0 && !loading && (
          <div className="text-center py-12 text-xs text-foreground-muted">
            No findings recorded in this category.
          </div>
        )}
      </div>

      {/* Investigator Review Modal */}
      <Modal
        isOpen={!!selectedFinding}
        onClose={() => setSelectedFinding(null)}
        title="Investigator Finding Verification"
        subtitle={`Record human verification action: ${targetStatus}`}
      >
        <form onSubmit={handleReviewSubmit} className="space-y-4">
          <div className="p-3 rounded-lg bg-surface-elevated border border-border text-xs">
            <span className="font-semibold text-foreground">{selectedFinding?.title}</span>
            <p className="text-foreground-muted mt-1">{selectedFinding?.summary}</p>
          </div>

          <div>
            <label className="block text-xs font-medium text-foreground-muted mb-1.5">
              Target Verification Status
            </label>
            <select
              value={targetStatus}
              onChange={(e) => setTargetStatus(e.target.value as ReviewStatus)}
              className="w-full bg-surface-elevated border border-border rounded-lg px-3 py-2 text-xs text-foreground focus:outline-none focus:border-blue-500 font-mono"
            >
              <option value="CONFIRMED">CONFIRMED BY INVESTIGATOR</option>
              <option value="REVIEWED">REVIEWED</option>
              <option value="DISMISSED">DISMISSED</option>
              <option value="NEW">RESET TO NEW</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-foreground-muted mb-1.5">
              Investigator Review Notes &amp; Corroboration Summary
            </label>
            <textarea
              rows={3}
              placeholder="e.g. Corroborated with bank records and surveillance photos..."
              value={reviewNotes}
              onChange={(e) => setReviewNotes(e.target.value)}
              className="w-full bg-surface-elevated border border-border rounded-lg px-3 py-2 text-xs text-foreground focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-border">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setSelectedFinding(null)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              loading={submitting}
              icon={<CheckCircle2 className="w-4 h-4" />}
            >
              Submit Human Review
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
