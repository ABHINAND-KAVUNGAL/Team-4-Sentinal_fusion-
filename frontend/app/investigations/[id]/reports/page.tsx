'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import {
  FileText,
  Download,
  Plus,
  FileCode,
  CheckCircle2,
  Clock,
  Printer,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';
import { Card, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { api } from '@/lib/api';
import { Report, ReportFormat } from '@/types';

export default function CaseReportsPage() {
  const params = useParams();
  const id = params?.id as string;

  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [format, setFormat] = useState<ReportFormat>('PDF');
  const [customTitle, setCustomTitle] = useState('');
  const [generating, setGenerating] = useState(false);

  const loadReports = async () => {
    try {
      const data = await api.getReports(id);
      setReports(data);
    } catch (err) {
      console.error('Failed to load reports:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, [id]);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setGenerating(true);
    try {
      await api.generateReport(id, format, customTitle.trim() || undefined);
      setModalOpen(false);
      setCustomTitle('');
      loadReports();
    } catch (err: any) {
      alert(`Report generation error: ${err.message}`);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Generate Action */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-foreground">
            Investigative Dossiers &amp; Formal Reports
          </h2>
          <p className="text-xs text-foreground-muted mt-0.5">
            Export comprehensive case documentation in professional PDF or structured JSON formats.
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={() => setModalOpen(true)}
          icon={<Plus className="w-4 h-4" />}
        >
          Generate Dossier
        </Button>
      </div>

      {/* Reports List */}
      <Card>
        <CardHeader
          title={`Generated Case Dossiers (${reports.length})`}
          subtitle="Cryptographically sealed case summaries for evidentiary submission"
          action={
            <Button variant="ghost" size="sm" onClick={loadReports} icon={<RefreshCw className="w-3.5 h-3.5" />}>
              Refresh
            </Button>
          }
        />

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border/80 text-[11px] font-mono uppercase text-foreground-subtle">
                <th className="py-3 px-4">Dossier Title</th>
                <th className="py-3 px-4">Format</th>
                <th className="py-3 px-4">File Size</th>
                <th className="py-3 px-4">Generated At</th>
                <th className="py-3 px-4 text-right">Download</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50 text-xs">
              {reports.map((rep) => (
                <tr key={rep.id} className="hover:bg-surface-elevated/40 transition-colors">
                  <td className="py-3.5 px-4 font-semibold text-foreground">
                    <div className="flex items-center gap-2.5">
                      {rep.format === 'PDF' ? (
                        <FileText className="w-4 h-4 text-rose-400 shrink-0" />
                      ) : (
                        <FileCode className="w-4 h-4 text-blue-400 shrink-0" />
                      )}
                      <span>{rep.title}</span>
                    </div>
                  </td>

                  <td className="py-3.5 px-4">
                    <Badge variant={rep.format === 'PDF' ? 'danger' : 'primary'}>
                      {rep.format}
                    </Badge>
                  </td>

                  <td className="py-3.5 px-4 font-mono text-foreground-muted">
                    {Math.round(rep.file_size / 1024)} KB
                  </td>

                  <td className="py-3.5 px-4 font-mono text-foreground-subtle text-[11px]">
                    {new Date(rep.created_at).toLocaleString([], {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </td>

                  <td className="py-3.5 px-4 text-right">
                    <a
                      href={api.getReportDownloadUrl(rep.id)}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button variant="secondary" size="sm" icon={<Download className="w-3.5 h-3.5" />}>
                        Download
                      </Button>
                    </a>
                  </td>
                </tr>
              ))}

              {reports.length === 0 && !loading && (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-xs text-foreground-muted">
                    No dossiers generated for this case yet. Click &ldquo;Generate Dossier&rdquo; above.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Generate Dossier Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Generate Investigation Dossier"
        subtitle="Compile current evidence inventory, findings, timeline, and risk metrics into an official document."
      >
        <form onSubmit={handleGenerate} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-foreground-muted mb-1.5">
              Dossier Title
            </label>
            <input
              type="text"
              placeholder="e.g. Interim Intelligence Dossier - Operation Northstar"
              value={customTitle}
              onChange={(e) => setCustomTitle(e.target.value)}
              className="w-full bg-surface-elevated border border-border rounded-lg px-3 py-2 text-xs text-foreground focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-foreground-muted mb-1.5">
              Export Format
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setFormat('PDF')}
                className={`p-3 rounded-lg border text-left flex items-start gap-2.5 transition-colors ${
                  format === 'PDF'
                    ? 'bg-rose-500/10 border-rose-500/40 text-foreground'
                    : 'bg-surface-elevated border-border text-foreground-muted hover:text-foreground'
                }`}
              >
                <FileText className="w-5 h-5 text-rose-400 mt-0.5 shrink-0" />
                <div>
                  <div className="text-xs font-semibold">PDF Document</div>
                  <div className="text-[10px] text-foreground-subtle">
                    Print-ready formal dossier with tables &amp; legal disclaimers.
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setFormat('JSON')}
                className={`p-3 rounded-lg border text-left flex items-start gap-2.5 transition-colors ${
                  format === 'JSON'
                    ? 'bg-blue-500/10 border-blue-500/40 text-foreground'
                    : 'bg-surface-elevated border-border text-foreground-muted hover:text-foreground'
                }`}
              >
                <FileCode className="w-5 h-5 text-blue-400 mt-0.5 shrink-0" />
                <div>
                  <div className="text-xs font-semibold">JSON Export</div>
                  <div className="text-[10px] text-foreground-subtle">
                    Structured data tree for downstream forensic tools.
                  </div>
                </div>
              </button>
            </div>
          </div>

          <div className="p-3 bg-surface-elevated/40 rounded-lg border border-border/70 text-[11px] text-foreground-subtle">
            All generated dossiers automatically include verification hashes, chain of custody logs, and required AI assistant caveats.
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-border">
            <Button type="button" variant="ghost" size="sm" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              loading={generating}
              icon={<Printer className="w-4 h-4" />}
            >
              Compile &amp; Seal Dossier
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
