import { Dependency, DependencyType } from '../models/Dependency';
import { Graph, GraphNode } from '../models/Graph';
import { ValidationResult } from './dag';

export class DependencyValidator {
  /**
   * Validate dependency based on type-specific rules
   */
  static validate(dependency: Dependency, graph: Graph): ValidationResult {
    switch (dependency.type) {
      case DependencyType.Requires:
        return this.validateRequires(dependency, graph);
      case DependencyType.Blocks:
        return this.validateBlocks(dependency, graph);
      case DependencyType.Impacts:
        return this.validateImpacts(dependency, graph);
      case DependencyType.Supersedes:
        return this.validateSupersedes(dependency, graph);
      default:
        return { valid: false, error: `Unknown dependency type: ${dependency.type}` };
    }
  }

  /**
   * Validate "requires" dependency
   * - Target node must exist
   * - Target node must not be deprecated (superseded)
   */
  static validateRequires(dependency: Dependency, graph: Graph): ValidationResult {
    const fromNode = graph.nodes.get(dependency.from_id);
    const toNode = graph.nodes.get(dependency.to_id);

    if (!fromNode) {
      return { valid: false, error: `Source node ${dependency.from_id} not found` };
    }

    if (!toNode) {
      return { valid: false, error: `Target node ${dependency.to_id} not found` };
    }

    // Check if target is superseded (deprecated)
    const isSuperseded = Array.from(graph.edges.values()).some(
      edge => edge.type === DependencyType.Supersedes && edge.from_id === dependency.to_id
    );

    if (isSuperseded) {
      return { valid: false, error: `Target node ${dependency.to_id} is deprecated` };
    }

    return { valid: true };
  }

  /**
   * Validate "blocks" dependency
   * - Both nodes must exist
   */
  static validateBlocks(dependency: Dependency, graph: Graph): ValidationResult {
    const fromNode = graph.nodes.get(dependency.from_id);
    const toNode = graph.nodes.get(dependency.to_id);

    if (!fromNode) {
      return { valid: false, error: `Source node ${dependency.from_id} not found` };
    }

    if (!toNode) {
      return { valid: false, error: `Target node ${dependency.to_id} not found` };
    }

    return { valid: true };
  }

  /**
   * Validate "impacts" dependency
   * - Both nodes must exist
   */
  static validateImpacts(dependency: Dependency, graph: Graph): ValidationResult {
    const fromNode = graph.nodes.get(dependency.from_id);
    const toNode = graph.nodes.get(dependency.to_id);

    if (!fromNode) {
      return { valid: false, error: `Source node ${dependency.from_id} not found` };
    }

    if (!toNode) {
      return { valid: false, error: `Target node ${dependency.to_id} not found` };
    }

    return { valid: true };
  }

  /**
   * Validate "supersedes" dependency
   * - Both nodes must exist
   * - Both nodes must be the same entity type
   */
  static validateSupersedes(dependency: Dependency, graph: Graph): ValidationResult {
    const fromNode = graph.nodes.get(dependency.from_id);
    const toNode = graph.nodes.get(dependency.to_id);

    if (!fromNode) {
      return { valid: false, error: `Source node ${dependency.from_id} not found` };
    }

    if (!toNode) {
      return { valid: false, error: `Target node ${dependency.to_id} not found` };
    }

    // Check if both nodes are same type
    const fromType = this.getNodeType(fromNode);
    const toType = this.getNodeType(toNode);

    if (fromType !== toType) {
      return {
        valid: false,
        error: `Supersedes requires same node types, got ${fromType} and ${toType}`
      };
    }

    return { valid: true };
  }

  private static getNodeType(node: GraphNode): string {
    if ('linked_sub_intents' in node) return 'ProductIntent';
    if ('parent_intent' in node) return 'SubIntent';
    if ('linked_intent' in node) return 'Feature';
    if ('parent_feature' in node) return 'Task';
    if ('linked_feature' in node) return 'UXSpec';
    return 'Unknown';
  }
}
