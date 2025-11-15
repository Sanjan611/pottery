import fs from 'fs-extra';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { Graph, SerializableGraph, GraphNode, LayeredGraph, SerializableLayeredGraph } from '../models/Graph';
import { ChangeRequest, CRStatus } from '../models/ChangeRequest';
import { ProjectMetadata } from '../models/Project';
import { DAGValidator } from '../validation/dag';
import { VersionUtil } from '../validation/versioning';
import { DependencyType } from '../models/Dependency';
import { FlowToCapabilityMapping } from '../models/FlowToCapabilityMapping';

export class ProjectStore {
  private basePath: string;
  private projectId: string;

  constructor(projectId: string, customBasePath?: string) {
    this.projectId = projectId;
    const home = process.env.HOME || process.env.USERPROFILE || '~';
    const potteryHome = customBasePath || path.join(home, '.pottery');
    this.basePath = path.join(potteryHome, 'projects', projectId);
  }

  /**
   * Initialize project directory structure
   */
  async initialize(name?: string): Promise<void> {
    await fs.ensureDir(this.basePath);
    await fs.ensureDir(path.join(this.basePath, 'change-requests'));
    await fs.ensureDir(path.join(this.basePath, 'versions'));
    await fs.ensureDir(path.join(this.basePath, 'layers'));

    // Create initial metadata
    const metadata: ProjectMetadata = {
      project_id: this.projectId,
      name: name || '',
      created_at: new Date().toISOString(),
      last_modified: new Date().toISOString(),
      current_version: 'v0'
    };

    await this.saveMetadata(metadata);

    // Create empty graph
    const emptyGraph: Graph = {
      version: 'v0',
      nodes: new Map(),
      edges: new Map(),
      metadata: {
        created_at: new Date().toISOString(),
        last_modified: new Date().toISOString()
      }
    };

    await this.saveGraph(emptyGraph);
    await this.saveVersion('v0', emptyGraph);
  }

  /**
   * Check if project exists
   */
  async exists(): Promise<boolean> {
    return await fs.pathExists(this.basePath);
  }

  /**
   * Load project metadata
   */
  async loadMetadata(): Promise<ProjectMetadata> {
    const metadataPath = path.join(this.basePath, 'metadata.json');
    return await fs.readJSON(metadataPath);
  }

  /**
   * Save project metadata
   */
  async saveMetadata(metadata: ProjectMetadata): Promise<void> {
    const metadataPath = path.join(this.basePath, 'metadata.json');
    await fs.writeJSON(metadataPath, metadata, { spaces: 2 });
  }

  /**
   * Load current graph
   */
  async loadGraph(): Promise<Graph> {
    const graphPath = path.join(this.basePath, 'graph.json');
    const data: SerializableGraph = await fs.readJSON(graphPath);

    // Convert plain objects to Maps
    return {
      version: data.version,
      nodes: new Map(Object.entries(data.nodes)),
      edges: new Map(Object.entries(data.edges)),
      metadata: data.metadata
    };
  }

  /**
   * Save current graph
   */
  async saveGraph(graph: Graph): Promise<void> {
    const graphPath = path.join(this.basePath, 'graph.json');

    // Convert Maps to plain objects for JSON
    const data: SerializableGraph = {
      version: graph.version,
      nodes: Object.fromEntries(graph.nodes),
      edges: Object.fromEntries(graph.edges),
      metadata: graph.metadata
    };

    await fs.writeJSON(graphPath, data, { spaces: 2 });
  }

  /**
   * Save graph version snapshot
   */
  async saveVersion(version: string, graph: Graph): Promise<void> {
    const versionPath = path.join(
      this.basePath,
      'versions',
      `${version}.json`
    );

    const data: SerializableGraph = {
      version: graph.version,
      nodes: Object.fromEntries(graph.nodes),
      edges: Object.fromEntries(graph.edges),
      metadata: graph.metadata
    };

    await fs.writeJSON(versionPath, data, { spaces: 2 });
  }

  /**
   * Load a specific version of the graph
   */
  async loadVersion(version: string): Promise<Graph> {
    const versionPath = path.join(
      this.basePath,
      'versions',
      `${version}.json`
    );
    const data: SerializableGraph = await fs.readJSON(versionPath);

    return {
      version: data.version,
      nodes: new Map(Object.entries(data.nodes)),
      edges: new Map(Object.entries(data.edges)),
      metadata: data.metadata
    };
  }

  /**
   * Create a new ChangeRequest
   */
  async createChangeRequest(
    cr: Partial<ChangeRequest>
  ): Promise<ChangeRequest> {
    // Generate CR ID
    const crId = await this.getNextCRId();

    const fullCR: ChangeRequest & { _mappings?: any[] } = {
      id: crId,
      project_id: this.projectId,
      initiator: cr.initiator || 'user',
      description: cr.description || '',
      status: CRStatus.Pending,
      new_nodes: cr.new_nodes || [],
      modified_nodes: cr.modified_nodes || [],
      new_dependencies: cr.new_dependencies || [],
      impact_map: cr.impact_map || [],
      created_at: new Date().toISOString()
    } as ChangeRequest & { _mappings?: any[] };
    
    // Preserve _mappings if present (for Phase 3 mappings)
    if ((cr as any)._mappings) {
      (fullCR as any)._mappings = (cr as any)._mappings;
    }

    // Save CR file (this will include _mappings in the JSON)
    await this.saveChangeRequest(fullCR);

    return fullCR;
  }

  /**
   * Apply a ChangeRequest to the graph
   */
  async applyChangeRequest(crId: string): Promise<void> {
    const cr = await this.loadChangeRequest(crId);

    if (cr.status === CRStatus.Applied) {
      throw new Error(`CR ${crId} is already applied`);
    }

    // Check if this is a layered project
    const isLayered = await this.isLayered();

    if (isLayered) {
      await this.applyChangeRequestToLayeredGraph(crId, cr);
    } else {
      await this.applyChangeRequestToLegacyGraph(crId, cr);
    }
  }

  /**
   * Apply ChangeRequest to layered graph
   */
  private async applyChangeRequestToLayeredGraph(crId: string, cr: ChangeRequest): Promise<void> {
    const layeredGraph = await this.loadLayeredGraph();

    // Distribute new nodes to correct layers
    for (const node of cr.new_nodes) {
      if (node.id.startsWith('epic-') || node.id.startsWith('story-')) {
        layeredGraph.narrativeLayer.nodes.set(node.id, node as any);
      } else if (node.id.startsWith('cap-')) {
        layeredGraph.structureLayer.featureGraph.nodes.set(node.id, node as any);
      } else if (node.id.startsWith('screen-') || node.id.startsWith('action-')) {
        layeredGraph.structureLayer.flowGraph.nodes.set(node.id, node as any);
      } else if (node.id.startsWith('req-') || node.id.startsWith('task-')) {
        layeredGraph.specificationLayer.nodes.set(node.id, node as any);
      }
    }

    // Modify existing nodes
    for (const modification of cr.modified_nodes) {
      // Find node in any layer
      let node = layeredGraph.narrativeLayer.nodes.get(modification.node_id) ||
                 layeredGraph.structureLayer.featureGraph.nodes.get(modification.node_id) ||
                 layeredGraph.structureLayer.flowGraph.nodes.get(modification.node_id) ||
                 layeredGraph.specificationLayer.nodes.get(modification.node_id);
      
      if (!node) continue;

      // Create new version
      const newNode = {
        ...node,
        ...modification.changes,
        version: modification.new_version,
        updated_at: new Date().toISOString()
      };

      // Update in correct layer
      if (node.id.startsWith('epic-') || node.id.startsWith('story-')) {
        layeredGraph.narrativeLayer.nodes.set(node.id, newNode as any);
      } else if (node.id.startsWith('cap-')) {
        layeredGraph.structureLayer.featureGraph.nodes.set(node.id, newNode as any);
      } else if (node.id.startsWith('screen-') || node.id.startsWith('action-')) {
        layeredGraph.structureLayer.flowGraph.nodes.set(node.id, newNode as any);
      } else if (node.id.startsWith('req-') || node.id.startsWith('task-')) {
        layeredGraph.specificationLayer.nodes.set(node.id, newNode as any);
      }
    }

    // Distribute dependencies to correct layers
    for (const dep of cr.new_dependencies) {
      const fromNode = layeredGraph.narrativeLayer.nodes.get(dep.from_id) ||
                       layeredGraph.structureLayer.featureGraph.nodes.get(dep.from_id) ||
                       layeredGraph.structureLayer.flowGraph.nodes.get(dep.from_id) ||
                       layeredGraph.specificationLayer.nodes.get(dep.from_id);
      
      if (!fromNode) continue;

      // Determine which layer this dependency belongs to
      if (fromNode.id.startsWith('epic-') || fromNode.id.startsWith('story-')) {
        layeredGraph.narrativeLayer.edges.set(dep.id, dep);
      } else if (fromNode.id.startsWith('cap-')) {
        layeredGraph.structureLayer.featureGraph.edges.set(dep.id, dep);
      } else if (fromNode.id.startsWith('screen-') || fromNode.id.startsWith('action-')) {
        layeredGraph.structureLayer.flowGraph.edges.set(dep.id, dep);
      } else if (fromNode.id.startsWith('req-') || fromNode.id.startsWith('task-')) {
        layeredGraph.specificationLayer.edges.set(dep.id, dep);
      }
    }

    // Handle mappings if present (stored in _mappings field for initial CR)
    const crWithExtras = cr as any;
    if (crWithExtras._mappings && Array.isArray(crWithExtras._mappings)) {
      for (const mapping of crWithExtras._mappings) {
        layeredGraph.structureLayer.mappings.set(mapping.id, mapping);
      }
    }

    // Handle cross-layer dependencies if present (stored in _crossLayerDeps field for initial CR)
    if (crWithExtras._crossLayerDeps && Array.isArray(crWithExtras._crossLayerDeps)) {
      for (const crossDep of crWithExtras._crossLayerDeps) {
        layeredGraph.crossLayerDependencies.set(crossDep.id, crossDep);
      }
    }

    // Validate layered graph
    const validation = DAGValidator.validateLayeredGraph(layeredGraph);
    if (!validation.valid) {
      throw new Error(validation.error || 'Validation failed');
    }

    // Increment version
    const metadata = await this.loadMetadata();
    const nextVersion = VersionUtil.incrementVersion(metadata.current_version);

    layeredGraph.version = nextVersion;
    layeredGraph.metadata.last_modified = new Date().toISOString();

    // Save updated layered graph
    await this.saveLayeredGraph(layeredGraph);
    await this.saveLayeredVersion(nextVersion, layeredGraph);

    // Update metadata
    metadata.current_version = nextVersion;
    metadata.last_modified = new Date().toISOString();

    // If this is CR-000, extract project name from Epic
    if (crId === 'CR-000' && cr.new_nodes.length > 0) {
      const epic = cr.new_nodes.find(n => n.id.startsWith('epic-'));
      if (epic && 'name' in epic) {
        metadata.name = epic.name;
      }
    }

    await this.saveMetadata(metadata);

    // Mark CR as applied
    cr.status = CRStatus.Applied;
    cr.applied_at = new Date().toISOString();
    await this.saveChangeRequest(cr);
  }

  /**
   * Apply ChangeRequest to legacy graph
   */
  private async applyChangeRequestToLegacyGraph(crId: string, cr: ChangeRequest): Promise<void> {
    const graph = await this.loadGraph();

    // Add new nodes
    for (const node of cr.new_nodes) {
      graph.nodes.set(node.id, node);
    }

    // Modify existing nodes
    for (const modification of cr.modified_nodes) {
      const node = graph.nodes.get(modification.node_id);
      if (!node) continue;

      // Create new version
      const newNode = {
        ...node,
        ...modification.changes,
        version: modification.new_version,
        updated_at: new Date().toISOString()
      };

      graph.nodes.set(node.id, newNode);
    }

    // Add new dependencies
    for (const dep of cr.new_dependencies) {
      graph.edges.set(dep.id, dep);
    }

    // Validate DAG
    const cycle = DAGValidator.detectCycle(graph);
    if (cycle) {
      throw new Error(`Cycle detected: ${cycle.join(' -> ')}`);
    }

    // Increment version
    const metadata = await this.loadMetadata();
    const nextVersion = VersionUtil.incrementVersion(metadata.current_version);

    graph.version = nextVersion;
    graph.metadata.last_modified = new Date().toISOString();

    // Save updated graph
    await this.saveGraph(graph);
    await this.saveVersion(nextVersion, graph);

    // Update metadata
    metadata.current_version = nextVersion;
    metadata.last_modified = new Date().toISOString();

    // If this is CR-000, extract project name from ProductIntent
    if (crId === 'CR-000' && cr.new_nodes.length > 0) {
      const intent = cr.new_nodes.find(n => n.id.startsWith('intent-'));
      if (intent && 'name' in intent) {
        metadata.name = intent.name;
      }
    }

    await this.saveMetadata(metadata);

    // Mark CR as applied
    cr.status = CRStatus.Applied;
    cr.applied_at = new Date().toISOString();
    await this.saveChangeRequest(cr);
  }

  /**
   * Load a ChangeRequest
   */
  async loadChangeRequest(crId: string): Promise<ChangeRequest> {
    const crPath = path.join(
      this.basePath,
      'change-requests',
      `${crId}.json`
    );
    return await fs.readJSON(crPath);
  }

  /**
   * Save a ChangeRequest
   */
  async saveChangeRequest(cr: ChangeRequest): Promise<void> {
    const crPath = path.join(
      this.basePath,
      'change-requests',
      `${cr.id}.json`
    );
    await fs.writeJSON(crPath, cr, { spaces: 2 });
  }

  /**
   * List all ChangeRequests
   */
  async listChangeRequests(): Promise<ChangeRequest[]> {
    const crDir = path.join(this.basePath, 'change-requests');

    // Ensure directory exists
    if (!await fs.pathExists(crDir)) {
      return [];
    }

    const files = await fs.readdir(crDir);

    const crs = await Promise.all(
      files
        .filter(f => f.endsWith('.json'))
        .map(f => this.loadChangeRequest(path.basename(f, '.json')))
    );

    return crs.sort((a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }

  /**
   * Delete a pending ChangeRequest
   */
  async deleteChangeRequest(crId: string): Promise<void> {
    const cr = await this.loadChangeRequest(crId);

    if (cr.status === CRStatus.Applied) {
      throw new Error(`Cannot delete applied CR ${crId}`);
    }

    const crPath = path.join(
      this.basePath,
      'change-requests',
      `${crId}.json`
    );
    await fs.remove(crPath);
  }

  /**
   * Delete entire project
   */
  async delete(): Promise<void> {
    await fs.remove(this.basePath);
  }

  // ========================================
  // Layered Graph Methods (Phase 1)
  // ========================================

  /**
   * Load layered graph (multi-file structure)
   * Supports both Phase 1 (single structure.json) and Phase 2+ (structure-features.json + structure-flows.json)
   */
  async loadLayeredGraph(): Promise<LayeredGraph> {
    const narrativePath = path.join(this.basePath, 'layers', 'narrative.json');
    const structureFeaturesPath = path.join(this.basePath, 'layers', 'structure-features.json');
    const structureFlowsPath = path.join(this.basePath, 'layers', 'structure-flows.json');
    const structurePath = path.join(this.basePath, 'layers', 'structure.json'); // Phase 1 compatibility
    const specificationPath = path.join(this.basePath, 'layers', 'specification.json');
    const mappingsPath = path.join(this.basePath, 'layers', 'mappings.json');
    const crossLayerDepsPath = path.join(this.basePath, 'cross-layer-deps.json');
    const metadataPath = path.join(this.basePath, 'metadata.json');

    // Load all layer files
    const narrativeData = await fs.readJSON(narrativePath);
    const specificationData = await fs.readJSON(specificationPath);
    const crossLayerDepsData = await fs.readJSON(crossLayerDepsPath);
    const metadata = await fs.readJSON(metadataPath);
    
    // Load mappings (with backward compatibility)
    let mappingsData: Record<string, any> = {};
    if (await fs.pathExists(mappingsPath)) {
      mappingsData = await fs.readJSON(mappingsPath);
    }

    // Check if Phase 2 dual graph structure exists
    const hasDualGraphs = await fs.pathExists(structureFeaturesPath) && await fs.pathExists(structureFlowsPath);
    
    let structureFeatureData: { nodes: Record<string, any>; edges: Record<string, any> };
    let structureFlowData: { nodes: Record<string, any>; edges: Record<string, any> };

    if (hasDualGraphs) {
      // Phase 2: Load dual graphs
      structureFeatureData = await fs.readJSON(structureFeaturesPath);
      structureFlowData = await fs.readJSON(structureFlowsPath);
    } else {
      // Phase 1: Load single structure.json and split (backward compatibility)
      const structureData = await fs.readJSON(structurePath);
      // Migrate: split capabilities into feature graph, create empty flow graph
      structureFeatureData = {
        nodes: structureData.nodes || {},
        edges: structureData.edges || {}
      };
      structureFlowData = {
        nodes: {},
        edges: {}
      };
    }

    // Convert to layered graph structure
    return {
      version: metadata.current_version,
      narrativeLayer: {
        nodes: new Map(Object.entries(narrativeData.nodes || {})),
        edges: new Map(Object.entries(narrativeData.edges || {}))
      },
      structureLayer: {
        featureGraph: {
          nodes: new Map(Object.entries(structureFeatureData.nodes || {})),
          edges: new Map(Object.entries(structureFeatureData.edges || {}))
        },
        flowGraph: {
          nodes: new Map(Object.entries(structureFlowData.nodes || {})),
          edges: new Map(Object.entries(structureFlowData.edges || {}))
        },
        mappings: new Map(Object.entries(mappingsData || {}))
      },
      specificationLayer: {
        nodes: new Map(Object.entries(specificationData.nodes || {})),
        edges: new Map(Object.entries(specificationData.edges || {}))
      },
      crossLayerDependencies: new Map(Object.entries(crossLayerDepsData || {})),
      metadata: {
        created_at: metadata.created_at,
        last_modified: metadata.last_modified
      }
    };
  }

  /**
   * Save layered graph (multi-file structure)
   * All layers are saved atomically
   * Phase 2: Uses structure-features.json and structure-flows.json
   */
  async saveLayeredGraph(graph: LayeredGraph): Promise<void> {
    const narrativePath = path.join(this.basePath, 'layers', 'narrative.json');
    const structureFeaturesPath = path.join(this.basePath, 'layers', 'structure-features.json');
    const structureFlowsPath = path.join(this.basePath, 'layers', 'structure-flows.json');
    const specificationPath = path.join(this.basePath, 'layers', 'specification.json');
    const mappingsPath = path.join(this.basePath, 'layers', 'mappings.json');
    const crossLayerDepsPath = path.join(this.basePath, 'cross-layer-deps.json');

    // Ensure layers directory exists
    await fs.ensureDir(path.join(this.basePath, 'layers'));

    // Convert Maps to plain objects for JSON storage
    const narrativeData = {
      nodes: Object.fromEntries(graph.narrativeLayer.nodes),
      edges: Object.fromEntries(graph.narrativeLayer.edges)
    };

    const structureFeatureData = {
      nodes: Object.fromEntries(graph.structureLayer.featureGraph.nodes),
      edges: Object.fromEntries(graph.structureLayer.featureGraph.edges)
    };

    const structureFlowData = {
      nodes: Object.fromEntries(graph.structureLayer.flowGraph.nodes),
      edges: Object.fromEntries(graph.structureLayer.flowGraph.edges)
    };

    const specificationData = {
      nodes: Object.fromEntries(graph.specificationLayer.nodes),
      edges: Object.fromEntries(graph.specificationLayer.edges)
    };

    const mappingsData = Object.fromEntries(graph.structureLayer.mappings);

    const crossLayerDepsData = Object.fromEntries(graph.crossLayerDependencies);

    // Save all files atomically
    await Promise.all([
      fs.writeJSON(narrativePath, narrativeData, { spaces: 2 }),
      fs.writeJSON(structureFeaturesPath, structureFeatureData, { spaces: 2 }),
      fs.writeJSON(structureFlowsPath, structureFlowData, { spaces: 2 }),
      fs.writeJSON(specificationPath, specificationData, { spaces: 2 }),
      fs.writeJSON(mappingsPath, mappingsData, { spaces: 2 }),
      fs.writeJSON(crossLayerDepsPath, crossLayerDepsData, { spaces: 2 })
    ]);

    // Remove old structure.json if it exists (migration from Phase 1)
    const oldStructurePath = path.join(this.basePath, 'layers', 'structure.json');
    if (await fs.pathExists(oldStructurePath)) {
      await fs.remove(oldStructurePath);
    }
  }

  /**
   * Save layered graph version snapshot
   * Phase 2: Uses structure-features.json and structure-flows.json
   */
  async saveLayeredVersion(version: string, graph: LayeredGraph): Promise<void> {
    const versionDir = path.join(this.basePath, 'versions', version);
    await fs.ensureDir(versionDir);

    const narrativePath = path.join(versionDir, 'narrative.json');
    const structureFeaturesPath = path.join(versionDir, 'structure-features.json');
    const structureFlowsPath = path.join(versionDir, 'structure-flows.json');
    const specificationPath = path.join(versionDir, 'specification.json');
    const mappingsPath = path.join(versionDir, 'mappings.json');
    const crossLayerDepsPath = path.join(versionDir, 'cross-layer-deps.json');

    // Convert Maps to plain objects
    const narrativeData = {
      nodes: Object.fromEntries(graph.narrativeLayer.nodes),
      edges: Object.fromEntries(graph.narrativeLayer.edges)
    };

    const structureFeatureData = {
      nodes: Object.fromEntries(graph.structureLayer.featureGraph.nodes),
      edges: Object.fromEntries(graph.structureLayer.featureGraph.edges)
    };

    const structureFlowData = {
      nodes: Object.fromEntries(graph.structureLayer.flowGraph.nodes),
      edges: Object.fromEntries(graph.structureLayer.flowGraph.edges)
    };

    const specificationData = {
      nodes: Object.fromEntries(graph.specificationLayer.nodes),
      edges: Object.fromEntries(graph.specificationLayer.edges)
    };

    const mappingsData = Object.fromEntries(graph.structureLayer.mappings);

    const crossLayerDepsData = Object.fromEntries(graph.crossLayerDependencies);

    // Save all version files
    await Promise.all([
      fs.writeJSON(narrativePath, narrativeData, { spaces: 2 }),
      fs.writeJSON(structureFeaturesPath, structureFeatureData, { spaces: 2 }),
      fs.writeJSON(structureFlowsPath, structureFlowData, { spaces: 2 }),
      fs.writeJSON(specificationPath, specificationData, { spaces: 2 }),
      fs.writeJSON(mappingsPath, mappingsData, { spaces: 2 }),
      fs.writeJSON(crossLayerDepsPath, crossLayerDepsData, { spaces: 2 })
    ]);
  }

  /**
   * Load a specific version of the layered graph
   * Supports both Phase 1 and Phase 2 structures
   */
  async loadLayeredVersion(version: string): Promise<LayeredGraph> {
    const versionDir = path.join(this.basePath, 'versions', version);

    const narrativePath = path.join(versionDir, 'narrative.json');
    const structureFeaturesPath = path.join(versionDir, 'structure-features.json');
    const structureFlowsPath = path.join(versionDir, 'structure-flows.json');
    const structurePath = path.join(versionDir, 'structure.json'); // Phase 1 compatibility
    const specificationPath = path.join(versionDir, 'specification.json');
    const mappingsPath = path.join(versionDir, 'mappings.json');
    const crossLayerDepsPath = path.join(versionDir, 'cross-layer-deps.json');

    // Load all layer files
    const narrativeData = await fs.readJSON(narrativePath);
    const specificationData = await fs.readJSON(specificationPath);
    const crossLayerDepsData = await fs.readJSON(crossLayerDepsPath);
    
    // Load mappings (with backward compatibility)
    let mappingsData: Record<string, any> = {};
    if (await fs.pathExists(mappingsPath)) {
      mappingsData = await fs.readJSON(mappingsPath);
    }

    // Check if Phase 2 dual graph structure exists
    const hasDualGraphs = await fs.pathExists(structureFeaturesPath) && await fs.pathExists(structureFlowsPath);
    
    let structureFeatureData: { nodes: Record<string, any>; edges: Record<string, any> };
    let structureFlowData: { nodes: Record<string, any>; edges: Record<string, any> };

    if (hasDualGraphs) {
      // Phase 2: Load dual graphs
      structureFeatureData = await fs.readJSON(structureFeaturesPath);
      structureFlowData = await fs.readJSON(structureFlowsPath);
    } else {
      // Phase 1: Load single structure.json and split
      const structureData = await fs.readJSON(structurePath);
      structureFeatureData = {
        nodes: structureData.nodes || {},
        edges: structureData.edges || {}
      };
      structureFlowData = {
        nodes: {},
        edges: {}
      };
    }

    // Convert to layered graph structure
    return {
      version: version,
      narrativeLayer: {
        nodes: new Map(Object.entries(narrativeData.nodes || {})),
        edges: new Map(Object.entries(narrativeData.edges || {}))
      },
      structureLayer: {
        featureGraph: {
          nodes: new Map(Object.entries(structureFeatureData.nodes || {})),
          edges: new Map(Object.entries(structureFeatureData.edges || {}))
        },
        flowGraph: {
          nodes: new Map(Object.entries(structureFlowData.nodes || {})),
          edges: new Map(Object.entries(structureFlowData.edges || {}))
        },
        mappings: new Map(Object.entries(mappingsData || {}))
      },
      specificationLayer: {
        nodes: new Map(Object.entries(specificationData.nodes || {})),
        edges: new Map(Object.entries(specificationData.edges || {}))
      },
      crossLayerDependencies: new Map(Object.entries(crossLayerDepsData || {})),
      metadata: {
        created_at: '',
        last_modified: ''
      }
    };
  }

  /**
   * Initialize project with layered graph structure
   */
  async initializeLayered(name?: string): Promise<void> {
    await fs.ensureDir(this.basePath);
    await fs.ensureDir(path.join(this.basePath, 'change-requests'));
    await fs.ensureDir(path.join(this.basePath, 'versions'));
    await fs.ensureDir(path.join(this.basePath, 'layers'));

    // Create initial metadata
    const metadata: ProjectMetadata = {
      project_id: this.projectId,
      name: name || '',
      created_at: new Date().toISOString(),
      last_modified: new Date().toISOString(),
      current_version: 'v0'
    };

    await this.saveMetadata(metadata);

    // Create empty layered graph (Phase 2: dual graphs)
    const emptyLayeredGraph: LayeredGraph = {
      version: 'v0',
      narrativeLayer: {
        nodes: new Map(),
        edges: new Map()
      },
      structureLayer: {
        featureGraph: {
          nodes: new Map(),
          edges: new Map()
        },
        flowGraph: {
          nodes: new Map(),
          edges: new Map()
        },
        mappings: new Map()
      },
      specificationLayer: {
        nodes: new Map(),
        edges: new Map()
      },
      crossLayerDependencies: new Map(),
      metadata: {
        created_at: new Date().toISOString(),
        last_modified: new Date().toISOString()
      }
    };

    await this.saveLayeredGraph(emptyLayeredGraph);
    await this.saveLayeredVersion('v0', emptyLayeredGraph);
  }

  /**
   * Check if project uses layered graph structure
   */
  async isLayered(): Promise<boolean> {
    const narrativePath = path.join(this.basePath, 'layers', 'narrative.json');
    return await fs.pathExists(narrativePath);
  }

  // Helper methods

  private async getNextCRId(): Promise<string> {
    const crs = await this.listChangeRequests();
    if (crs.length === 0) return 'CR-000';

    const lastId = Math.max(...crs.map(cr =>
      parseInt(cr.id.replace('CR-', ''), 10)
    ));

    return `CR-${String(lastId + 1).padStart(3, '0')}`;
  }
}
