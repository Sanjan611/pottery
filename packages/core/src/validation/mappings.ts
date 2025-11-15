import { LayeredGraph } from '../models/Graph';
import { FlowToCapabilityMapping } from '../models/FlowToCapabilityMapping';

export interface MappingValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export class MappingValidator {
  /**
   * Validate all mappings in a layered graph
   */
  static validateMappings(graph: LayeredGraph): MappingValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Get all flow action IDs from flow graph
    const flowActionIds = new Set<string>();
    for (const [id, node] of graph.structureLayer.flowGraph.nodes) {
      if (id.startsWith('action-')) {
        flowActionIds.add(id);
      }
    }

    // Get all capability IDs from feature graph
    const capabilityIds = new Set<string>();
    for (const [id] of graph.structureLayer.featureGraph.nodes) {
      capabilityIds.add(id);
    }

    // Track which flow actions have mappings
    const actionHasMapping = new Set<string>();

    // Validate each mapping
    for (const [mappingId, mapping] of graph.structureLayer.mappings) {
      // Validate flow action exists
      if (!flowActionIds.has(mapping.flowActionId)) {
        errors.push(
          `Mapping "${mappingId}" references non-existent flow action "${mapping.flowActionId}"`
        );
        continue;
      }

      actionHasMapping.add(mapping.flowActionId);

      // Validate all capability IDs exist
      for (const capabilityId of mapping.capabilityIds) {
        if (!capabilityIds.has(capabilityId)) {
          errors.push(
            `Mapping "${mappingId}" references non-existent capability "${capabilityId}"`
          );
        }
      }

      // Warn if mapping has no capabilities
      if (mapping.capabilityIds.length === 0) {
        warnings.push(
          `Mapping "${mappingId}" for flow action "${mapping.flowActionId}" has no capabilities`
        );
      }

      // Validate rationale is not empty
      if (!mapping.rationale || mapping.rationale.trim().length === 0) {
        warnings.push(
          `Mapping "${mappingId}" has no rationale`
        );
      }
    }

    // Warn about flow actions without mappings
    for (const actionId of flowActionIds) {
      if (!actionHasMapping.has(actionId)) {
        warnings.push(
          `Flow action "${actionId}" has no mappings`
        );
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Check if a mapping would be valid before adding it
   */
  static wouldCreateValidMapping(
    graph: LayeredGraph,
    mapping: FlowToCapabilityMapping
  ): { valid: boolean; error?: string } {
    // Check if flow action exists
    const flowActionExists = graph.structureLayer.flowGraph.nodes.has(mapping.flowActionId);
    if (!flowActionExists) {
      return {
        valid: false,
        error: `Flow action "${mapping.flowActionId}" does not exist`
      };
    }

    // Check if all capabilities exist
    for (const capabilityId of mapping.capabilityIds) {
      if (!graph.structureLayer.featureGraph.nodes.has(capabilityId)) {
        return {
          valid: false,
          error: `Capability "${capabilityId}" does not exist`
        };
      }
    }

    return { valid: true };
  }

  /**
   * Find orphaned mappings (references to deleted nodes)
   */
  static findOrphanedMappings(graph: LayeredGraph): FlowToCapabilityMapping[] {
    const orphaned: FlowToCapabilityMapping[] = [];

    const flowActionIds = new Set<string>();
    for (const [id, node] of graph.structureLayer.flowGraph.nodes) {
      if (id.startsWith('action-')) {
        flowActionIds.add(id);
      }
    }

    const capabilityIds = new Set<string>();
    for (const [id] of graph.structureLayer.featureGraph.nodes) {
      capabilityIds.add(id);
    }

    for (const [mappingId, mapping] of graph.structureLayer.mappings) {
      // Check if flow action still exists
      if (!flowActionIds.has(mapping.flowActionId)) {
        orphaned.push(mapping);
        continue;
      }

      // Check if all capabilities still exist
      for (const capabilityId of mapping.capabilityIds) {
        if (!capabilityIds.has(capabilityId)) {
          orphaned.push(mapping);
          break;
        }
      }
    }

    return orphaned;
  }
}
