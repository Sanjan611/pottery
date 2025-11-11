import { b } from './baml_client/baml_client';
import {
  Graph,
  GraphNode,
  ChangeRequest,
  NodeModification,
  ProductIntent,
  SubIntent,
  Feature,
  Task,
  TaskType,
  UXSpec,
  Dependency,
  DependencyType,
  ImpactMapEntry
} from '@pottery/core';
import { v4 as uuidv4 } from 'uuid';

export class Planner {
  /**
   * Generate initial project structure from user intent
   */
  async createProject(userIntent: string): Promise<Partial<ChangeRequest>> {
    // Call BAML function
    const productIntent = await b.CreateProjectStructure(userIntent);

    // Convert BAML output to internal graph structure
    const newNodes = this.convertToGraphNodes(productIntent);
    const dependencies = this.extractDependencies(productIntent);

    // Return as ChangeRequest format
    return {
      description: 'Initial project structure',
      initiator: 'ai',
      new_nodes: newNodes,
      modified_nodes: [],
      new_dependencies: dependencies,
      impact_map: []
    };
  }

  /**
   * Analyze a change request and generate CR plan
   */
  async analyzeChange(
    currentGraph: Graph,
    changeDescription: string
  ): Promise<Partial<ChangeRequest>> {
    // Serialize graph to JSON for BAML
    const graphJSON = this.serializeGraph(currentGraph);

    // Call BAML function
    const crPlan = await b.AnalyzeChange(graphJSON, changeDescription);

    // Convert plan to ChangeRequest format
    return this.convertPlanToCR(crPlan, currentGraph);
  }

  /**
   * Convert BAML ProductIntent to GraphNodes
   */
  private convertToGraphNodes(productIntent: any): GraphNode[] {
    const nodes: GraphNode[] = [];
    const now = new Date().toISOString();

    // Create ProductIntent node
    const intentId = `intent-${uuidv4()}`;
    const intent: ProductIntent = {
      id: intentId,
      name: productIntent.name,
      description: productIntent.description,
      version: '1.0.0',
      linked_sub_intents: [],
      created_at: now,
      updated_at: now
    };
    nodes.push(intent);

    // Create SubIntents
    const subIntentMap = new Map<string, string>(); // name -> id
    for (const subIntent of productIntent.sub_intents || []) {
      const subIntentId = `subintent-${uuidv4()}`;
      subIntentMap.set(subIntent.name, subIntentId);

      const subIntentNode: SubIntent = {
        id: subIntentId,
        parent_intent: intentId,
        name: subIntent.name,
        description: subIntent.description,
        version: '1.0.0',
        linked_features: [],
        created_at: now,
        updated_at: now
      };
      nodes.push(subIntentNode);
      intent.linked_sub_intents.push(subIntentId);
    }

    // Create Features and Tasks
    const featureMap = new Map<string, string>(); // name -> id
    const taskMap = new Map<string, string>(); // description -> id

    // Process features from SubIntents
    for (const subIntent of productIntent.sub_intents || []) {
      const subIntentId = subIntentMap.get(subIntent.name);
      if (!subIntentId) continue;

      const subIntentNode = nodes.find(n => n.id === subIntentId) as SubIntent;

      for (const feature of subIntent.features || []) {
        const featureId = `feature-${uuidv4()}`;
        featureMap.set(feature.name, featureId);

        const featureNode: Feature = {
          id: featureId,
          name: feature.name,
          description: feature.description,
          version: '1.0.0',
          linked_intent: subIntentId,
          linked_tasks: [],
          created_at: now,
          updated_at: now
        };

        // Add UX Spec if present
        if (feature.ux_spec) {
          const uxSpecId = `uxspec-${uuidv4()}`;
          const uxSpec: UXSpec = {
            id: uxSpecId,
            linked_feature: featureId,
            experience_goal: feature.ux_spec.experience_goal,
            design_refs: feature.ux_spec.design_refs || [],
            created_at: now
          };
          nodes.push(uxSpec);
          featureNode.ux_spec = uxSpecId;
        }

        nodes.push(featureNode);
        subIntentNode.linked_features.push(featureId);

        // Create tasks for this feature
        for (const task of feature.tasks || []) {
          const taskId = `task-${uuidv4()}`;
          taskMap.set(task.description, taskId);

          const taskNode: Task = {
            id: taskId,
            parent_feature: featureId,
            type: this.convertTaskType(task.type),
            description: task.description,
            version: '1.0.0',
            dependencies: [],
            created_at: now,
            updated_at: now
          };
          nodes.push(taskNode);
          featureNode.linked_tasks.push(taskId);
        }
      }
    }

    return nodes;
  }

  /**
   * Extract dependencies from ProductIntent structure
   */
  private extractDependencies(productIntent: any): Dependency[] {
    const dependencies: Dependency[] = [];
    // For MVP, we'll create basic hierarchical dependencies
    // Full dependency extraction from task dependencies can be added later
    return dependencies;
  }

  /**
   * Serialize graph to JSON string for AI consumption
   */
  private serializeGraph(graph: Graph): string {
    const simplified = {
      version: graph.version,
      nodes: Array.from(graph.nodes.values()).map(node => {
        const nodeType = this.getNodeType(node);
        return {
          type: nodeType,
          ...node
        };
      }),
      edges: Array.from(graph.edges.values())
    };
    return JSON.stringify(simplified, null, 2);
  }

  /**
   * Convert BAML ChangeRequestPlan to ChangeRequest
   */
  private convertPlanToCR(plan: any, currentGraph: Graph): Partial<ChangeRequest> {
    const newNodes: GraphNode[] = [];
    const modifiedNodes: NodeModification[] = [];
    const now = new Date().toISOString();

    // Create a map of SubIntent names to IDs from the current graph
    const subIntentNameToId = new Map<string, string>();
    for (const [id, node] of currentGraph.nodes.entries()) {
      if ('parent_intent' in node) {
        subIntentNameToId.set(node.name, id);
      }
    }

    // Track which SubIntents need to be modified (to add new features)
    const subIntentModifications = new Map<string, string[]>();

    // Create new features
    for (const feature of plan.new_features || []) {
      const featureId = `feature-${uuidv4()}`;

      // Resolve SubIntent name to ID
      const linkedIntentId = feature.linked_intent
        ? subIntentNameToId.get(feature.linked_intent) || ''
        : '';

      const featureNode: Feature = {
        id: featureId,
        name: feature.name,
        description: feature.description,
        version: '1.0.0',
        linked_intent: linkedIntentId,
        linked_tasks: [],
        created_at: now,
        updated_at: now
      };

      newNodes.push(featureNode);

      // Track SubIntent modification
      if (linkedIntentId) {
        if (!subIntentModifications.has(linkedIntentId)) {
          subIntentModifications.set(linkedIntentId, []);
        }
        subIntentModifications.get(linkedIntentId)!.push(featureId);
      }

      // Create tasks for this feature
      for (const task of feature.tasks || []) {
        const taskId = `task-${uuidv4()}`;
        const taskNode: Task = {
          id: taskId,
          parent_feature: featureId,
          type: this.convertTaskType(task.type),
          description: task.description,
          version: '1.0.0',
          dependencies: [],
          created_at: now,
          updated_at: now
        };
        newNodes.push(taskNode);
        featureNode.linked_tasks.push(taskId);
      }
    }

    // Create NodeModifications for SubIntents that have new features
    for (const [subIntentId, newFeatureIds] of subIntentModifications.entries()) {
      const subIntentNode = currentGraph.nodes.get(subIntentId);
      if (subIntentNode && 'linked_features' in subIntentNode) {
        modifiedNodes.push({
          node_id: subIntentId,
          old_version: subIntentNode.version,
          new_version: subIntentNode.version, // Version bumping should happen in ProjectStore
          changes: {
            linked_features: [...subIntentNode.linked_features, ...newFeatureIds]
          }
        });
      }
    }

    // Build impact map
    const impactMap: ImpactMapEntry[] = (plan.impact_analysis?.affected_features || []).map((f: string) => ({
      node_id: f,
      node_type: 'Feature',
      impact_type: 'impacts' as const,
      reason: plan.impact_analysis?.reasoning || ''
    }));

    return {
      description: plan.description,
      initiator: 'ai',
      new_nodes: newNodes,
      modified_nodes: modifiedNodes,
      new_dependencies: [],
      impact_map: impactMap
    };
  }

  private convertTaskType(type: string): TaskType {
    const typeMap: Record<string, TaskType> = {
      'Backend': TaskType.Backend,
      'Frontend': TaskType.Frontend,
      'Test': TaskType.Test,
      'Infrastructure': TaskType.Infrastructure
    };
    return typeMap[type] || TaskType.Backend;
  }

  private getNodeType(node: GraphNode): string {
    if ('linked_sub_intents' in node) return 'ProductIntent';
    if ('parent_intent' in node) return 'SubIntent';
    if ('linked_intent' in node) return 'Feature';
    if ('parent_feature' in node) return 'Task';
    if ('linked_feature' in node) return 'UXSpec';
    return 'Unknown';
  }
}
