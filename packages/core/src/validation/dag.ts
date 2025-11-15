import { Graph, LayeredGraph } from '../models/Graph';
import { Dependency } from '../models/Dependency';

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

export class DAGValidator {
  /**
   * Detect cycles in the graph using depth-first search
   * @returns Array of node IDs forming the cycle, or null if no cycle exists
   */
  static detectCycle(graph: Graph): string[] | null {
    const visited = new Set<string>();
    const recursionStack = new Set<string>();
    const path: string[] = [];

    // Build adjacency list
    const adjList = this.buildAdjacencyList(graph);

    // Check each node for cycles
    for (const nodeId of graph.nodes.keys()) {
      if (!visited.has(nodeId)) {
        const cycle = this.dfs(nodeId, adjList, visited, recursionStack, path);
        if (cycle) {
          return cycle;
        }
      }
    }

    return null;
  }

  /**
   * Check if adding an edge would create a cycle
   */
  static wouldCreateCycle(
    graph: Graph,
    fromId: string,
    toId: string
  ): boolean {
    // Create temporary graph with new edge
    const tempEdges = new Map(graph.edges);
    const tempDep: Dependency = {
      id: 'temp-dep',
      from_id: fromId,
      to_id: toId,
      type: 'requires' as any,
      created_at: new Date().toISOString()
    };
    tempEdges.set('temp-dep', tempDep);

    const tempGraph: Graph = {
      ...graph,
      edges: tempEdges
    };

    return this.detectCycle(tempGraph) !== null;
  }

  /**
   * Get topological sort of graph
   * @returns Array of node IDs in topological order, or null if cycle exists
   */
  static topologicalSort(graph: Graph): string[] | null {
    const cycle = this.detectCycle(graph);
    if (cycle) {
      return null;
    }

    const visited = new Set<string>();
    const result: string[] = [];
    const adjList = this.buildAdjacencyList(graph);

    for (const nodeId of graph.nodes.keys()) {
      if (!visited.has(nodeId)) {
        this.topologicalSortUtil(nodeId, adjList, visited, result);
      }
    }

    return result.reverse();
  }

  // Private helper methods

  private static buildAdjacencyList(graph: Graph): Map<string, string[]> {
    const adjList = new Map<string, string[]>();

    // Initialize adjacency list for all nodes
    for (const nodeId of graph.nodes.keys()) {
      adjList.set(nodeId, []);
    }

    // Build adjacency list from edges
    for (const edge of graph.edges.values()) {
      const neighbors = adjList.get(edge.from_id) || [];
      neighbors.push(edge.to_id);
      adjList.set(edge.from_id, neighbors);
    }

    return adjList;
  }

  private static dfs(
    nodeId: string,
    adjList: Map<string, string[]>,
    visited: Set<string>,
    recursionStack: Set<string>,
    path: string[]
  ): string[] | null {
    visited.add(nodeId);
    recursionStack.add(nodeId);
    path.push(nodeId);

    const neighbors = adjList.get(nodeId) || [];
    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        const cycle = this.dfs(neighbor, adjList, visited, recursionStack, path);
        if (cycle) {
          return cycle;
        }
      } else if (recursionStack.has(neighbor)) {
        // Found a cycle - extract the cycle from path
        const cycleStart = path.indexOf(neighbor);
        return path.slice(cycleStart).concat([neighbor]);
      }
    }

    recursionStack.delete(nodeId);
    path.pop();
    return null;
  }

  private static topologicalSortUtil(
    nodeId: string,
    adjList: Map<string, string[]>,
    visited: Set<string>,
    result: string[]
  ): void {
    visited.add(nodeId);

    const neighbors = adjList.get(nodeId) || [];
    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        this.topologicalSortUtil(neighbor, adjList, visited, result);
      }
    }

    result.push(nodeId);
  }

  // ========================================
  // Layered Graph Validation (Phase 1)
  // ========================================

  /**
   * Validate layered graph structure
   * Ensures each layer is a DAG and cross-layer dependencies don't create cycles
   */
  static validateLayeredGraph(graph: LayeredGraph): ValidationResult {
    // Validate narrative layer
    const narrativeResult = this.validateLayer(
      graph.narrativeLayer.nodes,
      graph.narrativeLayer.edges,
      'Narrative'
    );
    if (!narrativeResult.valid) {
      return narrativeResult;
    }

    // Validate structure layer - feature graph
    const featureGraphResult = this.validateLayer(
      graph.structureLayer.featureGraph.nodes,
      graph.structureLayer.featureGraph.edges,
      'Structure (Feature Graph)'
    );
    if (!featureGraphResult.valid) {
      return featureGraphResult;
    }

    // Validate structure layer - flow graph
    const flowGraphResult = this.validateLayer(
      graph.structureLayer.flowGraph.nodes,
      graph.structureLayer.flowGraph.edges,
      'Structure (Flow Graph)'
    );
    if (!flowGraphResult.valid) {
      return flowGraphResult;
    }

    // Validate flow graph specific constraints
    const flowConstraintsResult = this.validateFlowGraphConstraints(graph);
    if (!flowConstraintsResult.valid) {
      return flowConstraintsResult;
    }

    // Validate specification layer
    const specificationResult = this.validateLayer(
      graph.specificationLayer.nodes,
      graph.specificationLayer.edges,
      'Specification'
    );
    if (!specificationResult.valid) {
      return specificationResult;
    }

    // Validate cross-layer dependencies don't create global cycles
    const crossLayerResult = this.validateCrossLayerDependencies(graph);
    if (!crossLayerResult.valid) {
      return crossLayerResult;
    }

    return { valid: true };
  }

  /**
   * Validate a single layer
   */
  private static validateLayer(
    nodes: Map<string, any>,
    edges: Map<string, Dependency>,
    layerName: string
  ): ValidationResult {
    // Create a temporary graph for this layer
    const layerGraph: Graph = {
      version: 'temp',
      nodes: nodes,
      edges: edges,
      metadata: {
        created_at: '',
        last_modified: ''
      }
    };

    // Check for cycles
    const cycle = this.detectCycle(layerGraph);
    if (cycle) {
      return {
        valid: false,
        error: `Cycle detected in ${layerName} layer: ${cycle.join(' -> ')}`
      };
    }

    return { valid: true };
  }

  /**
   * Validate cross-layer dependencies
   * Ensures that cross-layer dependencies don't create cycles when combined with layer graphs
   */
  private static validateCrossLayerDependencies(graph: LayeredGraph): ValidationResult {
    // Build a combined adjacency list including cross-layer dependencies
    const adjList = new Map<string, string[]>();

    // Add all nodes from all layers
    for (const nodeId of graph.narrativeLayer.nodes.keys()) {
      adjList.set(nodeId, []);
    }
    for (const nodeId of graph.structureLayer.featureGraph.nodes.keys()) {
      adjList.set(nodeId, []);
    }
    for (const nodeId of graph.structureLayer.flowGraph.nodes.keys()) {
      adjList.set(nodeId, []);
    }
    for (const nodeId of graph.specificationLayer.nodes.keys()) {
      adjList.set(nodeId, []);
    }

    // Add edges from narrative layer
    for (const edge of graph.narrativeLayer.edges.values()) {
      const neighbors = adjList.get(edge.from_id) || [];
      neighbors.push(edge.to_id);
      adjList.set(edge.from_id, neighbors);
    }

    // Add edges from structure layer - feature graph
    for (const edge of graph.structureLayer.featureGraph.edges.values()) {
      const neighbors = adjList.get(edge.from_id) || [];
      neighbors.push(edge.to_id);
      adjList.set(edge.from_id, neighbors);
    }

    // Add edges from structure layer - flow graph
    for (const edge of graph.structureLayer.flowGraph.edges.values()) {
      const neighbors = adjList.get(edge.from_id) || [];
      neighbors.push(edge.to_id);
      adjList.set(edge.from_id, neighbors);
    }

    // Add edges from specification layer
    for (const edge of graph.specificationLayer.edges.values()) {
      const neighbors = adjList.get(edge.from_id) || [];
      neighbors.push(edge.to_id);
      adjList.set(edge.from_id, neighbors);
    }

    // Add cross-layer dependencies
    for (const crossDep of graph.crossLayerDependencies.values()) {
      const neighbors = adjList.get(crossDep.fromNodeId) || [];
      neighbors.push(crossDep.toNodeId);
      adjList.set(crossDep.fromNodeId, neighbors);
    }

    // Check for cycles in the combined graph
    const visited = new Set<string>();
    const recursionStack = new Set<string>();
    const path: string[] = [];

    for (const nodeId of adjList.keys()) {
      if (!visited.has(nodeId)) {
        const cycle = this.dfs(nodeId, adjList, visited, recursionStack, path);
        if (cycle) {
          return {
            valid: false,
            error: `Cross-layer dependency creates a cycle: ${cycle.join(' -> ')}`
          };
        }
      }
    }

    return { valid: true };
  }

  /**
   * Detect if adding a cross-layer dependency would create a cycle
   */
  static wouldCreateCrossLayerCycle(
    graph: LayeredGraph,
    fromNodeId: string,
    toNodeId: string
  ): boolean {
    // Create temporary graph with new cross-layer dependency
    const tempCrossLayerDeps = new Map(graph.crossLayerDependencies);
    tempCrossLayerDeps.set('temp-cross-dep', {
      id: 'temp-cross-dep',
      type: 'narrative_to_structure' as any,
      fromNodeId: fromNodeId,
      toNodeId: toNodeId,
      fromLayer: 'narrative' as any,
      toLayer: 'structure' as any,
      rationale: 'temp'
    });

    const tempGraph: LayeredGraph = {
      ...graph,
      crossLayerDependencies: tempCrossLayerDeps
    };

    const result = this.validateCrossLayerDependencies(tempGraph);
    return !result.valid;
  }

  /**
   * Validate flow graph specific constraints
   * - Flow actions must reference valid parent screens
   * - nextScreen references must exist
   * - Screen transitions don't create cycles
   */
  private static validateFlowGraphConstraints(graph: LayeredGraph): ValidationResult {
    const flowNodes = graph.structureLayer.flowGraph.nodes;
    const flowEdges = graph.structureLayer.flowGraph.edges;

    // Validate flow actions reference valid parent screens
    for (const [nodeId, node] of flowNodes.entries()) {
      if (nodeId.startsWith('action-')) {
        const action = node as any;
        if (action.parentScreen) {
          if (!flowNodes.has(action.parentScreen)) {
            return {
              valid: false,
              error: `Flow action ${nodeId} references non-existent parent screen: ${action.parentScreen}`
            };
          }
        }
      }
    }

    // Validate nextScreen references exist
    for (const [nodeId, node] of flowNodes.entries()) {
      if (nodeId.startsWith('action-')) {
        const action = node as any;
        if (action.nextScreen) {
          if (!flowNodes.has(action.nextScreen)) {
            return {
              valid: false,
              error: `Flow action ${nodeId} references non-existent next screen: ${action.nextScreen}`
            };
          }
          // nextScreen must be a screen, not an action
          if (action.nextScreen.startsWith('action-')) {
            return {
              valid: false,
              error: `Flow action ${nodeId} references another action as nextScreen: ${action.nextScreen} (must be a screen)`
            };
          }
        }
      }
    }

    // Validate screen entryTransitions reference valid screens
    for (const [nodeId, node] of flowNodes.entries()) {
      if (nodeId.startsWith('screen-')) {
        const screen = node as any;
        if (screen.entryTransitions && Array.isArray(screen.entryTransitions)) {
          for (const entryScreenId of screen.entryTransitions) {
            if (!flowNodes.has(entryScreenId)) {
              return {
                valid: false,
                error: `Flow screen ${nodeId} references non-existent entry transition: ${entryScreenId}`
              };
            }
            // entryTransitions must be screens, not actions
            if (entryScreenId.startsWith('action-')) {
              return {
                valid: false,
                error: `Flow screen ${nodeId} references an action as entry transition: ${entryScreenId} (must be a screen)`
              };
            }
          }
        }
      }
    }

    return { valid: true };
  }
}
