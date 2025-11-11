'use client';

import { useCallback, useMemo, useState, useEffect } from 'react';
import ReactFlow, {
  Node,
  Edge,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  MiniMap,
  Panel,
  ReactFlowProvider,
} from 'reactflow';
import 'reactflow/dist/style.css';

import { IntentNode } from './nodes/IntentNode';
import { SubIntentNode } from './nodes/SubIntentNode';
import { FeatureNode } from './nodes/FeatureNode';
import { TaskNode } from './nodes/TaskNode';
import { UXSpecNode } from './nodes/UXSpecNode';
import { GraphControls, NodeTypeFilter } from './GraphControls';
import { NodeDetail } from './NodeDetail';
import { useGraph } from '@/lib/hooks/useGraph';
import { convertToReactFlow } from '@/lib/graph-utils';

interface GraphViewProps {
  projectId: string;
}

function GraphViewInner({ projectId }: GraphViewProps) {
  const { graph, isLoading, error } = useGraph(projectId);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<NodeTypeFilter>({
    intent: true,
    subintent: true,
    feature: true,
    task: true,
    uxspec: true
  });

  // Define custom node types
  const nodeTypes = useMemo(
    () => ({
      intent: IntentNode,
      subintent: SubIntentNode,
      feature: FeatureNode,
      task: TaskNode,
      uxspec: UXSpecNode,
    }),
    []
  );

  // Convert graph data to React Flow format
  const { nodes: initialNodes, edges: initialEdges } = useMemo(() => {
    if (!graph) return { nodes: [], edges: [] };
    return convertToReactFlow(graph.nodes, graph.edges);
  }, [graph]);

  // Apply filters and search
  const filteredNodes = useMemo(() => {
    return initialNodes.filter(node => {
      // Type filter
      if (!filters[node.type as keyof typeof filters]) return false;

      // Search filter
      if (searchQuery) {
        const searchLower = searchQuery.toLowerCase();
        const nodeName = node.data.name?.toLowerCase() || '';
        const nodeId = node.id.toLowerCase();
        const nodeDescription = node.data.description?.toLowerCase() || '';
        return nodeName.includes(searchLower) ||
               nodeId.includes(searchLower) ||
               nodeDescription.includes(searchLower);
      }

      return true;
    });
  }, [initialNodes, filters, searchQuery]);

  // Filter edges to only show those connected to visible nodes
  const filteredEdges = useMemo(() => {
    const visibleNodeIds = new Set(filteredNodes.map(n => n.id));
    return initialEdges.filter(edge =>
      visibleNodeIds.has(edge.source) && visibleNodeIds.has(edge.target)
    );
  }, [initialEdges, filteredNodes]);

  const [nodes, setNodes, onNodesChange] = useNodesState(filteredNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(filteredEdges);

  // Update nodes when filters change
  useEffect(() => {
    setNodes(filteredNodes);
  }, [filteredNodes, setNodes]);

  // Update edges when filtered edges change
  useEffect(() => {
    setEdges(filteredEdges);
  }, [filteredEdges, setEdges]);

  const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    setSelectedNodeId(node.id);
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-500">Loading graph...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-red-500">Error loading graph: {error.message}</div>
      </div>
    );
  }

  if (!graph || graph.nodes.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-500">No nodes in graph</div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        nodeTypes={nodeTypes}
        fitView
        minZoom={0.1}
        maxZoom={2}
      >
        <Controls />
        <Background />
        <MiniMap
          nodeColor={(node) => {
            switch (node.type) {
              case 'intent': return '#9333ea';
              case 'subintent': return '#2563eb';
              case 'feature': return '#16a34a';
              case 'task': return '#ea580c';
              case 'uxspec': return '#db2777';
              default: return '#6b7280';
            }
          }}
          pannable
          zoomable
        />

        <Panel position="top-left">
          <GraphControls
            onSearchChange={setSearchQuery}
            onFilterChange={setFilters}
          />
        </Panel>
      </ReactFlow>

      {selectedNodeId && graph && (
        <NodeDetail
          nodeId={selectedNodeId}
          nodes={graph.nodes}
          edges={graph.edges}
          onClose={() => setSelectedNodeId(null)}
        />
      )}
    </div>
  );
}

// Wrapper with ReactFlowProvider
export function GraphView({ projectId }: GraphViewProps) {
  return (
    <ReactFlowProvider>
      <GraphViewInner projectId={projectId} />
    </ReactFlowProvider>
  );
}
