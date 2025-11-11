import dagre from 'dagre';
import { Node, Edge } from 'reactflow';
import type { GraphNode, Dependency } from '@pottery/core';

/**
 * Calculate hierarchical layout for graph nodes using Dagre
 */
export function layoutGraph(
  nodes: Node[],
  edges: Edge[]
): { nodes: Node[]; edges: Edge[] } {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));

  // Configure layout: top-to-bottom, spacing between nodes
  dagreGraph.setGraph({
    rankdir: 'TB',  // Top to bottom
    ranksep: 150,   // Vertical spacing between ranks (increased)
    nodesep: 100,   // Horizontal spacing between nodes (increased)
    edgesep: 50,    // Spacing between edges
    marginx: 50,    // Margin on x-axis
    marginy: 50     // Margin on y-axis
  });

  // Add all nodes with their dimensions
  nodes.forEach(node => {
    dagreGraph.setNode(node.id, {
      width: getNodeWidth(node.type),
      height: getNodeHeight(node.type)
    });
  });

  // Add all edges
  edges.forEach(edge => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  // Calculate layout
  dagre.layout(dagreGraph);

  // Apply calculated positions to nodes
  const layoutedNodes = nodes.map(node => {
    const dagreNode = dagreGraph.node(node.id);
    return {
      ...node,
      position: {
        x: dagreNode.x - getNodeWidth(node.type) / 2,
        y: dagreNode.y - getNodeHeight(node.type) / 2
      }
    };
  });

  return { nodes: layoutedNodes, edges };
}

function getNodeWidth(type?: string): number {
  switch (type) {
    case 'intent': return 280;      // Increased from 250
    case 'subintent': return 250;   // Increased from 220
    case 'feature': return 230;     // Increased from 200
    case 'task': return 210;        // Increased from 180
    case 'uxspec': return 210;      // Increased from 180
    default: return 230;
  }
}

function getNodeHeight(type?: string): number {
  return 100;  // Increased from 80 to account for padding
}

/**
 * Determine node type from node ID prefix
 */
function getNodeType(node: GraphNode): string {
  if (node.id.startsWith('intent-')) return 'intent';
  if (node.id.startsWith('subintent-')) return 'subintent';
  if (node.id.startsWith('feature-')) return 'feature';
  if (node.id.startsWith('task-')) return 'task';
  if (node.id.startsWith('uxspec-')) return 'uxspec';
  return 'default';
}

/**
 * Get React Flow edge type from dependency type
 */
function getEdgeType(depType: string): string {
  switch (depType) {
    case 'requires': return 'default';
    case 'blocks': return 'step';
    case 'impacts': return 'smoothstep';
    case 'supersedes': return 'straight';
    default: return 'default';
  }
}

/**
 * Get edge style based on dependency type
 */
function getEdgeStyle(depType: string) {
  switch (depType) {
    case 'requires':
      return { strokeWidth: 2 };
    case 'blocks':
      return { strokeWidth: 2, strokeDasharray: '5,5' };
    case 'impacts':
      return { strokeWidth: 2, strokeDasharray: '2,2' };
    case 'supersedes':
      return { strokeWidth: 3 };
    default:
      return { strokeWidth: 2 };
  }
}

/**
 * Extract hierarchical edges from node relationships
 */
function extractHierarchicalEdges(nodes: GraphNode[]): Edge[] {
  const edges: Edge[] = [];
  let edgeIdCounter = 0;

  nodes.forEach(node => {
    // ProductIntent -> SubIntents
    if (node.id.startsWith('intent-') && 'linked_sub_intents' in node) {
      node.linked_sub_intents.forEach(subIntentId => {
        edges.push({
          id: `hierarchy-${edgeIdCounter++}`,
          source: node.id,
          target: subIntentId,
          type: 'default',
          style: { strokeWidth: 2, stroke: '#9333ea' }
        });
      });
    }

    // SubIntent -> Features
    if (node.id.startsWith('subintent-') && 'linked_features' in node) {
      node.linked_features.forEach(featureId => {
        edges.push({
          id: `hierarchy-${edgeIdCounter++}`,
          source: node.id,
          target: featureId,
          type: 'default',
          style: { strokeWidth: 2, stroke: '#2563eb' }
        });
      });
    }

    // Feature -> Tasks
    if (node.id.startsWith('feature-') && 'linked_tasks' in node) {
      node.linked_tasks.forEach(taskId => {
        edges.push({
          id: `hierarchy-${edgeIdCounter++}`,
          source: node.id,
          target: taskId,
          type: 'default',
          style: { strokeWidth: 2, stroke: '#16a34a' }
        });
      });
    }

    // Feature -> UXSpec
    if (node.id.startsWith('feature-') && 'ux_spec' in node && node.ux_spec) {
      edges.push({
        id: `hierarchy-${edgeIdCounter++}`,
        source: node.id,
        target: node.ux_spec,
        type: 'default',
        style: { strokeWidth: 2, stroke: '#db2777', strokeDasharray: '5,5' }
      });
    }
  });

  return edges;
}

/**
 * Convert graph data to React Flow format
 */
export function convertToReactFlow(
  nodes: GraphNode[],
  edges: Dependency[]
): { nodes: Node[]; edges: Edge[] } {
  const flowNodes: Node[] = nodes.map(node => ({
    id: node.id,
    type: getNodeType(node),
    data: node,
    position: { x: 0, y: 0 } // Will be set by layoutGraph
  }));

  // Create edges from explicit dependencies
  const dependencyEdges: Edge[] = edges.map(edge => ({
    id: edge.id,
    source: edge.from_id,
    target: edge.to_id,
    type: getEdgeType(edge.type),
    label: edge.type,
    animated: edge.type === 'impacts',
    style: getEdgeStyle(edge.type)
  }));

  // Extract hierarchical edges from node relationships
  const hierarchicalEdges = extractHierarchicalEdges(nodes);

  // Combine all edges
  const allEdges = [...hierarchicalEdges, ...dependencyEdges];

  return layoutGraph(flowNodes, allEdges);
}
