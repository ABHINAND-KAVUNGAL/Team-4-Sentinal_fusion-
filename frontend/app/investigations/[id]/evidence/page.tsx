'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  UploadCloud,
  FileSearch,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileText,
  Image as ImageIcon,
  FileCode,
  ShieldCheck,
  RefreshCw,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';
import { Card, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { api } from '@/lib/api';
import { Evidence } from '@/types';

export default function CaseEvidencePage() {
  const params = useParams();
  const id = params?.id as string;
  const router = useRouter();

  const [evidenceList, setEvidenceList] = useState<Evidence[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadEvidence = async () => {
    try {
      const data = await api.getEvidence(id);
      setEvidenceList(data);
    } catch (err) {
      console.error('Failed to load evidence:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEvidence();
  }, [id]);

  const handleFiles = async (files: FileList | File[]) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    setUploadSuccess(null);
    try {
      const fileArr = Array.from(files);
      const uploaded = await api.uploadEvidence(id, fileArr);
      setUploadSuccess(`Successfully ingested ${uploaded.length} file(s) into vault and ran pipeline.`);
      loadEvidence();
    } catch (err: any) {
      alert(`Upload error: ${err.message || 'Failed to upload files'}`);
    } finally {
      setUploading(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const getFileIcon = (mime: string) => {
    if (mime.startsWith('image/')) return <ImageIcon className="w-4 h-4 text-blue-400" />;
    if (mime.includes('pdf')) return <FileText className="w-4 h-4 text-rose-400" />;
    if (mime.includes('csv') || mime.includes('json') || mime.includes('text')) {
      return <FileCode className="w-4 h-4 text-emerald-400" />;
    }
    return <FileSearch className="w-4 h-4 text-slate-400" />;
  };

  return (
    <div className="space-y-6">
      {/* Upload Zone Card */}
      <Card>
        <CardHeader
          title="Evidence Ingestion Vault"
          subtitle="Drag & drop evidence files for automated SHA-256 hashing, EXIF extraction, and NLP analysis."
        />

        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
            dragActive
              ? 'border-blue-500 bg-blue-500/10'
              : 'border-border hover:border-border-active bg-surface-elevated/30 hover:bg-surface-elevated/50'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={(e) => e.target.files && handleFiles(e.target.files)}
          />

          <div className="flex flex-col items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <UploadCloud className="w-6 h-6" />
            </div>
            <div>
              <div className="text-sm font-semibold text-foreground">
                {uploading ? 'Processing Evidence Pipeline...' : 'Select or drop forensic evidence files'}
              </div>
              <p className="text-xs text-foreground-muted mt-1">
                Images (JPEG, PNG, TIFF), Documents (PDF, DOCX), Data (CSV, JSON, TXT, LOG)
              </p>
            </div>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              loading={uploading}
              icon={<FileSearch className="w-4 h-4" />}
            >
              Browse Local Files
            </Button>
          </div>
        </div>

        {uploadSuccess && (
          <div className="mt-3 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{uploadSuccess}</span>
          </div>
        )}
      </Card>

      {/* Evidence Repository Inventory */}
      <Card>
        <CardHeader
          title={`Evidence Repository (${evidenceList.length})`}
          subtitle="Cryptographically verified items in chain of custody"
          action={
            <Button variant="ghost" size="sm" onClick={loadEvidence} icon={<RefreshCw className="w-3.5 h-3.5" />}>
              Refresh
            </Button>
          }
        />

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border/80 text-[11px] font-mono uppercase text-foreground-subtle">
                <th className="py-3 px-4">Item Name</th>
                <th className="py-3 px-4">Format / Size</th>
                <th className="py-3 px-4">SHA-256 Digest</th>
                <th className="py-3 px-4">Pipeline Stage</th>
                <th className="py-3 px-4">Ingested At</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50 text-xs">
              {evidenceList.map((ev) => (
                <tr key={ev.id} className="hover:bg-surface-elevated/40 transition-colors group">
                  <td className="py-3.5 px-4 font-medium text-foreground">
                    <div className="flex items-center gap-2.5">
                      {getFileIcon(ev.mime_type)}
                      <div>
                        <div className="font-semibold text-foreground group-hover:text-blue-400 transition-colors">
                          {ev.original_filename}
                        </div>
                        <div className="text-[11px] text-foreground-subtle">{ev.title}</div>
                      </div>
                    </div>
                  </td>

                  <td className="py-3.5 px-4 font-mono text-foreground-muted">
                    <div>{ev.mime_type.split('/').pop()?.toUpperCase()}</div>
                    <div className="text-[11px] text-foreground-subtle">
                      {Math.round(ev.file_size / 1024)} KB
                    </div>
                  </td>

                  <td className="py-3.5 px-4 font-mono text-slate-300">
                    <div className="inline-flex items-center gap-1.5 bg-slate-900/60 px-2 py-1 rounded border border-border">
                      <span className="text-emerald-400">✓</span>
                      <span>{ev.sha256_hash.substring(0, 16)}...{ev.sha256_hash.substring(ev.sha256_hash.length - 8)}</span>
                    </div>
                  </td>

                  <td className="py-3.5 px-4">
                    <Badge
                      variant={
                        ev.status === 'ANALYZED'
                          ? 'success'
                          : ev.status === 'PROCESSING'
                          ? 'warning'
                          : ev.status === 'ERROR'
                          ? 'danger'
                          : 'default'
                      }
                    >
                      {ev.processing_stage}
                    </Badge>
                  </td>

                  <td className="py-3.5 px-4 text-foreground-subtle font-mono text-[11px]">
                    {new Date(ev.created_at).toLocaleString([], {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </td>

                  <td className="py-3.5 px-4 text-right">
                    <Link href={`/investigations/${id}/evidence/${ev.id}`}>
                      <Button variant="outline" size="sm" icon={<ExternalLink className="w-3.5 h-3.5" />}>
                        Inspect
                      </Button>
                    </Link>
                  </td>
                </tr>
              ))}

              {evidenceList.length === 0 && !loading && (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-xs text-foreground-muted">
                    No evidence has been added to this investigation yet. Drop files above to begin forensic processing.
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
