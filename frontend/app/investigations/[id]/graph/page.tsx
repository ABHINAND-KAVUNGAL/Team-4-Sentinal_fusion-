'use client';

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useParams } from 'next/navigation';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  Node,
  Edge,
  useNodesState,
  useEdgesState,
  MarkerType,
} from 'reactflow';
import 'reactflow/dist/style.css';

import {
  GitBranch,
  User,
  Smartphone,
  CreditCard,
  MapPin,
  Building,
  FileSearch,
  Plus,
  Search,
  Filter,
  X,
  ShieldAlert,
  ArrowRight,
} from 'lucide-react';
import { Card, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { api } from '@/lib/api';
import { GraphData, EntityType, RelationshipType } from '@/types';

// Custom Node Component
function ForensicNode({ data, selected }: { data: any; selected: boolean }) {
  const getIcon = () => {
    switch (data.category) {
      case 'PERSON':
        return <User className="w-4 h-4 text-blue-400" />;
      case 'DEVICE':
        return <Smartphone className="w-4 h-4 text-cyan-400" />;
      case 'ACCOUNT':
        return <CreditCard className="w-4 h-4 text-emerald-400" />;
      case 'LOCATION':
        return <MapPin className="w-4 h-4 text-rose-400" />;
      case 'ORGANIZATION':
        return <Building className="w-4 h-4 text-amber-400" />;
      default:
        return <FileSearch className="w-4 h-4 text-purple-400" />;
    }
  };

  const getBorderColor = () => {
    if (selected) return 'border-blue-500 shadow-[0_0_12px_rgba(59,130,246,0.5)]';
    if (data.risk_score >= 70) return 'border-rose-500/60';
    if (data.risk_score >= 40) return 'border-amber-500/60';
    return 'border-border';
  };

  return (
    <div
      className={`px-3.5 py-2.5 rounded-xl bg-surface border-2 ${getBorderColor()} shadow-md transition-all min-w-[160px] max-w-[220px]`}
    >
      <div className="flex items-center justify-between gap-2 mb-1">
        <div className="flex items-center gap-1.5">
          {getIcon()}
          <span className="text-[10px] font-mono uppercase text-foreground-subtle">
            {data.category}
          </span>
        </div>
        {data.risk_score > 0 && (
          <span className="text-[10px] font-mono font-bold text-rose-400">
            {data.risk_score}
          </span>
        )}
      </div>
      <div className="text-xs font-semibold text-foreground truncate">{data.name}</div>
    </div>
  );
}

const nodeTypes = {
  forensicNode: ForensicNode,
};

export default function CaseGraphPage() {
  const params = useParams();
  const id = params?.id as string;

  const [graphRaw, setGraphRaw] = useState<GraphData | null>(null);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedNode, setSelectedNode] = useState<any | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals for adding entity & relationship
  const [entityModalOpen, setEntityModalOpen] = useState(false);
  const [relModalOpen, setRelModalOpen] = useState(false);
  const [newEntityName, setNewEntityName] = useState('');
  const [newEntityCategory, setNewEntityCategory] = useState<EntityType>('PERSON');
  const [newEntityRisk, setNewEntityRisk] = useState<number>(30);
  const [sourceEntityId, setSourceEntityId] = useState('');
  const [targetEntityId, setTargetEntityId] = useState('');
  const [relType, setRelType] = useState<RelationshipType>('ASSOCIATED_WITH');
  const [relDesc, setRelDesc] = useState('');

  const loadGraph = async () => {
    try {
      const data = await api.getGraphData(id);
      setGraphRaw(data);

      // Layout nodes radially or in circle
      const totalNodes = data.nodes.length;
      const radius = 280;
      const centerX = 400;
      const centerY = 300;

      const rfNodes: Node[] = data.nodes.map((node, i) => {
        const angle = (i / totalNodes) * 2 * Math.PI;
        const x = centerX + radius * Math.cos(angle);
        const y = centerY + radius * Math.sin(angle);

        return {
          id: node.id,
          type: 'forensicNode',
          position: { x, y },
          data: {
            ...node.data,
            name: node.label,
            category: node.category,
            risk_score: node.risk_score,
          },
        };
      });

      const rfEdges: Edge[] = data.edges.map((edge) => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        label: edge.label,
        animated: true,
        style: { stroke: '#475569', strokeWidth: 1.5 },
        labelStyle: { fill: '#94A3B8', fontSize: 10, fontFamily: 'monospace' },
        labelBgStyle: { fill: '#0F172A', fillOpacity: 0.9 },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: '#475569',
        },
      }));

      setNodes(rfNodes);
      setEdges(rfEdges);
    } catch (err) {
      console.error('Failed to load graph:', err);
    }
  };

  useEffect(() => {
    loadGraph();
  }, [id]);

  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      setSelectedNode(node);
      // Highlight incident edges
      setEdges((eds) =>
        eds.map((e) => {
          const isConnected = e.source === node.id || e.target === node.id;
          return {
            ...e,
            style: {
              stroke: isConnected ? '#3B82F6' : '#1E293B',
              strokeWidth: isConnected ? 2.5 : 1,
            },
            markerEnd: {
              type: MarkerType.ArrowClosed,
              color: isConnected ? '#3B82F6' : '#1E293B',
            },
          };
        })
      );
    },
    [setEdges]
  );

  const handleCreateEntity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEntityName.trim()) return;
    try {
      await api.createEntity(id, {
        name: newEntityName.trim(),
        category: newEntityCategory,
        risk_score: newEntityRisk,
      });
      setEntityModalOpen(false);
      setNewEntityName('');
      loadGraph();
    } catch (err: any) {
      alert(`Error creating entity: ${err.message}`);
    }
  };

  const handleCreateRelationship = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sourceEntityId || !targetEntityId) return;
    try {
      await api.createRelationship(id, {
        source_entity_id: sourceEntityId,
        target_entity_id: targetEntityId,
        relationship_type: relType,
        description: relDesc.trim() || undefined,
      });
      setRelModalOpen(false);
      loadGraph();
    } catch (err: any) {
      alert(`Error creating relationship: ${err.message}`);
    }
  };

  // Filtered nodes
  const filteredNodes = useMemo(() => {
    return nodes.filter((n) => {
      const matchCat = categoryFilter === 'ALL' || n.data.category === categoryFilter;
      const matchQuery =
        !searchQuery || n.data.name.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchQuery;
    });
  }, [nodes, categoryFilter, searchQuery]);

  // Ensure edges only connect visible nodes to prevent canvas warnings
  const visibleNodeIds = useMemo(() => new Set(filteredNodes.map((n) => n.id)), [filteredNodes]);
  const filteredEdges = useMemo(() => {
    return edges.filter((e) => visibleNodeIds.has(e.source) && visibleNodeIds.has(e.target));
  }, [edges, visibleNodeIds]);

  return (
    <div className="space-y-4">
      {/* Graph Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {['ALL', 'PERSON', 'ORGANIZATION', 'ACCOUNT', 'DEVICE', 'LOCATION'].map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-2.5 py-1 rounded-md text-xs font-mono transition-colors whitespace-nowrap ${
                categoryFilter === cat
                  ? 'bg-blue-600/10 text-blue-400 border border-blue-500/20'
                  : 'bg-surface hover:bg-surface-elevated text-foreground-muted border border-border'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-foreground-subtle absolute left-2.5 top-2" />
            <input
              type="text"
              placeholder="Search targets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-surface border border-border rounded-lg pl-8 pr-2.5 py-1 text-xs text-foreground placeholder:text-foreground-subtle focus:outline-none focus:border-blue-500 font-mono w-32 md:w-44"
            />
          </div>

          <Button
            variant="secondary"
            size="sm"
            onClick={() => setEntityModalOpen(true)}
            icon={<Plus className="w-3.5 h-3.5" />}
          >
            Add Entity
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => setRelModalOpen(true)}
            icon={<GitBranch className="w-3.5 h-3.5" />}
          >
            Link Entities
          </Button>
        </div>
      </div>

      {/* React Flow Graph Canvas */}
      <div className="relative w-full h-[620px] rounded-xl border border-border bg-slate-950 overflow-hidden shadow-inner">
        <ReactFlow
          nodes={filteredNodes}
          edges={filteredEdges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={onNodeClick}
          nodeTypes={nodeTypes}
          fitView
          minZoom={0.2}
          maxZoom={2.0}
        >
          <Background color="#1E293B" gap={20} size={1} />
          <Controls className="bg-surface border border-border text-foreground rounded-lg" />
          <MiniMap
            nodeColor={(n: any) => (n.data?.risk_score >= 70 ? '#EF4444' : '#3B82F6')}
            className="bg-surface/80 border border-border rounded-lg"
          />
        </ReactFlow>

        {/* Selected Entity Inspector Drawer */}
        {selectedNode && (
          <div className="absolute top-4 right-4 z-20 w-80 bg-surface/95 backdrop-blur-md border border-border rounded-xl p-5 shadow-2xl space-y-4 animate-in slide-in-from-right duration-150">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-mono uppercase text-foreground-subtle">
                  {selectedNode.data.category}
                </span>
                <h4 className="text-sm font-semibold text-foreground mt-0.5">
                  {selectedNode.data.name}
                </h4>
              </div>
              <button
                onClick={() => setSelectedNode(null)}
                className="text-foreground-subtle hover:text-foreground p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-2.5 rounded-lg bg-surface-elevated border border-border flex items-center justify-between text-xs font-mono">
              <span className="text-foreground-muted">Assessed Risk Score:</span>
              <span className="font-bold text-rose-400">{selectedNode.data.risk_score} / 100</span>
            </div>

            {selectedNode.data.attributes && (
              <div className="space-y-1.5">
                <span className="text-[11px] font-mono text-foreground-subtle uppercase">
                  Entity Attributes
                </span>
                <div className="p-2.5 rounded-lg bg-surface-elevated/40 border border-border/80 space-y-1 text-xs">
                  {Object.entries(selectedNode.data.attributes).map(([k, v]) => (
                    <div key={k} className="flex items-center justify-between">
                      <span className="text-foreground-subtle font-mono text-[11px]">{k}:</span>
                      <span className="text-foreground font-mono text-[11px]">{String(v)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="pt-2 border-t border-border flex items-center justify-between text-xs text-foreground-subtle">
              <span>Investigation SF-2026-001</span>
              <span className="text-blue-400">Connected target</span>
            </div>
          </div>
        )}
      </div>

      {/* Add Entity Modal */}
      <Modal
        isOpen={entityModalOpen}
        onClose={() => setEntityModalOpen(false)}
        title="Add Tracked Entity"
        subtitle="Introduce an entity node into the case intelligence graph."
      >
        <form onSubmit={handleCreateEntity} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-foreground-muted mb-1.5">
              Entity Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Dmitri Volkov or 194.26.29.115"
              value={newEntityName}
              onChange={(e) => setNewEntityName(e.target.value)}
              className="w-full bg-surface-elevated border border-border rounded-lg px-3 py-2 text-xs text-foreground focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-foreground-muted mb-1.5">
                Category
              </label>
              <select
                value={newEntityCategory}
                onChange={(e) => setNewEntityCategory(e.target.value as EntityType)}
                className="w-full bg-surface-elevated border border-border rounded-lg px-3 py-2 text-xs text-foreground focus:outline-none focus:border-blue-500"
              >
                <option value="PERSON">PERSON</option>
                <option value="ORGANIZATION">ORGANIZATION</option>
                <option value="ACCOUNT">ACCOUNT</option>
                <option value="DEVICE">DEVICE</option>
                <option value="LOCATION">LOCATION</option>
                <option value="EVIDENCE">EVIDENCE</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-foreground-muted mb-1.5">
                Initial Risk Score (0-100)
              </label>
              <input
                type="number"
                min={0}
                max={100}
                value={newEntityRisk}
                onChange={(e) => setNewEntityRisk(parseInt(e.target.value) || 0)}
                className="w-full bg-surface-elevated border border-border rounded-lg px-3 py-2 text-xs text-foreground font-mono focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-border">
            <Button type="button" variant="ghost" size="sm" onClick={() => setEntityModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" icon={<Plus className="w-4 h-4" />}>
              Create Entity Node
            </Button>
          </div>
        </form>
      </Modal>

      {/* Link Entities Modal */}
      <Modal
        isOpen={relModalOpen}
        onClose={() => setRelModalOpen(false)}
        title="Link Entities via Relationship"
        subtitle="Establish an intelligence connection between two tracked nodes."
      >
        <form onSubmit={handleCreateRelationship} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-foreground-muted mb-1.5">
                Source Entity
              </label>
              <select
                required
                value={sourceEntityId}
                onChange={(e) => setSourceEntityId(e.target.value)}
                className="w-full bg-surface-elevated border border-border rounded-lg px-3 py-2 text-xs text-foreground focus:outline-none focus:border-blue-500"
              >
                <option value="">Select source...</option>
                {nodes.map((n) => (
                  <option key={n.id} value={n.id}>
                    {n.data.name} ({n.data.category})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-foreground-muted mb-1.5">
                Target Entity
              </label>
              <select
                required
                value={targetEntityId}
                onChange={(e) => setTargetEntityId(e.target.value)}
                className="w-full bg-surface-elevated border border-border rounded-lg px-3 py-2 text-xs text-foreground focus:outline-none focus:border-blue-500"
              >
                <option value="">Select target...</option>
                {nodes.map((n) => (
                  <option key={n.id} value={n.id}>
                    {n.data.name} ({n.data.category})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-foreground-muted mb-1.5">
              Relationship Type
            </label>
            <select
              value={relType}
              onChange={(e) => setRelType(e.target.value as RelationshipType)}
              className="w-full bg-surface-elevated border border-border rounded-lg px-3 py-2 text-xs text-foreground focus:outline-none focus:border-blue-500"
            >
              <option value="COMMUNICATED_WITH">COMMUNICATED_WITH</option>
              <option value="OWNS">OWNS</option>
              <option value="USES">USES</option>
              <option value="LOCATED_AT">LOCATED_AT</option>
              <option value="ASSOCIATED_WITH">ASSOCIATED_WITH</option>
              <option value="APPEARS_IN">APPEARS_IN</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-foreground-muted mb-1.5">
              Corroborating Notes &amp; Description
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Outgoing wire transfer identified in financial extract..."
              value={relDesc}
              onChange={(e) => setRelDesc(e.target.value)}
              className="w-full bg-surface-elevated border border-border rounded-lg px-3 py-2 text-xs text-foreground focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-border">
            <Button type="button" variant="ghost" size="sm" onClick={() => setRelModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" icon={<GitBranch className="w-4 h-4" />}>
              Establish Relationship
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
