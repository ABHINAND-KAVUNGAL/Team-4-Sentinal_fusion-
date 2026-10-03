'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Search, Menu, Plus, ShieldCheck, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { api } from '@/lib/api';

export function Topbar({ onMenuClick }: { onMenuClick?: () => void }) {
  const router = useRouter();
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<{
    investigations: any[];
    evidence: any[];
    entities: any[];
    findings: any[];
  } | null>(null);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (!searchQuery || searchQuery.trim().length < 2) {
      setSearchResults(null);
      return;
    }
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await api.search(searchQuery.trim());
        setSearchResults(res);
      } catch {
        setSearchResults(null);
      } finally {
        setSearching(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSelectResult = (path: string) => {
    setSearchOpen(false);
    setSearchQuery('');
    router.push(path);
  };

  return (
    <>
      <header className="h-16 bg-surface/80 backdrop-blur-md border-b border-border sticky top-0 z-30 flex items-center justify-between px-6">
        <div className="flex items-center gap-4">
          <button
            onClick={onMenuClick}
            className="lg:hidden text-foreground-muted hover:text-foreground p-1 rounded-md"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Global Search Trigger */}
          <button
            onClick={() => setSearchOpen(true)}
            className="flex items-center gap-3 px-3 py-1.5 rounded-lg bg-surface-elevated/70 border border-border text-foreground-muted hover:border-border-active hover:text-foreground text-xs w-64 md:w-80 transition-all text-left"
          >
            <Search className="w-4 h-4 shrink-0 text-foreground-subtle" />
            <span className="flex-1 truncate">Search cases, hashes, targets...</span>
            <kbd className="hidden md:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-mono bg-surface border border-border rounded text-foreground-subtle">
              ⌘K
            </kbd>
          </button>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/investigations?create=true">
            <Button variant="primary" size="sm" icon={<Plus className="w-4 h-4" />}>
              New Investigation
            </Button>
          </Link>
        </div>
      </header>

      {/* Categorized Search Modal */}
      {searchOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-xl bg-surface border border-border rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[75vh]">
            <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
              <Search className="w-5 h-5 text-foreground-subtle shrink-0" />
              <input
                type="text"
                autoFocus
                placeholder="Search across investigations, evidence, entities, findings..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-transparent text-sm text-foreground focus:outline-none placeholder:text-foreground-subtle"
              />
              <button
                onClick={() => setSearchOpen(false)}
                className="text-foreground-subtle hover:text-foreground p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 overflow-y-auto space-y-4">
              {searching && (
                <div className="text-center py-6 text-xs text-foreground-subtle font-mono">
                  Searching forensic index...
                </div>
              )}

              {!searching && !searchResults && (
                <div className="text-center py-6 text-xs text-foreground-subtle">
                  Type at least 2 characters to search across the intelligence base.
                </div>
              )}

              {searchResults && (
                <>
                  {/* Investigations */}
                  {searchResults.investigations?.length > 0 && (
                    <div>
                      <div className="text-[10px] font-mono uppercase text-foreground-subtle px-2 mb-1">
                        Investigations ({searchResults.investigations.length})
                      </div>
                      <div className="space-y-1">
                        {searchResults.investigations.map((inv) => (
                          <div
                            key={inv.id}
                            onClick={() => handleSelectResult(`/investigations/${inv.id}`)}
                            className="flex items-center justify-between p-2 rounded-lg hover:bg-surface-elevated cursor-pointer transition-colors"
                          >
                            <div>
                              <div className="text-xs font-semibold text-foreground">{inv.title}</div>
                              <div className="text-[11px] text-foreground-subtle font-mono">{inv.case_number}</div>
                            </div>
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                              {inv.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Evidence */}
                  {searchResults.evidence?.length > 0 && (
                    <div>
                      <div className="text-[10px] font-mono uppercase text-foreground-subtle px-2 mb-1">
                        Evidence Items ({searchResults.evidence.length})
                      </div>
                      <div className="space-y-1">
                        {searchResults.evidence.map((ev) => (
                          <div
                            key={ev.id}
                            onClick={() => handleSelectResult(`/investigations/${ev.investigation_id}/evidence/${ev.id}`)}
                            className="flex items-center justify-between p-2 rounded-lg hover:bg-surface-elevated cursor-pointer transition-colors"
                          >
                            <div>
                              <div className="text-xs font-medium text-foreground">{ev.filename}</div>
                              <div className="text-[11px] text-foreground-subtle font-mono">SHA-256: {ev.hash}...</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Entities */}
                  {searchResults.entities?.length > 0 && (
                    <div>
                      <div className="text-[10px] font-mono uppercase text-foreground-subtle px-2 mb-1">
                        Tracked Entities ({searchResults.entities.length})
                      </div>
                      <div className="space-y-1">
                        {searchResults.entities.map((ent) => (
                          <div
                            key={ent.id}
                            onClick={() => handleSelectResult(`/investigations/${ent.investigation_id}/graph`)}
                            className="flex items-center justify-between p-2 rounded-lg hover:bg-surface-elevated cursor-pointer transition-colors"
                          >
                            <span className="text-xs font-medium text-foreground">{ent.name}</span>
                            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                              {ent.category}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Findings */}
                  {searchResults.findings?.length > 0 && (
                    <div>
                      <div className="text-[10px] font-mono uppercase text-foreground-subtle px-2 mb-1">
                        AI Findings ({searchResults.findings.length})
                      </div>
                      <div className="space-y-1">
                        {searchResults.findings.map((f) => (
                          <div
                            key={f.id}
                            onClick={() => handleSelectResult(`/investigations/${f.investigation_id}/findings`)}
                            className="flex items-center justify-between p-2 rounded-lg hover:bg-surface-elevated cursor-pointer transition-colors"
                          >
                            <span className="text-xs text-foreground truncate pr-2">{f.title}</span>
                            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400">
                              {f.severity}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {searchResults.investigations?.length === 0 &&
                    searchResults.evidence?.length === 0 &&
                    searchResults.entities?.length === 0 &&
                    searchResults.findings?.length === 0 && (
                      <div className="text-center py-6 text-xs text-foreground-subtle">
                        No matches found for &ldquo;{searchQuery}&rdquo;.
                      </div>
                    )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
