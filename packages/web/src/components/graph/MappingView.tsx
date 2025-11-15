'use client';

import React, { useMemo, useState, useCallback, useEffect } from 'react';
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
  ConnectionLineType,
} from 'reactflow';
import 'reactflow/dist/style.css';

import { FlowActionNode } from './nodes/FlowActionNode';
import { CapabilityNode } from './nodes/CapabilityNode';
import { useMappings } from '@/lib/hooks/useMappings';
import type { FlowToCapabilityMapping, FlowAction, Capability } from '@pottery/core/types';

interface MappingViewProps {
  projectId: string;
}

const nodeTypes = {
  flowaction: FlowActionNode,
  capability: CapabilityNode,
};

function MappingViewInner({ projectId }: MappingViewProps) {
  const { mappings, flowActions, capabilities, isLoading, error } = useMappings(projectId);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMappingId, setSelectedMappingId] = useState<string | null>(null);
  const [selectedFlowActionId, setSelectedFlowActionId] = useState<string | null>(null);
  const [selectedCapabilityId, setSelectedCapabilityId] = useState<string | null>(null);

  // Filter nodes based on search
  const filteredFlowActions = useMemo(() => {
    if (!searchQuery) return flowActions;
    const query = searchQuery.toLowerCase();
    return flowActions.filter(action =>
      action.name.toLowerCase().includes(query) ||
      action.description.toLowerCase().includes(query) ||
      action.id.toLowerCase().includes(query)
    );
  }, [flowActions, searchQuery]);

  const filteredCapabilities = useMemo(() => {
    if (!searchQuery) return capabilities;
    const query = searchQuery.toLowerCase();
    return capabilities.filter(cap =>
      cap.name.toLowerCase().includes(query) ||
      cap.description.toLowerCase().includes(query) ||
      cap.id.toLowerCase().includes(query)
    );
  }, [capabilities, searchQuery]);

  // Filter mappings based on filtered nodes
  const filteredMappings = useMemo(() => {
    const filteredActionIds = new Set(filteredFlowActions.map(a => a.id));
    const filteredCapIds = new Set(filteredCapabilities.map(c => c.id));
    
    return mappings.filter(mapping =>
      filteredActionIds.has(mapping.flowActionId) &&
      mapping.capabilityIds.some(capId => filteredCapIds.has(capId))
    );
  }, [mappings, filteredFlowActions, filteredCapabilities]);

  // Convert to React Flow nodes and edges
  const { nodes, edges } = useMemo(() => {
    const reactFlowNodes: Node[] = [];
    const reactFlowEdges: Edge[] = [];

    // Create flow action nodes (left side)
    const leftColumnX = 100;
    const rightColumnX = 800;
    const nodeHeight = 120;
    const verticalSpacing = 140;

    // Build a map for quick lookups
    const actionMap = new Map<string, FlowAction>();
    const capabilityMap = new Map<string, Capability>();

    filteredFlowActions.forEach(action => {
      actionMap.set(action.id, action);
    });

    filteredCapabilities.forEach(cap => {
      capabilityMap.set(cap.id, cap);
    });

    // Calculate positions for flow actions (left column)
    filteredFlowActions.forEach((action, index) => {
      reactFlowNodes.push({
        id: action.id,
        type: 'flowaction',
        position: { x: leftColumnX, y: index * verticalSpacing + 50 },
        data: action,
        selected: selectedFlowActionId === action.id,
      });
    });

    // Calculate positions for capabilities (right column)
    filteredCapabilities.forEach((cap, index) => {
      reactFlowNodes.push({
        id: cap.id,
        type: 'capability',
        position: { x: rightColumnX, y: index * verticalSpacing + 50 },
        data: cap,
        selected: selectedCapabilityId === cap.id,
      });
    });

    // Create edges from mappings
    filteredMappings.forEach((mapping, mappingIndex) => {
      const actionNode = reactFlowNodes.find(n => n.id === mapping.flowActionId);
      if (!actionNode) return;

      mapping.capabilityIds.forEach((capabilityId) => {
        const capabilityNode = reactFlowNodes.find(n => n.id === capabilityId);
        if (!capabilityNode) return;

        const isHighlighted =
          selectedMappingId === mapping.id ||
          (selectedFlowActionId === mapping.flowActionId) ||
          (selectedCapabilityId === capabilityId);

        reactFlowEdges.push({
          id: `edge-${mapping.id}-${capabilityId}`,
          source: mapping.flowActionId,
          target: capabilityId,
          type: 'smoothstep',
          animated: isHighlighted,
          style: {
            stroke: isHighlighted ? '#9333ea' : '#9ca3af',
            strokeWidth: isHighlighted ? 3 : 2,
          },
          label: mapping.rationale ? (
            <div className="text-xs bg-white px-2 py-1 rounded shadow">
              {mapping.rationale.length > 40
                ? `${mapping.rationale.substring(0, 37)}...`
                : mapping.rationale}
            </div>
          ) : undefined,
          data: {
            mapping,
          },
        });
      });
    });

    return { nodes: reactFlowNodes, edges: reactFlowEdges };
  }, [filteredFlowActions, filteredCapabilities, filteredMappings, selectedMappingId, selectedFlowActionId, selectedCapabilityId]);

  const [reactFlowNodes, setReactFlowNodes, onNodesChange] = useNodesState(nodes);
  const [reactFlowEdges, setReactFlowEdges, onEdgesChange] = useEdgesState(edges);

  // Update nodes and edges when they change
  useEffect(() => {
    setReactFlowNodes(nodes);
    setReactFlowEdges(edges);
  }, [nodes, edges, setReactFlowNodes, setReactFlowEdges]);

  const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    if (node.type === 'flowaction') {
      setSelectedFlowActionId(node.id === selectedFlowActionId ? null : node.id);
      setSelectedCapabilityId(null);
      setSelectedMappingId(null);
    } else if (node.type === 'capability') {
      setSelectedCapabilityId(node.id === selectedCapabilityId ? null : node.id);
      setSelectedFlowActionId(null);
      setSelectedMappingId(null);
    }
  }, [selectedFlowActionId, selectedCapabilityId]);

  const onEdgeClick = useCallback((event: React.MouseEvent, edge: Edge) => {
    if (edge.data?.mapping) {
      setSelectedMappingId(edge.data.mapping.id === selectedMappingId ? null : edge.data.mapping.id);
      setSelectedFlowActionId(null);
      setSelectedCapabilityId(null);
    }
  }, [selectedMappingId]);

  if (isLoading) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-gray-500">Loading mappings...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-red-500">Error loading mappings: {String(error)}</div>
      </div>
    );
  }

  if (mappings.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-gray-500">No mappings found in this project</div>
      </div>
    );
  }

  // Get selected mapping details for sidebar
  const selectedMapping = selectedMappingId
    ? mappings.find(m => m.id === selectedMappingId)
    : null;

  return (
    <div className="w-full h-full flex">
      <ReactFlow
        nodes={reactFlowNodes}
        edges={reactFlowEdges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        onEdgeClick={onEdgeClick}
        nodeTypes={nodeTypes}
        connectionLineType={ConnectionLineType.SmoothStep}
        fitView
        minZoom={0.2}
        maxZoom={2}
      >
        <Background />
        <Controls />
        <MiniMap />
        <Panel position="top-left" className="bg-white p-4 rounded shadow-lg m-4">
          <div className="flex flex-col gap-4">
            <div>
              <h3 className="font-bold text-lg mb-2">Flow-to-Capability Mappings</h3>
              <div className="text-sm text-gray-600">
                {mappings.length} mapping{mappings.length !== 1 ? 's' : ''} • {flowActions.length} flow actions • {capabilities.length} capabilities
              </div>
            </div>
            <div>
              <input
                type="text"
                placeholder="Search actions or capabilities..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
              />
            </div>
            <div className="text-xs text-gray-500">
              <p>💡 Click on nodes or edges to see details</p>
              <p>💡 Edges show rationale on hover</p>
            </div>
          </div>
        </Panel>
      </ReactFlow>

      {/* Sidebar for selected mapping details */}
      {selectedMapping && (
        <div className="w-80 bg-white border-l border-gray-200 p-4 overflow-y-auto">
          <div className="mb-4">
            <button
              onClick={() => setSelectedMappingId(null)}
              className="text-gray-500 hover:text-gray-700 text-sm"
            >
              ← Close
            </button>
          </div>
          <h3 className="font-bold text-lg mb-4">Mapping Details</h3>
          <div className="space-y-4">
            <div>
              <div className="text-xs text-gray-500 font-mono mb-1">ID</div>
              <div className="text-sm">{selectedMapping.id}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500 mb-1">Flow Action</div>
              <div className="text-sm font-medium">
                {flowActions.find(a => a.id === selectedMapping.flowActionId)?.name || selectedMapping.flowActionId}
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-500 mb-1">Required Capabilities</div>
              <div className="space-y-2">
                {selectedMapping.capabilityIds.map(capId => {
                  const cap = capabilities.find(c => c.id === capId);
                  return (
                    <div key={capId} className="text-sm bg-green-50 p-2 rounded">
                      <div className="font-medium">{cap?.name || capId}</div>
                      {cap?.description && (
                        <div className="text-xs text-gray-600 mt-1">{cap.description}</div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-500 mb-1">Rationale</div>
              <div className="text-sm text-gray-700 bg-gray-50 p-3 rounded">
                {selectedMapping.rationale || '(no rationale provided)'}
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-500 mb-1">Metadata</div>
              <div className="text-xs text-gray-600 space-y-1">
                <div>Version: {selectedMapping.version}</div>
                <div>Created: {new Date(selectedMapping.created_at).toLocaleDateString()}</div>
                <div>Updated: {new Date(selectedMapping.updated_at).toLocaleDateString()}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sidebar for selected node details */}
      {(selectedFlowActionId || selectedCapabilityId) && !selectedMapping && (
        <div className="w-80 bg-white border-l border-gray-200 p-4 overflow-y-auto">
          <div className="mb-4">
            <button
              onClick={() => {
                setSelectedFlowActionId(null);
                setSelectedCapabilityId(null);
              }}
              className="text-gray-500 hover:text-gray-700 text-sm"
            >
              ← Close
            </button>
          </div>
          {selectedFlowActionId && (() => {
            const action = flowActions.find(a => a.id === selectedFlowActionId);
            if (!action) return null;
            const relatedMappings = mappings.filter(m => m.flowActionId === selectedFlowActionId);
            return (
              <>
                <h3 className="font-bold text-lg mb-4">Flow Action: {action.name}</h3>
                <div className="space-y-4">
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Description</div>
                    <div className="text-sm">{action.description || '(no description)'}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 mb-2">Required Capabilities ({relatedMappings.length})</div>
                    <div className="space-y-2">
                      {relatedMappings.flatMap(m => m.capabilityIds).map(capId => {
                        const cap = capabilities.find(c => c.id === capId);
                        return (
                          <div key={capId} className="text-sm bg-green-50 p-2 rounded">
                            <div className="font-medium">{cap?.name || capId}</div>
                            {cap?.description && (
                              <div className="text-xs text-gray-600 mt-1">{cap.description}</div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </>
            );
          })()}
          {selectedCapabilityId && (() => {
            const cap = capabilities.find(c => c.id === selectedCapabilityId);
            if (!cap) return null;
            const relatedMappings = mappings.filter(m => m.capabilityIds.includes(selectedCapabilityId));
            return (
              <>
                <h3 className="font-bold text-lg mb-4">Capability: {cap.name}</h3>
                <div className="space-y-4">
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Description</div>
                    <div className="text-sm">{cap.description || '(no description)'}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 mb-2">Used by Flow Actions ({relatedMappings.length})</div>
                    <div className="space-y-2">
                      {relatedMappings.map(m => {
                        const action = flowActions.find(a => a.id === m.flowActionId);
                        return (
                          <div key={m.id} className="text-sm bg-purple-50 p-2 rounded">
                            <div className="font-medium">{action?.name || m.flowActionId}</div>
                            {m.rationale && (
                              <div className="text-xs text-gray-600 mt-1">{m.rationale}</div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </>
            );
          })()}
        </div>
      )}
    </div>
  );
}

export function MappingView({ projectId }: MappingViewProps) {
  return (
    <ReactFlowProvider>
      <div className="w-full h-full">
        <MappingViewInner projectId={projectId} />
      </div>
    </ReactFlowProvider>
  );
}
