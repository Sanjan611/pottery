import { LayeredGraph } from '../models/Graph';
import { CrossLayerDependency, CrossLayerDependencyType } from '../models/Graph';
import { Layer } from '../models/Layer';
import { Epic } from '../models/Epic';
import { UserStory } from '../models/UserStory';
import { Capability } from '../models/Capability';
import { TechnicalRequirement } from '../models/TechnicalRequirement';
import { Task } from '../models/Task';
import { FlowScreen } from '../models/FlowScreen';
import { FlowAction } from '../models/FlowAction';
import { FlowToCapabilityMapping } from '../models/FlowToCapabilityMapping';

export interface ImpactReport {
  targetNode: string;
  targetLayer: Layer;
  affectedNodes: Map<Layer, string[]>;
  impactedFlows: string[];      // Which user flows are affected
  impactedCapabilities: string[]; // Which capabilities are affected
  impactedTasks: string[];       // Which tasks need updating
  impactedRequirements: string[]; // Which technical requirements are affected
  crossLayerDependencies: CrossLayerDependency[]; // New or modified cross-layer deps
}

export interface TraceReport {
  epicId?: string;
  userStories: string[];
  capabilities: string[];
  flowActions: string[];
  requirements: string[];
  tasks: string[];
  path: string[]; // Full dependency path
}

export class ImpactAnalyzer {
  private graph: LayeredGraph;

  constructor(graph: LayeredGraph) {
    this.graph = graph;
  }

  /**
   * Analyze the full impact of changing a given node
   */
  analyzeImpact(nodeId: string): ImpactReport {
    const targetNode = this.findNode(nodeId);
    if (!targetNode) {
      throw new Error(`Node ${nodeId} not found in graph`);
    }

    const targetLayer = this.getNodeLayer(nodeId);
    const affectedNodes = new Map<Layer, string[]>();
    
    // Initialize all layers
    affectedNodes.set(Layer.Narrative, []);
    affectedNodes.set(Layer.Structure, []);
    affectedNodes.set(Layer.Specification, []);

    // Get all downstream dependencies (what depends on this node)
    const downstream = this.getDownstreamImpact(nodeId);
    
    // Get all upstream dependencies (what this node depends on)
    const upstream = this.getUpstreamImpact(nodeId);

    // Get cross-layer impact
    const crossLayerImpact = this.getCrossLayerImpact(nodeId);

    // Combine all affected nodes
    const allAffected = new Set<string>([...downstream, ...upstream, ...crossLayerImpact]);

    // Categorize by layer
    for (const affectedId of allAffected) {
      const layer = this.getNodeLayer(affectedId);
      const current = affectedNodes.get(layer) || [];
      if (!current.includes(affectedId)) {
        current.push(affectedId);
        affectedNodes.set(layer, current);
      }
    }

    // Extract specific node types
    const impactedFlows: string[] = [];
    const impactedCapabilities: string[] = [];
    const impactedTasks: string[] = [];
    const impactedRequirements: string[] = [];

    for (const affectedId of allAffected) {
      if (affectedId.startsWith('action-') || affectedId.startsWith('screen-')) {
        impactedFlows.push(affectedId);
      } else if (affectedId.startsWith('cap-')) {
        impactedCapabilities.push(affectedId);
      } else if (affectedId.startsWith('task-')) {
        impactedTasks.push(affectedId);
      } else if (affectedId.startsWith('req-')) {
        impactedRequirements.push(affectedId);
      }
    }

    // Find relevant cross-layer dependencies
    const relevantCrossLayerDeps = Array.from(this.graph.crossLayerDependencies.values())
      .filter(dep => dep.fromNodeId === nodeId || dep.toNodeId === nodeId);

    return {
      targetNode: nodeId,
      targetLayer,
      affectedNodes,
      impactedFlows,
      impactedCapabilities,
      impactedTasks,
      impactedRequirements,
      crossLayerDependencies: relevantCrossLayerDeps
    };
  }

  /**
   * Find all nodes that depend on the given node (downstream)
   */
  getDownstreamImpact(nodeId: string): string[] {
    const visited = new Set<string>();
    const result: string[] = [];

    // BFS traversal to find all downstream dependencies
    const queue: string[] = [nodeId];
    visited.add(nodeId);

    while (queue.length > 0) {
      const current = queue.shift()!;

      // Check within-layer dependencies
      const withinLayerDeps = this.getWithinLayerDependencies(current);
      for (const dep of withinLayerDeps) {
        if (!visited.has(dep)) {
          visited.add(dep);
          result.push(dep);
          queue.push(dep);
        }
      }

      // Check cross-layer dependencies where current is the source
      const crossLayerDeps = Array.from(this.graph.crossLayerDependencies.values())
        .filter(dep => dep.fromNodeId === current);
      
      for (const dep of crossLayerDeps) {
        if (!visited.has(dep.toNodeId)) {
          visited.add(dep.toNodeId);
          result.push(dep.toNodeId);
          queue.push(dep.toNodeId);
        }
      }

      // Check mappings (flow actions to capabilities)
      if (current.startsWith('action-')) {
        const mappings = Array.from(this.graph.structureLayer.mappings.values())
          .filter(m => m.flowActionId === current);
        
        for (const mapping of mappings) {
          for (const capId of mapping.capabilityIds) {
            if (!visited.has(capId)) {
              visited.add(capId);
              result.push(capId);
              queue.push(capId);
            }
          }
        }
      }

      // Check reverse mappings (capabilities to flow actions)
      if (current.startsWith('cap-')) {
        const mappings = Array.from(this.graph.structureLayer.mappings.values())
          .filter(m => m.capabilityIds.includes(current));
        
        for (const mapping of mappings) {
          if (!visited.has(mapping.flowActionId)) {
            visited.add(mapping.flowActionId);
            result.push(mapping.flowActionId);
            queue.push(mapping.flowActionId);
          }
        }
      }
    }

    return result;
  }

  /**
   * Find all nodes that the given node depends on (upstream)
   */
  getUpstreamImpact(nodeId: string): string[] {
    const visited = new Set<string>();
    const result: string[] = [];

    // BFS traversal to find all upstream dependencies
    const queue: string[] = [nodeId];
    visited.add(nodeId);

    while (queue.length > 0) {
      const current = queue.shift()!;

      // Check within-layer dependencies (reverse direction)
      const withinLayerDeps = this.getWithinLayerDependenciesReverse(current);
      for (const dep of withinLayerDeps) {
        if (!visited.has(dep)) {
          visited.add(dep);
          result.push(dep);
          queue.push(dep);
        }
      }

      // Check cross-layer dependencies where current is the target
      const crossLayerDeps = Array.from(this.graph.crossLayerDependencies.values())
        .filter(dep => dep.toNodeId === current);
      
      for (const dep of crossLayerDeps) {
        if (!visited.has(dep.fromNodeId)) {
          visited.add(dep.fromNodeId);
          result.push(dep.fromNodeId);
          queue.push(dep.fromNodeId);
        }
      }

      // Check mappings (capabilities to flow actions - reverse)
      if (current.startsWith('cap-')) {
        const mappings = Array.from(this.graph.structureLayer.mappings.values())
          .filter(m => m.capabilityIds.includes(current));
        
        for (const mapping of mappings) {
          if (!visited.has(mapping.flowActionId)) {
            visited.add(mapping.flowActionId);
            result.push(mapping.flowActionId);
            queue.push(mapping.flowActionId);
          }
        }
      }

      // Check reverse mappings (flow actions to capabilities - reverse)
      if (current.startsWith('action-')) {
        const mappings = Array.from(this.graph.structureLayer.mappings.values())
          .filter(m => m.flowActionId === current);
        
        for (const mapping of mappings) {
          for (const capId of mapping.capabilityIds) {
            if (!visited.has(capId)) {
              visited.add(capId);
              result.push(capId);
              queue.push(capId);
            }
          }
        }
      }
    }

    return result;
  }

  /**
   * Get cross-layer impact for a node
   */
  getCrossLayerImpact(nodeId: string): string[] {
    const result: string[] = [];

    // Find all cross-layer dependencies involving this node
    const crossLayerDeps = Array.from(this.graph.crossLayerDependencies.values())
      .filter(dep => dep.fromNodeId === nodeId || dep.toNodeId === nodeId);

    for (const dep of crossLayerDeps) {
      const otherNode = dep.fromNodeId === nodeId ? dep.toNodeId : dep.fromNodeId;
      if (!result.includes(otherNode)) {
        result.push(otherNode);
      }
    }

    return result;
  }

  /**
   * Trace from narrative (Epic) to implementation (Tasks)
   */
  traceNarrativeToImplementation(epicId: string): TraceReport {
    const path: string[] = [epicId];
    const userStories: string[] = [];
    const capabilities: string[] = [];
    const flowActions: string[] = [];
    const requirements: string[] = [];
    const tasks: string[] = [];

    // Find epic
    const epic = this.graph.narrativeLayer.nodes.get(epicId) as Epic | undefined;
    if (!epic) {
      throw new Error(`Epic ${epicId} not found`);
    }

    // Get all user stories in this epic
    for (const storyId of epic.userStories) {
      const story = this.graph.narrativeLayer.nodes.get(storyId) as UserStory | undefined;
      if (story) {
        userStories.push(storyId);
        path.push(storyId);

        // Find linked capabilities
        for (const capId of story.linkedCapabilities) {
          const cap = this.graph.structureLayer.featureGraph.nodes.get(capId) as Capability | undefined;
          if (cap && !capabilities.includes(capId)) {
            capabilities.push(capId);
            path.push(capId);

            // Find linked technical requirements
            for (const reqId of cap.linkedTechnicalReqs) {
              const req = this.graph.specificationLayer.nodes.get(reqId) as TechnicalRequirement | undefined;
              if (req && !requirements.includes(reqId)) {
                requirements.push(reqId);
                path.push(reqId);

                // Find linked tasks
                for (const taskId of req.linkedTasks) {
                  if (!tasks.includes(taskId)) {
                    tasks.push(taskId);
                    path.push(taskId);
                  }
                }
              }
            }
          }
        }
      }
    }

    // Also check flow actions through mappings
    for (const mapping of this.graph.structureLayer.mappings.values()) {
      for (const capId of mapping.capabilityIds) {
        if (capabilities.includes(capId)) {
          if (!flowActions.includes(mapping.flowActionId)) {
            flowActions.push(mapping.flowActionId);
            path.push(mapping.flowActionId);
          }
        }
      }
    }

    return {
      epicId,
      userStories,
      capabilities,
      flowActions,
      requirements,
      tasks,
      path
    };
  }

  /**
   * Trace from implementation (Task) back to narrative (Epic)
   */
  traceImplementationToNarrative(taskId: string): TraceReport {
    const path: string[] = [taskId];
    const requirements: string[] = [];
    const capabilities: string[] = [];
    const flowActions: string[] = [];
    const userStories: string[] = [];
    let epicId: string | undefined;

    // Find task
    const task = this.graph.specificationLayer.nodes.get(taskId) as Task | undefined;
    if (!task) {
      throw new Error(`Task ${taskId} not found`);
    }

    // Find technical requirements that link to this task
    for (const req of this.graph.specificationLayer.nodes.values()) {
      if (req.id.startsWith('req-')) {
        const techReq = req as TechnicalRequirement;
        if (techReq.linkedTasks.includes(taskId)) {
          if (!requirements.includes(techReq.id)) {
            requirements.push(techReq.id);
            path.push(techReq.id);

            // Find linked capabilities
            for (const capId of techReq.linkedCapabilities) {
              const cap = this.graph.structureLayer.featureGraph.nodes.get(capId) as Capability | undefined;
              if (cap && !capabilities.includes(capId)) {
                capabilities.push(capId);
                path.push(capId);

                // Find linked user stories
                for (const storyId of cap.linkedUserStories) {
                  const story = this.graph.narrativeLayer.nodes.get(storyId) as UserStory | undefined;
                  if (story && !userStories.includes(storyId)) {
                    userStories.push(storyId);
                    path.push(storyId);

                    // Find parent epic
                    if (story.parentEpic && !epicId) {
                      epicId = story.parentEpic;
                      path.push(epicId);
                    }
                  }
                }
              }
            }
          }
        }
      }
    }

    // Also check flow actions through mappings
    for (const mapping of this.graph.structureLayer.mappings.values()) {
      for (const capId of mapping.capabilityIds) {
        if (capabilities.includes(capId)) {
          if (!flowActions.includes(mapping.flowActionId)) {
            flowActions.push(mapping.flowActionId);
            path.push(mapping.flowActionId);
          }
        }
      }
    }

    return {
      epicId,
      userStories,
      capabilities,
      flowActions,
      requirements,
      tasks: [taskId],
      path
    };
  }

  /**
   * Helper: Find a node by ID across all layers
   */
  private findNode(nodeId: string): any {
    return this.graph.narrativeLayer.nodes.get(nodeId) ||
           this.graph.structureLayer.featureGraph.nodes.get(nodeId) ||
           this.graph.structureLayer.flowGraph.nodes.get(nodeId) ||
           this.graph.specificationLayer.nodes.get(nodeId);
  }

  /**
   * Helper: Get the layer a node belongs to
   */
  private getNodeLayer(nodeId: string): Layer {
    if (this.graph.narrativeLayer.nodes.has(nodeId)) {
      return Layer.Narrative;
    } else if (this.graph.structureLayer.featureGraph.nodes.has(nodeId) ||
               this.graph.structureLayer.flowGraph.nodes.has(nodeId)) {
      return Layer.Structure;
    } else if (this.graph.specificationLayer.nodes.has(nodeId)) {
      return Layer.Specification;
    }
    throw new Error(`Cannot determine layer for node ${nodeId}`);
  }

  /**
   * Helper: Get within-layer dependencies (downstream)
   */
  private getWithinLayerDependencies(nodeId: string): string[] {
    const layer = this.getNodeLayer(nodeId);
    const result: string[] = [];

    let edges: Map<string, any>;
    if (layer === Layer.Narrative) {
      edges = this.graph.narrativeLayer.edges;
    } else if (layer === Layer.Structure) {
      // Check both feature and flow graphs
      const featureEdges = this.graph.structureLayer.featureGraph.edges;
      const flowEdges = this.graph.structureLayer.flowGraph.edges;
      edges = new Map([...featureEdges, ...flowEdges]);
    } else {
      edges = this.graph.specificationLayer.edges;
    }

    for (const dep of edges.values()) {
      if (dep.from_id === nodeId) {
        result.push(dep.to_id);
      }
    }

    return result;
  }

  /**
   * Helper: Get within-layer dependencies (upstream/reverse)
   */
  private getWithinLayerDependenciesReverse(nodeId: string): string[] {
    const layer = this.getNodeLayer(nodeId);
    const result: string[] = [];

    let edges: Map<string, any>;
    if (layer === Layer.Narrative) {
      edges = this.graph.narrativeLayer.edges;
    } else if (layer === Layer.Structure) {
      const featureEdges = this.graph.structureLayer.featureGraph.edges;
      const flowEdges = this.graph.structureLayer.flowGraph.edges;
      edges = new Map([...featureEdges, ...flowEdges]);
    } else {
      edges = this.graph.specificationLayer.edges;
    }

    for (const dep of edges.values()) {
      if (dep.to_id === nodeId) {
        result.push(dep.from_id);
      }
    }

    return result;
  }
}

