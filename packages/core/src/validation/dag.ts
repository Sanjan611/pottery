import { Graph } from '../models/Graph';
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
}
