'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  Clock,
  Plus,
  Filter,
  ArrowRight,
  ExternalLink,
  MessageSquare,
  DollarSign,
  MapPin,
  Key,
  Image as ImageIcon,
  Layers,
  Sparkles,
} from 'lucide-react';
import { Card, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { api } from '@/lib/api';
import { TimelineEvent, EventCategory } from '@/types';

export default function CaseTimelinePage() {
  const params = useParams();
  const id = params?.id as string;

  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  // New Event Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newCategory, setNewCategory] = useState<EventCategory>('GENERAL');
  const [newTimestamp, setNewTimestamp] = useState(new Date().toISOString().slice(0, 16));
  const [submitting, setSubmitting] = useState(false);

  // Selected event modal
  const [selectedEvent, setSelectedEvent] = useState<TimelineEvent | null>(null);

  const loadTimeline = async () => {
    try {
      const data = await api.getTimeline(
        id,
        selectedCategory !== 'ALL' ? (selectedCategory as EventCategory) : undefined
      );
      setEvents(data);
    } catch (err) {
      console.error('Failed to load timeline:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTimeline();
  }, [id, selectedCategory]);

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    setSubmitting(true);
    try {
      await api.createTimelineEvent(id, {
        title: newTitle.trim(),
        description: newDesc.trim() || undefined,
        category: newCategory,
        timestamp: new Date(newTimestamp).toISOString(),
      });
      setModalOpen(false);
      setNewTitle('');
      setNewDesc('');
      loadTimeline();
    } catch (err: any) {
      alert(`Failed to create event: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const getCategoryIcon = (cat: EventCategory) => {
    switch (cat) {
      case 'TRANSACTION':
        return <DollarSign className="w-3.5 h-3.5 text-emerald-400" />;
      case 'COMMUNICATION':
        return <MessageSquare className="w-3.5 h-3.5 text-blue-400" />;
      case 'LOCATION':
        return <MapPin className="w-3.5 h-3.5 text-rose-400" />;
      case 'ACCESS':
        return <Key className="w-3.5 h-3.5 text-amber-400" />;
      case 'MEDIA':
        return <ImageIcon className="w-3.5 h-3.5 text-purple-400" />;
      default:
        return <Clock className="w-3.5 h-3.5 text-slate-400" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Filter and Action Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0">
          {['ALL', 'TRANSACTION', 'COMMUNICATION', 'LOCATION', 'ACCESS', 'MEDIA'].map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-colors whitespace-nowrap ${
                selectedCategory === cat
                  ? 'bg-blue-600/10 text-blue-400 border border-blue-500/20'
                  : 'bg-surface hover:bg-surface-elevated text-foreground-muted border border-border'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={() => setModalOpen(true)}
          icon={<Plus className="w-4 h-4" />}
        >
          Add Event Anchor
        </Button>
      </div>

      {/* Chronological Timeline Container */}
      <Card>
        <CardHeader
          title="Chronological Event Reconstruction"
          subtitle="Time-anchored events correlated with seized evidence and communication intercepts"
        />

        <div className="relative pl-6 md:pl-8 space-y-6 before:absolute before:left-3 md:before:left-4 before:top-3 before:bottom-3 before:w-0.5 before:bg-border">
          {events.map((ev) => (
            <div
              key={ev.id}
              className="relative group cursor-pointer"
              onClick={() => setSelectedEvent(ev)}
            >
              {/* Event Dot */}
              <div className="absolute -left-6 md:-left-8 top-1.5 w-6 h-6 rounded-full bg-surface border-2 border-blue-500 flex items-center justify-center shrink-0 shadow-sm group-hover:scale-110 transition-transform">
                {getCategoryIcon(ev.category)}
              </div>

              <div className="p-4 rounded-xl bg-surface-elevated/40 hover:bg-surface-elevated border border-border hover:border-border-active transition-all space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="primary">{ev.category}</Badge>
                    {ev.is_demo && <Badge variant="demo">DEMO DATA</Badge>}
                    <span className="text-[11px] font-mono text-foreground-subtle">
                      Conf: {Math.round(ev.confidence * 100)}%
                    </span>
                  </div>

                  <span className="text-xs font-mono text-blue-400">
                    {new Date(ev.timestamp).toLocaleString([], {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                    })}
                  </span>
                </div>

                <h4 className="text-sm font-semibold text-foreground group-hover:text-blue-400 transition-colors">
                  {ev.title}
                </h4>

                <p className="text-xs text-foreground-muted leading-relaxed">{ev.description}</p>

                {ev.evidence_id && (
                  <div className="pt-2 border-t border-border/50 flex items-center justify-between text-[11px] font-mono">
                    <span className="text-foreground-subtle">
                      Source Evidence: {ev.evidence_title || 'Linked File'}
                    </span>
                    <span className="text-blue-400 flex items-center gap-1 group-hover:underline">
                      <span>Inspect Source</span>
                      <ExternalLink className="w-3 h-3" />
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}

          {events.length === 0 && !loading && (
            <div className="text-center py-12 text-xs text-foreground-muted">
              No timeline events recorded in this category.
            </div>
          )}
        </div>
      </Card>

      {/* Selected Event Detail Modal */}
      <Modal
        isOpen={!!selectedEvent}
        onClose={() => setSelectedEvent(null)}
        title={selectedEvent?.title || 'Event Detail'}
        subtitle="Chronological forensic anchor inspection"
      >
        {selectedEvent && (
          <div className="space-y-4 text-xs font-sans">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <Badge variant="primary">{selectedEvent.category}</Badge>
              <span className="font-mono text-blue-400">
                {new Date(selectedEvent.timestamp).toLocaleString()}
              </span>
            </div>

            <p className="text-foreground leading-relaxed">{selectedEvent.description}</p>

            <div className="p-3 rounded-lg bg-surface-elevated border border-border space-y-1.5 font-mono text-[11px]">
              <div>
                <span className="text-foreground-subtle">Assessed Confidence:</span>{' '}
                <span className="text-foreground">{Math.round(selectedEvent.confidence * 100)}%</span>
              </div>
              {selectedEvent.is_demo && (
                <div>
                  <span className="text-foreground-subtle">Provenance:</span>{' '}
                  <span className="text-amber-400">Synthetic Seed Data</span>
                </div>
              )}
            </div>

            {selectedEvent.evidence_id && (
              <div className="pt-3 border-t border-border flex justify-end">
                <Link href={`/investigations/${id}/evidence/${selectedEvent.evidence_id}`}>
                  <Button variant="primary" size="sm" icon={<ExternalLink className="w-3.5 h-3.5" />}>
                    Open Source Evidence Item
                  </Button>
                </Link>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Add Event Anchor Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Record Timeline Event"
        subtitle="Anchor a chronological occurrence supported by evidence."
      >
        <form onSubmit={handleCreateEvent} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-foreground-muted mb-1.5">
              Event Title *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Wire Transfer to Meridian Logistics Escrow"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              className="w-full bg-surface-elevated border border-border rounded-lg px-3 py-2 text-xs text-foreground placeholder:text-foreground-subtle focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-foreground-muted mb-1.5">
                Category
              </label>
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value as EventCategory)}
                className="w-full bg-surface-elevated border border-border rounded-lg px-3 py-2 text-xs text-foreground focus:outline-none focus:border-blue-500"
              >
                <option value="GENERAL">General</option>
                <option value="TRANSACTION">Transaction</option>
                <option value="COMMUNICATION">Communication</option>
                <option value="LOCATION">Location</option>
                <option value="ACCESS">Access</option>
                <option value="MEDIA">Media</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-foreground-muted mb-1.5">
                Timestamp *
              </label>
              <input
                type="datetime-local"
                required
                value={newTimestamp}
                onChange={(e) => setNewTimestamp(e.target.value)}
                className="w-full bg-surface-elevated border border-border rounded-lg px-3 py-2 text-xs text-foreground font-mono focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-foreground-muted mb-1.5">
              Detailed Description &amp; Context
            </label>
            <textarea
              rows={3}
              placeholder="Explain the significance, participants, or corroborating identifiers..."
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              className="w-full bg-surface-elevated border border-border rounded-lg px-3 py-2 text-xs text-foreground placeholder:text-foreground-subtle focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
            <Button type="button" variant="ghost" size="sm" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              loading={submitting}
              icon={<Plus className="w-4 h-4" />}
            >
              Anchor Event
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
