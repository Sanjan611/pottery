import { GraphNode } from './Graph';
import { Dependency } from './Dependency';
import { ImpactReport } from '../analysis/ImpactAnalyzer';
import { Layer } from './Layer';

export enum CRStatus {
  Pending = "pending",
  Applied = "applied"
}

export interface NodeModification {
  node_id: string;
  old_version: string;
  new_version: string;
  changes: Record<string, any>;  // Field-level changes
}

export interface ImpactMapEntry {
  node_id: string;
  node_type: string;
  impact_type: "aligned" | "impacts" | "conflicts";
  reason: string;
}

export interface NodeChange {
  node_id: string;
  node_type: string;
  action: "create" | "modify" | "delete";
  changes?: Record<string, any>;
}

export interface CrossLayerChanges {
  narrative: NodeChange[];
  structure: NodeChange[];
  specification: NodeChange[];
}

export interface ChangeRequest {
  id: string;                    // Format: "CR-XXX"
  project_id: string;
  initiator: "user" | "ai";
  description: string;
  status: CRStatus;
  new_nodes: GraphNode[];        // Nodes to create
  modified_nodes: NodeModification[];  // Nodes to update
  new_dependencies: Dependency[];
  impact_map: ImpactMapEntry[];
  created_at: string;
  applied_at?: string;
  // Phase 4 additions
  impactAnalysis?: ImpactReport;  // Full impact analysis across all layers
  crossLayerChanges?: CrossLayerChanges;  // Changes organized by layer
}
