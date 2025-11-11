import fs from 'fs-extra';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { Graph, SerializableGraph, GraphNode } from '../models/Graph';
import { ChangeRequest, CRStatus } from '../models/ChangeRequest';
import { ProjectMetadata } from '../models/Project';
import { DAGValidator } from '../validation/dag';
import { VersionUtil } from '../validation/versioning';
import { DependencyType } from '../models/Dependency';

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

    const fullCR: ChangeRequest = {
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
    };

    // Save CR file
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
