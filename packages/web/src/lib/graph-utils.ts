import dagre from 'dagre';
import { Node, Edge } from 'reactflow';
import type { GraphNode, Dependency, Layer, Epic, UserStory, Capability, FlowScreen, FlowAction, TechnicalRequirement } from '@pottery/core/types';

/**
 * Calculate hierarchical layout for graph nodes using Dagre
 * @param nodes - React Flow nodes
 * @param edges - React Flow edges
 * @param layoutType - 'hierarchical' (TB) for feature graph, 'flow' (LR) for flow graph
 */
export function layoutGraph(
  nodes: Node[],
  edges: Edge[],
  layoutType: 'hierarchical' | 'flow' = 'hierarchical'
): { nodes: Node[]; edges: Edge[] } {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));

  // Configure layout based on type
  if (layoutType === 'flow') {
    // Left-to-right layout for flow graphs
    dagreGraph.setGraph({
      rankdir: 'LR',  // Left to right
      ranksep: 150,   // Horizontal spacing between ranks
      nodesep: 100,   // Vertical spacing between nodes
      edgesep: 50,    // Spacing between edges
      marginx: 50,    // Margin on x-axis
      marginy: 50     // Margin on y-axis
    });
  } else {
    // Top-to-bottom layout for feature graphs
    dagreGraph.setGraph({
      rankdir: 'TB',  // Top to bottom
      ranksep: 150,   // Vertical spacing between ranks
      nodesep: 100,   // Horizontal spacing between nodes
      edgesep: 50,    // Spacing between edges
      marginx: 50,    // Margin on x-axis
      marginy: 50     // Margin on y-axis
    });
  }

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
    case 'intent': return 280;
    case 'subintent': return 250;
    case 'feature': return 230;
    case 'task': return 210;
    case 'uxspec': return 210;
    case 'epic': return 250;
    case 'userstory': return 220;
    case 'capability': return 230;
    case 'technicalrequirement': return 210;
    case 'flowscreen': return 240;
    case 'flowaction': return 230;
    default: return 230;
  }
}

function getNodeHeight(type?: string): number {
  return 100;  // Increased from 80 to account for padding
}

/**
 * Determine node type from node ID prefix
 */
function getNodeType(node: GraphNode | Epic | UserStory | Capability | FlowScreen | FlowAction | TechnicalRequirement): string {
  if (node.id.startsWith('intent-')) return 'intent';
  if (node.id.startsWith('subintent-')) return 'subintent';
  if (node.id.startsWith('feature-')) return 'feature';
  if (node.id.startsWith('task-')) return 'task';
  if (node.id.startsWith('uxspec-')) return 'uxspec';
  if (node.id.startsWith('epic-')) return 'epic';
  if (node.id.startsWith('story-')) return 'userstory';
  if (node.id.startsWith('cap-')) return 'capability';
  if (node.id.startsWith('screen-')) return 'flowscreen';
  if (node.id.startsWith('action-')) return 'flowaction';
  if (node.id.startsWith('req-')) return 'technicalrequirement';
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
function extractHierarchicalEdges(nodes: (GraphNode | Epic | UserStory | Capability | FlowScreen | FlowAction | TechnicalRequirement)[]): Edge[] {
  const edges: Edge[] = [];
  let edgeIdCounter = 0;

  nodes.forEach(node => {
    // ProductIntent -> SubIntents (legacy)
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

    // SubIntent -> Features (legacy)
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

    // Feature -> Tasks (legacy)
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

    // Feature -> UXSpec (legacy)
    if (node.id.startsWith('feature-') && 'ux_spec' in node && node.ux_spec) {
      edges.push({
        id: `hierarchy-${edgeIdCounter++}`,
        source: node.id,
        target: node.ux_spec,
        type: 'default',
        style: { strokeWidth: 2, stroke: '#db2777', strokeDasharray: '5,5' }
      });
    }

    // Epic -> UserStories (layered)
    if (node.id.startsWith('epic-') && 'userStories' in node) {
      node.userStories.forEach(storyId => {
        edges.push({
          id: `hierarchy-${edgeIdCounter++}`,
          source: node.id,
          target: storyId,
          type: 'default',
          style: { strokeWidth: 2, stroke: '#9333ea' }
        });
      });
    }

    // UserStory -> Capabilities (cross-layer, via linkedCapabilities)
    if (node.id.startsWith('story-') && 'linkedCapabilities' in node) {
      node.linkedCapabilities.forEach(capId => {
        edges.push({
          id: `crosslayer-${edgeIdCounter++}`,
          source: node.id,
          target: capId,
          type: 'smoothstep',
          style: { strokeWidth: 2, stroke: '#a855f7', strokeDasharray: '3,3' }
        });
      });
    }

    // Capability -> TechnicalRequirements (cross-layer, via linkedTechnicalReqs)
    if (node.id.startsWith('cap-') && 'linkedTechnicalReqs' in node) {
      node.linkedTechnicalReqs.forEach(reqId => {
        edges.push({
          id: `crosslayer-${edgeIdCounter++}`,
          source: node.id,
          target: reqId,
          type: 'smoothstep',
          style: { strokeWidth: 2, stroke: '#10b981', strokeDasharray: '3,3' }
        });
      });
    }

    // TechnicalRequirement -> Tasks (cross-layer, via linkedTasks)
    if (node.id.startsWith('req-') && 'linkedTasks' in node) {
      node.linkedTasks.forEach(taskId => {
        edges.push({
          id: `crosslayer-${edgeIdCounter++}`,
          source: node.id,
          target: taskId,
          type: 'smoothstep',
          style: { strokeWidth: 2, stroke: '#f97316', strokeDasharray: '3,3' }
        });
      });
    }

    // FlowScreen -> FlowActions (flow graph, via actions)
    if (node.id.startsWith('screen-') && 'actions' in node) {
      node.actions.forEach(actionId => {
        edges.push({
          id: `flow-${edgeIdCounter++}`,
          source: node.id,
          target: actionId,
          type: 'default',
          style: { strokeWidth: 2, stroke: '#3b82f6' }
        });
      });
    }

    // FlowAction -> FlowScreen (flow graph, via nextScreen)
    if (node.id.startsWith('action-') && 'nextScreen' in node && node.nextScreen) {
      edges.push({
        id: `flow-transition-${edgeIdCounter++}`,
        source: node.id,
        target: node.nextScreen,
        type: 'smoothstep',
        style: { strokeWidth: 2, stroke: '#8b5cf6', strokeDasharray: '5,5' }
      });
    }

    // FlowScreen -> FlowScreen (flow graph, via entryTransitions)
    if (node.id.startsWith('screen-') && 'entryTransitions' in node) {
      node.entryTransitions.forEach(entryScreenId => {
        edges.push({
          id: `flow-entry-${edgeIdCounter++}`,
          source: entryScreenId,
          target: node.id,
          type: 'smoothstep',
          style: { strokeWidth: 2, stroke: '#60a5fa', strokeDasharray: '3,3' }
        });
      });
    }

    // FlowAction -> Capability (many-to-many mapping, via linkedCapabilities)
    if (node.id.startsWith('action-') && 'linkedCapabilities' in node) {
      (node as FlowAction).linkedCapabilities.forEach(capId => {
        edges.push({
          id: `mapping-${edgeIdCounter++}`,
          source: node.id,
          target: capId,
          type: 'smoothstep',
          style: { strokeWidth: 2, stroke: '#10b981', strokeDasharray: '2,2' }
        });
      });
    }
  });

  return edges;
}

/**
 * Convert graph data to React Flow format (legacy or layered)
 * @param nodes - Graph nodes
 * @param edges - Graph edges
 * @param graphType - 'feature' for feature graph, 'flow' for flow graph, 'both' for combined
 */
export function convertToReactFlow(
  nodes: (GraphNode | Epic | UserStory | Capability | FlowScreen | FlowAction | TechnicalRequirement)[],
  edges: Dependency[],
  graphType: 'feature' | 'flow' | 'both' = 'both'
): { nodes: Node[]; edges: Edge[] } {
  // Filter nodes based on graph type
  // Note: This function is called with nodes that are already filtered by layer
  // When graphType is specified, it's only relevant for structure layer nodes
  let filteredNodes = nodes;
  if (graphType === 'feature') {
    // Only show capabilities (feature graph)
    filteredNodes = nodes.filter(node => node.id.startsWith('cap-'));
  } else if (graphType === 'flow') {
    // Only show flow screens and actions (flow graph)
    filteredNodes = nodes.filter(node => 
      node.id.startsWith('screen-') || node.id.startsWith('action-')
    );
  }
  // 'both' shows all structure layer nodes (capabilities + screens + actions)
  // This is handled by the API route which returns both graphs when graphType is 'both'

  // Filter edges based on visible nodes
  const visibleNodeIds = new Set(filteredNodes.map(n => n.id));
  const filteredEdges = edges.filter(edge =>
    visibleNodeIds.has(edge.from_id) && visibleNodeIds.has(edge.to_id)
  );

  const flowNodes: Node[] = filteredNodes.map(node => ({
    id: node.id,
    type: getNodeType(node),
    data: node,
    position: { x: 0, y: 0 } // Will be set by layoutGraph
  }));

  // Create edges from explicit dependencies
  const dependencyEdges: Edge[] = filteredEdges.map(edge => ({
    id: edge.id,
    source: edge.from_id,
    target: edge.to_id,
    type: getEdgeType(edge.type),
    label: edge.type,
    animated: edge.type === 'impacts',
    style: getEdgeStyle(edge.type)
  }));

  // Extract hierarchical edges from node relationships
  const hierarchicalEdges = extractHierarchicalEdges(filteredNodes);

  // Combine all edges
  const allEdges = [...hierarchicalEdges, ...dependencyEdges];

  // Use flow layout for flow graph, hierarchical for feature graph
  const layoutType = graphType === 'flow' ? 'flow' : 'hierarchical';
  
  return layoutGraph(flowNodes, allEdges, layoutType);
}
