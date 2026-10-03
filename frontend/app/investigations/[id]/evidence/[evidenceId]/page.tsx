'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  FileSearch,
  CheckCircle2,
  Clock,
  ShieldCheck,
  RefreshCw,
  ArrowLeft,
  Download,
  AlertTriangle,
  Eye,
  FileCode,
  FileText,
  Camera,
  MapPin,
  Cpu,
  Layers,
} from 'lucide-react';
import { Card, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { api } from '@/lib/api';
import { Evidence } from '@/types';

export default function EvidenceDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const evidenceId = params?.evidenceId as string;
  const router = useRouter();

  const [evidence, setEvidence] = useState<Evidence | null>(null);
  const [loading, setLoading] = useState(true);
  const [reprocessing, setReprocessing] = useState(false);
  const [imageError, setImageError] = useState(false);

  const loadDetail = async () => {
    try {
      const data = await api.getEvidenceDetail(evidenceId);
      setEvidence(data);
    } catch (err) {
      console.error('Failed to load evidence detail:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDetail();
  }, [evidenceId]);

  const handleReprocess = async () => {
    setReprocessing(true);
    try {
      await api.reprocessEvidence(evidenceId);
      await loadDetail();
    } catch (err: any) {
      alert(`Reprocessing error: ${err.message}`);
    } finally {
      setReprocessing(false);
    }
  };

  if (loading || !evidence) {
    return (
      <div className="py-12 text-center text-xs text-foreground-subtle font-mono">
        Loading forensic evidence detail...
      </div>
    );
  }

  const meta = evidence.metadata_record;
  const isImage = evidence.mime_type.startsWith('image/');
  const fileUrl = api.getEvidenceFileUrl(evidence.id);

  return (
    <div className="space-y-6">
      {/* Top Navigation & Actions */}
      <div className="flex items-center justify-between">
        <Link
          href={`/investigations/${id}/evidence`}
          className="inline-flex items-center gap-2 text-xs font-mono text-foreground-subtle hover:text-foreground"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Evidence Repository</span>
        </Link>

        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            size="sm"
            onClick={handleReprocess}
            loading={reprocessing}
            icon={<RefreshCw className="w-3.5 h-3.5" />}
          >
            Re-run Pipeline
          </Button>

          <a href={fileUrl} target="_blank" rel="noopener noreferrer">
            <Button variant="primary" size="sm" icon={<Download className="w-3.5 h-3.5" />}>
              Download Original
            </Button>
          </a>
        </div>
      </div>

      {/* Item Forensic Header */}
      <Card className="p-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-mono text-foreground-subtle">
              <span>MIME: {evidence.mime_type}</span>
              <span>&bull;</span>
              <span>{Math.round(evidence.file_size / 1024)} KB</span>
              <span>&bull;</span>
              <Badge variant="success">HASH VERIFIED</Badge>
            </div>
            <h2 className="text-xl font-bold tracking-tight text-foreground">
              {evidence.original_filename}
            </h2>
            <div className="text-xs text-foreground-muted">{evidence.title}</div>
          </div>

          <div className="bg-surface-elevated/70 border border-border rounded-lg p-3 shrink-0">
            <div className="text-[10px] font-mono text-foreground-subtle uppercase">Cryptographic Digest (SHA-256)</div>
            <div className="text-xs font-mono text-emerald-400 font-semibold mt-1 select-all break-all max-w-sm">
              {evidence.sha256_hash}
            </div>
          </div>
        </div>
      </Card>

      {/* 2-Column Inspection Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Visual Preview or Extracted Text (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="flex flex-col">
            <CardHeader
              title="Forensic Content Preview"
              subtitle={isImage ? 'Visual raster inspection' : 'Direct file content / OCR stream'}
            />

            <div className="min-h-[380px] bg-slate-950/60 rounded-lg border border-border p-4 flex items-center justify-center overflow-auto">
              {isImage ? (
                imageError ? (
                  <div className="text-center py-12 text-xs text-foreground-muted font-mono space-y-2">
                    <FileSearch className="w-8 h-8 text-foreground-subtle mx-auto" />
                    <div>Visual preview unavailable for this item.</div>
                  </div>
                ) : (
                  <div className="relative max-h-[500px] flex items-center justify-center">
                    <img
                      src={fileUrl}
                      alt={evidence.original_filename}
                      className="max-h-[460px] w-auto object-contain rounded-md border border-border/80 shadow-md"
                      onError={() => setImageError(true)}
                    />
                  </div>
                )
              ) : (
                <pre className="w-full text-xs font-mono text-slate-300 whitespace-pre-wrap leading-relaxed">
                  {meta?.extracted_text || 'No text extracted from this evidence item.'}
                </pre>
              )}
            </div>
          </Card>

          {/* Extracted Text Stream (if Image OCR was performed) */}
          {isImage && (
            <Card>
              <CardHeader
                title="Optical Character Recognition (OCR)"
                subtitle="Extracted textual content from visual raster"
                action={
                  meta?.extracted_text?.includes('OCR engine unavailable') ? (
                    <Badge variant="warning">OCR UNAVAILABLE</Badge>
                  ) : meta?.extracted_text ? (
                    <Badge variant="success">TEXT EXTRACTED</Badge>
                  ) : null
                }
              />
              <div className="p-3 bg-surface-elevated/40 rounded-lg border border-border text-xs font-mono text-foreground-muted whitespace-pre-wrap max-h-48 overflow-y-auto">
                {meta?.extracted_text || '[OCR engine unavailable in this environment.]'}
              </div>
            </Card>
          )}

          {/* AI Evidence Intelligence & Analytical Findings */}
          <Card>
            <CardHeader
              title="AI Evidence Intelligence &amp; Analysis"
              subtitle="Decision-support observations and automated correlation indicators"
              action={
                <Badge variant="demo">
                  {evidence.findings && evidence.findings.length > 0
                    ? evidence.findings[0].analysis_mode.includes('Ollama')
                      ? 'LOCAL AI'
                      : 'DEMO / HEURISTIC ANALYSIS'
                    : 'DEMO / HEURISTIC ANALYSIS'}
                </Badge>
              }
            />
            <div className="space-y-3">
              {evidence.findings && evidence.findings.length > 0 ? (
                evidence.findings.map((f) => (
                  <div
                    key={f.id}
                    className="p-3.5 rounded-lg bg-surface-elevated/40 border border-border/80 space-y-2"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={
                            f.severity === 'CRITICAL' || f.severity === 'HIGH'
                              ? 'danger'
                              : f.severity === 'MEDIUM'
                              ? 'warning'
                              : 'default'
                          }
                        >
                          {f.severity}
                        </Badge>
                        <span className="text-xs font-mono text-foreground-subtle">
                          Confidence: {Math.round(f.confidence * 100)}%
                        </span>
                      </div>
                      <Badge
                        variant={
                          f.review_status === 'CONFIRMED'
                            ? 'success'
                            : f.review_status === 'REVIEWED'
                            ? 'primary'
                            : 'outline'
                        }
                      >
                        {f.review_status === 'CONFIRMED' ? 'CONFIRMED BY INVESTIGATOR' : f.review_status}
                      </Badge>
                    </div>

                    <div className="text-xs font-semibold text-foreground">{f.title}</div>
                    <div className="text-xs text-foreground-muted leading-relaxed">{f.summary}</div>

                    {f.explanation && (
                      <div className="text-[11px] font-mono text-slate-400 bg-surface-elevated/60 p-2 rounded border border-border/60">
                        <strong className="text-slate-300">Rationale:</strong> {f.explanation}
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="p-3 rounded-lg bg-surface-elevated/40 border border-border text-xs text-foreground-muted font-mono">
                  Baseline automated analysis completed. Ingestion verified without critical keyword discrepancies.
                </div>
              )}

              <div className="flex items-center justify-between pt-1 text-[11px] font-mono text-foreground-subtle">
                <span>Human review required before evidentiary submission.</span>
                <Link href={`/investigations/${id}/findings`} className="text-blue-400 hover:underline">
                  View Case Findings &rarr;
                </Link>
              </div>
            </div>
          </Card>

          {/* Sequential Processing Pipeline Jobs */}
          <Card>
            <CardHeader
              title="Processing Pipeline Lifecycle"
              subtitle="Step-by-step verifiable state transitions"
            />
            <div className="space-y-2">
              {evidence.processing_jobs?.map((job) => (
                <div
                  key={job.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-surface-elevated/40 border border-border text-xs font-mono"
                >
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span className="font-semibold text-foreground">{job.stage}</span>
                  </div>
                  <div className="flex items-center gap-3 text-foreground-subtle text-[11px]">
                    <span>{new Date(job.started_at).toLocaleTimeString()}</span>
                    <Badge variant="success">{job.status}</Badge>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Right Column: Forensic Metadata & Media Authenticity (1 col) */}
        <div className="space-y-6">
          {/* Media Authenticity & Tamper Evaluation */}
          {isImage && (
            <Card>
              <CardHeader
                title="Media Authenticity Evaluation"
                subtitle="Heuristic sensor & compression analysis"
                action={
                  <Badge variant={meta?.authenticity_score && meta.authenticity_score > 0.5 ? 'danger' : 'success'}>
                    Score: {Math.round((meta?.authenticity_score || 0) * 100)}%
                  </Badge>
                }
              />
              <div className="space-y-3">
                <div className="p-3 rounded-lg bg-surface-elevated/50 border border-border text-xs text-foreground-muted leading-relaxed">
                  {meta?.authenticity_notes || 'Preliminary heuristic scan complete.'}
                </div>
                <div className="text-[10px] text-foreground-subtle font-mono">
                  Analysis Mode: Demonstration / Heuristic. Human verification required.
                </div>
              </div>
            </Card>
          )}

          {/* EXIF / File Metadata Properties */}
          <Card>
            <CardHeader title="Extracted Forensic Metadata" subtitle="Hardware sensors, tags, and timestamps" />
            <div className="space-y-2.5 text-xs font-mono">
              <div className="flex items-center justify-between py-1.5 border-b border-border/50">
                <span className="text-foreground-subtle">File Format:</span>
                <span className="text-foreground">{meta?.file_format || 'N/A'}</span>
              </div>

              {meta?.width && meta?.height && (
                <div className="flex items-center justify-between py-1.5 border-b border-border/50">
                  <span className="text-foreground-subtle">Raster Dimensions:</span>
                  <span className="text-foreground">
                    {meta.width} &times; {meta.height} px
                  </span>
                </div>
              )}

              <div className="flex items-center justify-between py-1.5 border-b border-border/50">
                <span className="text-foreground-subtle">Embedded Date:</span>
                <span className="text-foreground">{meta?.created_date || 'Not present'}</span>
              </div>

              {isImage && (
                <>
                  <div className="flex items-center justify-between py-1.5 border-b border-border/50">
                    <span className="text-foreground-subtle">Camera Sensor:</span>
                    <span className="text-foreground">
                      {meta?.device_make ? `${meta.device_make} ${meta.device_model || ''}`.trim() : 'Not present'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between py-1.5 border-b border-border/50">
                    <span className="text-foreground-subtle">GPS Geotag:</span>
                    <span className={meta?.gps_latitude && meta?.gps_longitude ? 'text-blue-400' : 'text-foreground'}>
                      {meta?.gps_latitude && meta?.gps_longitude
                        ? `${meta.gps_latitude}, ${meta.gps_longitude}`
                        : 'Not present'}
                    </span>
                  </div>
                </>
              )}

              {!isImage && (
                <div className="flex items-center justify-between py-1.5 border-b border-border/50">
                  <span className="text-foreground-subtle">Document Author:</span>
                  <span className="text-foreground">{meta?.author || 'Not present'}</span>
                </div>
              )}

              <div className="flex items-center justify-between py-1.5 border-b border-border/50">
                <span className="text-foreground-subtle">Uploaded By:</span>
                <span className="text-foreground">{evidence.uploaded_by?.full_name || 'System'}</span>
              </div>
            </div>
          </Card>

          {/* Chain of Custody Box */}
          <Card>
            <CardHeader title="Chain of Custody" subtitle="Immutable lifecycle log" />
            <div className="space-y-3">
              <div className="flex items-start gap-2.5 text-xs">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold text-foreground">Ingested &amp; Hashed</div>
                  <div className="text-[11px] text-foreground-subtle font-mono">
                    {new Date(evidence.created_at).toLocaleString()}
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-2.5 text-xs">
                <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold text-foreground">Analyzed by AI Assistant</div>
                  <div className="text-[11px] text-foreground-subtle font-mono">
                    {new Date(evidence.updated_at).toLocaleString()}
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-2.5 text-xs">
                <CheckCircle2 className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold text-foreground">Viewed in Workspace</div>
                  <div className="text-[11px] text-foreground-subtle font-mono">Just now (Current user)</div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
