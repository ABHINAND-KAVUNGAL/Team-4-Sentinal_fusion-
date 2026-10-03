import Link from 'next/link';
import {
  ShieldCheck,
  ArrowRight,
  GitBranch,
  FileSearch,
  Clock,
  Lightbulb,
  Lock,
  ChevronRight,
  Database,
  Cpu,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col selection:bg-blue-600/30">
      {/* Navigation */}
      <header className="border-b border-border/80 sticky top-0 z-40 bg-background/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-600/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <span className="font-semibold text-sm tracking-wider font-mono">
              SENTINEL<span className="text-blue-400 ml-1">FUSION</span>
            </span>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" size="sm">
                Sign In
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button variant="primary" size="sm" icon={<ArrowRight className="w-4 h-4" />}>
                Open Workspace
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-24 pb-16 px-6 max-w-5xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface-elevated border border-border text-xs text-foreground-muted mb-8 font-mono">
          <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
          <span>AI-Assisted Digital Intelligence Fusion Platform</span>
        </div>

        <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-foreground max-w-3xl mx-auto leading-tight">
          Digital evidence, connected intelligence.
        </h1>

        <p className="mt-6 text-base md:text-lg text-foreground-muted max-w-2xl mx-auto leading-relaxed">
          Transform fragmented forensics into connected, explainable, and auditable investigative intelligence.
          Built for precision without external API dependencies.
        </p>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <Link href="/dashboard">
            <Button variant="primary" size="lg" icon={<ArrowRight className="w-4 h-4" />}>
              Open Workspace
            </Button>
          </Link>
          <Link href="/login">
            <Button variant="secondary" size="lg">
              Explore Demo Case (SF-2026-001)
            </Button>
          </Link>
        </div>
      </section>

      {/* Product Showcase UI Preview */}
      <section className="px-6 max-w-6xl mx-auto pb-24">
        <div className="rounded-xl border border-border bg-surface shadow-2xl overflow-hidden">
          {/* Mock Browser/App Header */}
          <div className="h-10 bg-surface-elevated border-b border-border flex items-center px-4 justify-between">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-rose-500/60" />
              <div className="w-3 h-3 rounded-full bg-amber-500/60" />
              <div className="w-3 h-3 rounded-full bg-emerald-500/60" />
              <span className="ml-3 font-mono text-[11px] text-foreground-subtle">
                Sentinel Fusion &mdash; Case SF-2026-001 [Operation Northstar]
              </span>
            </div>
            <Badge variant="demo" size="sm">
              DEMO ENVIRONMENT
            </Badge>
          </div>

          {/* Interactive Feature Visual Grid */}
          <div className="p-6 md:p-8 grid grid-cols-1 md:grid-cols-3 gap-6 bg-surface">
            {/* Metric Preview 1 */}
            <div className="p-4 rounded-lg bg-surface-elevated/70 border border-border">
              <div className="text-xs font-mono text-foreground-subtle uppercase">Assessed Case Risk</div>
              <div className="text-2xl font-bold font-mono text-rose-400 mt-1">78 / 100</div>
              <p className="text-xs text-foreground-muted mt-2">
                High Risk: Multi-layered transaction velocity and offshore communication routing detected.
              </p>
            </div>

            {/* Metric Preview 2 */}
            <div className="p-4 rounded-lg bg-surface-elevated/70 border border-border">
              <div className="text-xs font-mono text-foreground-subtle uppercase">Cryptographic Integrity</div>
              <div className="text-sm font-mono text-emerald-400 mt-2 truncate">
                SHA-256: 4f98a2e1d70c8...
              </div>
              <p className="text-xs text-foreground-muted mt-2">
                100% verified byte hashes across storage vault and audit custody records.
              </p>
            </div>

            {/* Metric Preview 3 */}
            <div className="p-4 rounded-lg bg-surface-elevated/70 border border-border">
              <div className="text-xs font-mono text-foreground-subtle uppercase">Graph Linkages</div>
              <div className="text-2xl font-bold font-mono text-blue-400 mt-1">8 Targets / 8 Links</div>
              <p className="text-xs text-foreground-muted mt-2">
                Cross-correlating Viktor Kozlov, cold storage wallets, and Zurich proxy gateways.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Pillar Sections */}
      <section className="py-20 border-t border-border bg-surface/30">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
              Built for Forensic Precision
            </h2>
            <p className="text-sm text-foreground-muted mt-3">
              Every feature serves the human investigator. AI operates as a decision-support assistant with total explainability.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 rounded-xl bg-surface border border-border space-y-3">
              <div className="w-10 h-10 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                <FileSearch className="w-5 h-5" />
              </div>
              <h3 className="text-base font-semibold text-foreground">Evidence Pipeline & Integrity</h3>
              <p className="text-xs text-foreground-muted leading-relaxed">
                Automated multi-stage processing: byte hashing (SHA-256), EXIF sensor inspection, direct document parsing, and OCR text extraction.
              </p>
            </div>

            <div className="p-6 rounded-xl bg-surface border border-border space-y-3">
              <div className="w-10 h-10 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                <GitBranch className="w-5 h-5" />
              </div>
              <h3 className="text-base font-semibold text-foreground">Intelligence Graph Fusion</h3>
              <p className="text-xs text-foreground-muted leading-relaxed">
                Connect entities (Persons, Devices, Accounts, Locations, Organizations) through interactive node-link relationships with confidence scoring.
              </p>
            </div>

            <div className="p-6 rounded-xl bg-surface border border-border space-y-3">
              <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                <Lightbulb className="w-5 h-5" />
              </div>
              <h3 className="text-base font-semibold text-foreground">Explainable AI & Human Review</h3>
              <p className="text-xs text-foreground-muted leading-relaxed">
                Transparent findings with source anchors. Requires human confirmation before any finding is recorded as verified.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-border py-8 px-6 bg-surface">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-foreground-subtle font-mono">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-blue-400" />
            <span>SENTINEL FUSION &mdash; DIGITAL INTELLIGENCE SUITE</span>
          </div>
          <div>Zero Paid Subscriptions &bull; Open-Source &bull; Standalone Execution</div>
        </div>
      </footer>
    </div>
  );
}
