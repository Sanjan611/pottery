import { ProductIntent } from './ProductIntent';
import { SubIntent } from './SubIntent';
import { Feature } from './Feature';
import { Task } from './Task';
import { UXSpec } from './UXSpec';
import { Dependency } from './Dependency';

export type GraphNode = ProductIntent | SubIntent | Feature | Task | UXSpec;

export interface GraphMetadata {
  created_at: string;
  last_modified: string;
}

export interface Graph {
  version: string;               // "v0", "v1", etc.
  nodes: Map<string, GraphNode>;
  edges: Map<string, Dependency>;
  metadata: GraphMetadata;
}

// Serializable version for JSON storage
export interface SerializableGraph {
  version: string;
  nodes: Record<string, GraphNode>;
  edges: Record<string, Dependency>;
  metadata: GraphMetadata;
}
