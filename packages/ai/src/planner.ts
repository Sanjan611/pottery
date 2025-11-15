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
  ImpactMapEntry,
  Layer,
  LayeredGraph,
  Epic,
  UserStory,
  Capability,
  FlowScreen,
  FlowAction,
  FlowActionTriggerType,
  TechnicalRequirement,
  FlowToCapabilityMapping,
  CrossLayerDependency,
  CrossLayerDependencyType
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
            layer: Layer.Specification,
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
          layer: Layer.Specification,
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

  // ========================================
  // Layered Project Methods (Phase 1)
  // ========================================

  /**
   * Create complete layered project structure from user intent
   * Orchestrates creation of all three layers
   */
  async createLayeredProject(userIntent: string): Promise<Partial<ChangeRequest>> {
    const now = new Date().toISOString();

    // Call BAML function to create layered project
    const layeredProject = await b.CreateLayeredProject(userIntent);

    // Convert BAML output to layered graph structure
    const { nodes, crossLayerDeps, mappings } = this.convertLayeredProjectToNodes(layeredProject);

    // Return as ChangeRequest format (mappings and cross-layer deps will be handled separately by the store)
    return {
      description: 'Initial layered project structure',
      initiator: 'ai',
      new_nodes: nodes,
      modified_nodes: [],
      new_dependencies: [],
      impact_map: [],
      // Store mappings and cross-layer deps in custom fields that the store can access
      _mappings: mappings || [],
      _crossLayerDeps: crossLayerDeps || []
    } as any;
  }

  /**
   * Create narrative layer from user intent
   */
  async createNarrativeLayer(userIntent: string): Promise<{
    epics: Epic[];
    userStories: UserStory[];
  }> {
    const narrativeLayer = await b.CreateNarrativeLayer(userIntent);
    return this.convertNarrativeLayer(narrativeLayer);
  }

  /**
   * Create structure layer based on narrative
   */
  async createStructureLayer(narrativeLayer: any): Promise<{
    capabilities: Capability[];
    flowScreens: FlowScreen[];
    flowActions: FlowAction[];
  }> {
    const structureLayer = await b.CreateStructureLayer(narrativeLayer);
    return this.convertStructureLayer(structureLayer);
  }

  /**
   * Create specification layer based on structure
   */
  async createSpecificationLayer(structureLayer: any): Promise<{
    technicalRequirements: TechnicalRequirement[];
    tasks: Task[];
  }> {
    const specificationLayer = await b.CreateSpecificationLayer(structureLayer);
    return this.convertSpecificationLayer(specificationLayer);
  }

  /**
   * Convert BAML LayeredProject to internal node structure
   */
  private convertLayeredProjectToNodes(layeredProject: any): {
    nodes: GraphNode[];
    crossLayerDeps: CrossLayerDependency[];
    mappings: FlowToCapabilityMapping[];
  } {
    const nodes: GraphNode[] = [];
    const crossLayerDeps: CrossLayerDependency[] = [];
    const now = new Date().toISOString();

    // Maps for resolving names to IDs
    const epicNameToId = new Map<string, string>();
    const storyNameToId = new Map<string, string>();
    const capabilityNameToId = new Map<string, string>();
    const techReqNameToId = new Map<string, string>();

    // NARRATIVE LAYER: Create Epics
    for (const epic of layeredProject.narrativeLayer?.epics || []) {
      const epicId = `epic-${uuidv4()}`;
      epicNameToId.set(epic.name, epicId);

      const epicNode: Epic = {
        id: epicId,
        name: epic.name,
        description: epic.description,
        userStories: [], // Will be populated later
        version: '1.0.0',
        layer: Layer.Narrative,
        created_at: now,
        updated_at: now
      };
      nodes.push(epicNode);
    }

    // NARRATIVE LAYER: Create User Stories
    for (const story of layeredProject.narrativeLayer?.userStories || []) {
      const storyId = `story-${uuidv4()}`;
      storyNameToId.set(story.narrative, storyId);

      // Resolve parent epic
      const parentEpicId = epicNameToId.get(story.epicName) || '';

      const storyNode: UserStory = {
        id: storyId,
        narrative: story.narrative,
        acceptanceCriteria: story.acceptanceCriteria || [],
        linkedCapabilities: [], // Will be resolved later
        parentEpic: parentEpicId,
        version: '1.0.0',
        layer: Layer.Narrative,
        created_at: now,
        updated_at: now
      };
      nodes.push(storyNode);

      // Add story to parent epic
      if (parentEpicId) {
        const epicNode = nodes.find(n => n.id === parentEpicId) as Epic;
        if (epicNode) {
          epicNode.userStories.push(storyId);
        }
      }
    }

    // STRUCTURE LAYER - FEATURE GRAPH: Create Capabilities
    for (const capability of layeredProject.structureLayer?.capabilities || []) {
      const capabilityId = `cap-${uuidv4()}`;
      capabilityNameToId.set(capability.name, capabilityId);

      const capabilityNode: Capability = {
        id: capabilityId,
        name: capability.name,
        description: capability.description,
        linkedUserStories: [], // Will be resolved later
        linkedTechnicalReqs: [], // Will be resolved later
        version: '1.0.0',
        layer: Layer.Structure,
        created_at: now,
        updated_at: now
      };
      nodes.push(capabilityNode);
    }

    // STRUCTURE LAYER - FLOW GRAPH: Create Flow Screens and Actions
    // Maps for resolving screen and action names to IDs
    const screenNameToId = new Map<string, string>();
    const actionNameToId = new Map<string, string>();

    // Create FlowScreens first (actions reference screens)
    for (const screen of layeredProject.structureLayer?.flowScreens || []) {
      const screenId = `screen-${uuidv4()}`;
      screenNameToId.set(screen.name, screenId);

      const screenNode: FlowScreen = {
        id: screenId,
        name: screen.name,
        description: screen.description,
        actions: [], // Will be populated after actions are created
        entryTransitions: [], // Will be populated from action nextScreen references
        version: '1.0.0',
        layer: Layer.Structure,
        created_at: now,
        updated_at: now
      };
      nodes.push(screenNode);
    }

    // Create FlowActions
    for (const action of layeredProject.structureLayer?.flowActions || []) {
      const actionId = `action-${uuidv4()}`;
      actionNameToId.set(action.name, actionId);

      // Resolve parent screen
      const parentScreenId = screenNameToId.get(action.parentScreenName) || '';

      // Resolve next screen if specified
      const nextScreenId = action.nextScreenName
        ? screenNameToId.get(action.nextScreenName) || undefined
        : undefined;

      const actionNode: FlowAction = {
        id: actionId,
        name: action.name,
        description: action.description,
        triggerType: this.convertTriggerType(action.triggerType),
        parentScreen: parentScreenId,
        nextScreen: nextScreenId,
        linkedCapabilities: [], // Will be resolved later
        version: '1.0.0',
        layer: Layer.Structure,
        created_at: now,
        updated_at: now
      };
      nodes.push(actionNode);

      // Add action to parent screen's actions array
      if (parentScreenId) {
        const screenNode = nodes.find(n => n.id === parentScreenId) as FlowScreen;
        if (screenNode) {
          screenNode.actions.push(actionId);
        }
      }

      // Add entry transition to next screen if specified
      if (nextScreenId) {
        const nextScreenNode = nodes.find(n => n.id === nextScreenId) as FlowScreen;
        if (nextScreenNode && !nextScreenNode.entryTransitions.includes(screenNameToId.get(action.parentScreenName) || '')) {
          nextScreenNode.entryTransitions.push(screenNameToId.get(action.parentScreenName) || '');
        }
      }
    }

    // SPECIFICATION LAYER: Create Technical Requirements
    for (const techReq of layeredProject.specificationLayer?.technicalRequirements || []) {
      const techReqId = `req-${uuidv4()}`;
      techReqNameToId.set(techReq.specification, techReqId);

      const techReqNode: TechnicalRequirement = {
        id: techReqId,
        type: this.convertTechReqType(techReq.type),
        specification: techReq.specification,
        linkedCapabilities: [], // Will be resolved later
        linkedTasks: [],
        version: '1.0.0',
        layer: Layer.Specification,
        created_at: now,
        updated_at: now
      };
      nodes.push(techReqNode);
    }

    // SPECIFICATION LAYER: Create Tasks
    for (const task of layeredProject.specificationLayer?.tasks || []) {
      const taskId = `task-${uuidv4()}`;

      const taskNode: Task = {
        id: taskId,
        parent_feature: '', // In layered architecture, tasks don't have parent features
        type: this.convertTaskType(task.type),
        description: task.description,
        version: '1.0.0',
        layer: Layer.Specification,
        dependencies: [],
        created_at: now,
        updated_at: now
      };
      nodes.push(taskNode);
    }

    // RESOLVE CROSS-LAYER REFERENCES

    // UserStory -> Capability links
    for (const story of layeredProject.narrativeLayer?.userStories || []) {
      const storyId = storyNameToId.get(story.narrative);
      if (!storyId) continue;

      const storyNode = nodes.find(n => n.id === storyId) as UserStory;
      if (!storyNode) continue;

      for (const capabilityName of story.linkedCapabilityNames || []) {
        const capabilityId = capabilityNameToId.get(capabilityName);
        if (capabilityId) {
          storyNode.linkedCapabilities.push(capabilityId);

          // Add back-reference
          const capabilityNode = nodes.find(n => n.id === capabilityId) as Capability;
          if (capabilityNode) {
            capabilityNode.linkedUserStories.push(storyId);
          }

          // Create cross-layer dependency
          crossLayerDeps.push({
            id: `cross-${uuidv4()}`,
            type: CrossLayerDependencyType.NarrativeToStructure,
            fromNodeId: storyId,
            toNodeId: capabilityId,
            fromLayer: Layer.Narrative,
            toLayer: Layer.Structure,
            rationale: `User Story "${story.narrative}" requires capability "${capabilityName}"`
          });
        }
      }
    }

    // Capability -> UserStory back-references (already handled above)
    for (const capability of layeredProject.structureLayer?.capabilities || []) {
      const capabilityId = capabilityNameToId.get(capability.name);
      if (!capabilityId) continue;

      const capabilityNode = nodes.find(n => n.id === capabilityId) as Capability;
      if (!capabilityNode) continue;

      for (const storyName of capability.linkedUserStoryNames || []) {
        const storyId = storyNameToId.get(storyName);
        if (storyId && !capabilityNode.linkedUserStories.includes(storyId)) {
          capabilityNode.linkedUserStories.push(storyId);
        }
      }
    }

    // FlowAction -> Capability links (many-to-many mapping)
    for (const action of layeredProject.structureLayer?.flowActions || []) {
      const actionId = actionNameToId.get(action.name);
      if (!actionId) continue;

      const actionNode = nodes.find(n => n.id === actionId) as FlowAction;
      if (!actionNode) continue;

      for (const capabilityName of action.linkedCapabilityNames || []) {
        const capabilityId = capabilityNameToId.get(capabilityName);
        if (capabilityId) {
          actionNode.linkedCapabilities.push(capabilityId);
        }
      }
    }

    // Process explicit FlowToCapabilityMappings
    const mappings: FlowToCapabilityMapping[] = [];
    for (const mapping of layeredProject.structureLayer?.mappings || []) {
      const actionId = actionNameToId.get(mapping.flowActionName);
      if (!actionId) continue;

      // Resolve capability names to IDs
      const capabilityIds: string[] = [];
      for (const capabilityName of mapping.capabilityNames || []) {
        const capabilityId = capabilityNameToId.get(capabilityName);
        if (capabilityId) {
          capabilityIds.push(capabilityId);
        }
      }

      // Only create mapping if we have valid IDs
      if (capabilityIds.length > 0) {
        const mappingId = `mapping-${uuidv4()}`;
        mappings.push({
          id: mappingId,
          flowActionId: actionId,
          capabilityIds: capabilityIds,
          rationale: mapping.rationale || `FlowAction "${mapping.flowActionName}" requires these capabilities`,
          version: '1.0.0',
          created_at: now,
          updated_at: now
        });
      }
    }

    // TechnicalRequirement -> Capability links
    for (const techReq of layeredProject.specificationLayer?.technicalRequirements || []) {
      const techReqId = techReqNameToId.get(techReq.specification);
      if (!techReqId) continue;

      const techReqNode = nodes.find(n => n.id === techReqId) as TechnicalRequirement;
      if (!techReqNode) continue;

      for (const capabilityName of techReq.linkedCapabilityNames || []) {
        const capabilityId = capabilityNameToId.get(capabilityName);
        if (capabilityId) {
          techReqNode.linkedCapabilities.push(capabilityId);

          // Add forward-reference in capability
          const capabilityNode = nodes.find(n => n.id === capabilityId) as Capability;
          if (capabilityNode) {
            capabilityNode.linkedTechnicalReqs.push(techReqId);
          }

          // Create cross-layer dependency
          crossLayerDeps.push({
            id: `cross-${uuidv4()}`,
            type: CrossLayerDependencyType.StructureToSpec,
            fromNodeId: capabilityId,
            toNodeId: techReqId,
            fromLayer: Layer.Structure,
            toLayer: Layer.Specification,
            rationale: `Capability "${capabilityName}" requires technical requirement "${techReq.specification}"`
          });
        }
      }
    }

    return { nodes, crossLayerDeps, mappings };
  }

  /**
   * Convert BAML NarrativeLayer to internal structure
   */
  private convertNarrativeLayer(narrativeLayer: any): {
    epics: Epic[];
    userStories: UserStory[];
  } {
    const epics: Epic[] = [];
    const userStories: UserStory[] = [];
    const now = new Date().toISOString();

    const epicNameToId = new Map<string, string>();

    // Create Epics
    for (const epic of narrativeLayer.epics || []) {
      const epicId = `epic-${uuidv4()}`;
      epicNameToId.set(epic.name, epicId);

      epics.push({
        id: epicId,
        name: epic.name,
        description: epic.description,
        userStories: [],
        version: '1.0.0',
        layer: Layer.Narrative,
        created_at: now,
        updated_at: now
      });
    }

    // Create User Stories
    for (const story of narrativeLayer.userStories || []) {
      const storyId = `story-${uuidv4()}`;
      const parentEpicId = epicNameToId.get(story.epicName) || '';

      userStories.push({
        id: storyId,
        narrative: story.narrative,
        acceptanceCriteria: story.acceptanceCriteria || [],
        linkedCapabilities: [],
        parentEpic: parentEpicId,
        version: '1.0.0',
        layer: Layer.Narrative,
        created_at: now,
        updated_at: now
      });

      // Add to epic
      if (parentEpicId) {
        const epic = epics.find(e => e.id === parentEpicId);
        if (epic) {
          epic.userStories.push(storyId);
        }
      }
    }

    return { epics, userStories };
  }

  /**
   * Convert BAML StructureLayer to internal structure
   */
  private convertStructureLayer(structureLayer: any): {
    capabilities: Capability[];
    flowScreens: FlowScreen[];
    flowActions: FlowAction[];
  } {
    const capabilities: Capability[] = [];
    const flowScreens: FlowScreen[] = [];
    const flowActions: FlowAction[] = [];
    const now = new Date().toISOString();

    // Maps for resolving names to IDs
    const screenNameToId = new Map<string, string>();

    // Create Capabilities (Feature Graph)
    for (const capability of structureLayer.capabilities || []) {
      capabilities.push({
        id: `cap-${uuidv4()}`,
        name: capability.name,
        description: capability.description,
        linkedUserStories: [],
        linkedTechnicalReqs: [],
        version: '1.0.0',
        layer: Layer.Structure,
        created_at: now,
        updated_at: now
      });
    }

    // Create FlowScreens (Flow Graph)
    for (const screen of structureLayer.flowScreens || []) {
      const screenId = `screen-${uuidv4()}`;
      screenNameToId.set(screen.name, screenId);
      flowScreens.push({
        id: screenId,
        name: screen.name,
        description: screen.description,
        actions: [], // Will be populated after actions are created
        entryTransitions: [],
        version: '1.0.0',
        layer: Layer.Structure,
        created_at: now,
        updated_at: now
      });
    }

    // Create FlowActions (Flow Graph)
    for (const action of structureLayer.flowActions || []) {
      const actionId = `action-${uuidv4()}`;
      const parentScreenId = screenNameToId.get(action.parentScreenName) || '';
      const nextScreenId = action.nextScreenName
        ? screenNameToId.get(action.nextScreenName) || undefined
        : undefined;

      flowActions.push({
        id: actionId,
        name: action.name,
        description: action.description,
        triggerType: this.convertTriggerType(action.triggerType),
        parentScreen: parentScreenId,
        nextScreen: nextScreenId,
        linkedCapabilities: [], // Will be resolved later
        version: '1.0.0',
        layer: Layer.Structure,
        created_at: now,
        updated_at: now
      });

      // Add action to parent screen
      if (parentScreenId) {
        const screen = flowScreens.find(s => s.id === parentScreenId);
        if (screen) {
          screen.actions.push(actionId);
        }
      }

      // Add entry transition to next screen
      if (nextScreenId) {
        const nextScreen = flowScreens.find(s => s.id === nextScreenId);
        if (nextScreen && parentScreenId && !nextScreen.entryTransitions.includes(parentScreenId)) {
          nextScreen.entryTransitions.push(parentScreenId);
        }
      }
    }

    return { capabilities, flowScreens, flowActions };
  }

  /**
   * Convert BAML FlowActionTriggerType to internal enum
   */
  private convertTriggerType(type: string): FlowActionTriggerType {
    const typeMap: Record<string, FlowActionTriggerType> = {
      'User': 'user',
      'System': 'system'
    };
    return typeMap[type] || 'user';
  }

  /**
   * Convert BAML SpecificationLayer to internal structure
   */
  private convertSpecificationLayer(specificationLayer: any): {
    technicalRequirements: TechnicalRequirement[];
    tasks: Task[];
  } {
    const technicalRequirements: TechnicalRequirement[] = [];
    const tasks: Task[] = [];
    const now = new Date().toISOString();

    for (const techReq of specificationLayer.technicalRequirements || []) {
      technicalRequirements.push({
        id: `req-${uuidv4()}`,
        type: this.convertTechReqType(techReq.type),
        specification: techReq.specification,
        linkedCapabilities: [],
        linkedTasks: [],
        version: '1.0.0',
        layer: Layer.Specification,
        created_at: now,
        updated_at: now
      });
    }

    for (const task of specificationLayer.tasks || []) {
      tasks.push({
        id: `task-${uuidv4()}`,
        parent_feature: '',
        type: this.convertTaskType(task.type),
        description: task.description,
        version: '1.0.0',
        layer: Layer.Specification,
        dependencies: [],
        created_at: now,
        updated_at: now
      });
    }

    return { technicalRequirements, tasks };
  }

  /**
   * Convert BAML TechnicalRequirementType to internal enum
   */
  private convertTechReqType(type: string): 'performance' | 'security' | 'scalability' | 'reliability' | 'other' {
    const typeMap: Record<string, 'performance' | 'security' | 'scalability' | 'reliability' | 'other'> = {
      'Performance': 'performance',
      'Security': 'security',
      'Scalability': 'scalability',
      'Reliability': 'reliability',
      'Other': 'other'
    };
    return typeMap[type] || 'other';
  }
}
