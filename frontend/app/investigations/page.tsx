'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  FolderLock,
  Plus,
  Search,
  Filter,
  ArrowRight,
  ShieldAlert,
  Clock,
  Layers,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { api } from '@/lib/api';
import { Investigation, InvestigationStatus, Priority } from '@/types';

export default function InvestigationsPage() {
  const searchParams = useSearchParams();
  const [investigations, setInvestigations] = useState<Investigation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');

  // Create Modal state
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newPriority, setNewPriority] = useState<Priority>('MEDIUM');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (searchParams.get('create') === 'true') {
      setCreateModalOpen(true);
    }
  }, [searchParams]);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await api.getInvestigations(
        searchQuery || undefined,
        statusFilter !== 'ALL' ? (statusFilter as InvestigationStatus) : undefined,
        priorityFilter !== 'ALL' ? (priorityFilter as Priority) : undefined
      );
      setInvestigations(data);
    } catch (err) {
      console.error('Failed to fetch investigations:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [statusFilter, priorityFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadData();
  };

  const handleCreateCase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    setCreating(true);
    try {
      await api.createInvestigation({
        title: newTitle.trim(),
        description: newDesc.trim() || undefined,
        priority: newPriority,
      });
      setCreateModalOpen(false);
      setNewTitle('');
      setNewDesc('');
      loadData();
    } catch (err) {
      console.error('Failed to create case:', err);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/70 pb-6">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground">
            Investigation Workspaces
          </h1>
          <p className="text-xs text-foreground-muted mt-1">
            Active digital intelligence inquiry dossiers and forensic repositories.
          </p>
        </div>
        <Button
          variant="primary"
          size="sm"
          onClick={() => setCreateModalOpen(true)}
          icon={<Plus className="w-4 h-4" />}
        >
          New Investigation
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-center gap-3">
        <form onSubmit={handleSearchSubmit} className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-foreground-subtle absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by case number, operation name, or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-surface border border-border rounded-lg pl-9 pr-3 py-2 text-xs text-foreground placeholder:text-foreground-subtle focus:outline-none focus:border-blue-500 transition-colors"
          />
        </form>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-surface border border-border rounded-lg px-3 py-2 text-xs text-foreground focus:outline-none focus:border-blue-500"
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="DRAFT">Draft</option>
            <option value="REVIEW">Pending Review</option>
            <option value="CLOSED">Closed</option>
          </select>

          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="bg-surface border border-border rounded-lg px-3 py-2 text-xs text-foreground focus:outline-none focus:border-blue-500"
          >
            <option value="ALL">All Priorities</option>
            <option value="CRITICAL">Critical</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>
        </div>
      </div>

      {/* Case Dossiers Table / Card List */}
      <div className="space-y-3">
        {investigations.map((inv) => (
          <Link key={inv.id} href={`/investigations/${inv.id}`}>
            <Card hoverable className="p-5 group">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2.5">
                    <span className="text-xs font-mono font-bold text-blue-400">{inv.case_number}</span>
                    <span className="text-foreground-subtle">&bull;</span>
                    <Badge variant={inv.status === 'ACTIVE' ? 'primary' : 'default'}>{inv.status}</Badge>
                    <Badge
                      variant={
                        inv.priority === 'CRITICAL' || inv.priority === 'HIGH' ? 'danger' : 'warning'
                      }
                    >
                      {inv.priority}
                    </Badge>
                    {inv.case_number === 'SF-2026-001' && <Badge variant="demo">DEMO DATA</Badge>}
                  </div>

                  <h3 className="text-base font-semibold text-foreground group-hover:text-blue-400 transition-colors">
                    {inv.title}
                  </h3>

                  <p className="text-xs text-foreground-muted line-clamp-2">{inv.description}</p>
                </div>

                <div className="flex items-center justify-between md:justify-end gap-6 shrink-0 pt-3 md:pt-0 border-t md:border-t-0 border-border/60">
                  <div className="text-left md:text-right">
                    <div className="text-xs font-mono font-semibold text-rose-400">
                      Risk Index: {inv.risk_score} / 100
                    </div>
                    <div className="text-[11px] text-foreground-subtle font-mono mt-1">
                      {inv.evidence_count} Evidence &bull; {inv.findings_count} Findings
                    </div>
                    <div className="text-[10px] text-foreground-subtle font-mono mt-0.5">
                      Updated {new Date(inv.updated_at).toLocaleDateString()}
                    </div>
                  </div>
                  <ArrowRight className="w-5 h-5 text-foreground-subtle group-hover:text-blue-400 group-hover:translate-x-1 transition-all" />
                </div>
              </div>
            </Card>
          </Link>
        ))}

        {!loading && investigations.length === 0 && (
          <div className="text-center py-16 bg-surface border border-border rounded-xl p-8 space-y-3">
            <FolderLock className="w-8 h-8 text-foreground-subtle mx-auto" />
            <div className="text-sm font-medium text-foreground">No matching investigations found</div>
            <p className="text-xs text-foreground-muted max-w-sm mx-auto">
              Create a new investigation dossier to begin uploading forensic files, analyzing timelines, and tracking entities.
            </p>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setCreateModalOpen(true)}
              icon={<Plus className="w-4 h-4" />}
            >
              Create Investigation
            </Button>
          </div>
        )}
      </div>

      {/* New Investigation Modal */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Initiate Investigation Dossier"
        subtitle="Establish a new case workspace and chain-of-custody boundary."
      >
        <form onSubmit={handleCreateCase} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-foreground-muted mb-1.5">
              Operation / Case Title *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Operation Blue Horizon"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              className="w-full bg-surface-elevated border border-border rounded-lg px-3 py-2 text-xs text-foreground placeholder:text-foreground-subtle focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-foreground-muted mb-1.5">
              Case Description &amp; Scope
            </label>
            <textarea
              rows={3}
              placeholder="Detail target entities, suspicious patterns, or initial intelligence briefing..."
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              className="w-full bg-surface-elevated border border-border rounded-lg px-3 py-2 text-xs text-foreground placeholder:text-foreground-subtle focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-foreground-muted mb-1.5">
              Case Priority
            </label>
            <select
              value={newPriority}
              onChange={(e) => setNewPriority(e.target.value as Priority)}
              className="w-full bg-surface-elevated border border-border rounded-lg px-3 py-2 text-xs text-foreground focus:outline-none focus:border-blue-500"
            >
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="CRITICAL">Critical</option>
            </select>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setCreateModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              loading={creating}
              icon={<Plus className="w-4 h-4" />}
            >
              Establish Case
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
