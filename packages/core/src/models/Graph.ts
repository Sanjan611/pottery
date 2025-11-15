import { ProductIntent } from './ProductIntent';
import { SubIntent } from './SubIntent';
import { Feature } from './Feature';
import { Task } from './Task';
import { UXSpec } from './UXSpec';
import { Dependency } from './Dependency';
import { Epic } from './Epic';
import { UserStory } from './UserStory';
import { Capability } from './Capability';
import { FlowScreen } from './FlowScreen';
import { FlowAction } from './FlowAction';
import { TechnicalRequirement } from './TechnicalRequirement';
import { FlowToCapabilityMapping } from './FlowToCapabilityMapping';
import { Layer } from './Layer';

export type GraphNode = ProductIntent | SubIntent | Feature | Task | UXSpec | Epic | UserStory | Capability | FlowScreen | FlowAction | TechnicalRequirement;

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

// Cross-layer dependency types
export enum CrossLayerDependencyType {
  NarrativeToStructure = "narrative_to_structure",
  StructureToSpec = "structure_to_spec",
  SpecToNarrative = "spec_to_narrative"
}

// Cross-layer dependency interface
export interface CrossLayerDependency {
  id: string;
  type: CrossLayerDependencyType;
  fromNodeId: string;
  toNodeId: string;
  fromLayer: Layer;
  toLayer: Layer;
  rationale: string;
}

// Layered graph structure for the new architecture
export interface LayeredGraph {
  version: string;  // "v0", "v1", etc.

  narrativeLayer: {
    nodes: Map<string, Epic | UserStory>;
    edges: Map<string, Dependency>;
  };

  structureLayer: {
    featureGraph: {
      nodes: Map<string, Capability>;
      edges: Map<string, Dependency>;
    };
    flowGraph: {
      nodes: Map<string, FlowScreen | FlowAction>;
      edges: Map<string, Dependency>;
    };
    mappings: Map<string, FlowToCapabilityMapping>;
  };

  specificationLayer: {
    nodes: Map<string, TechnicalRequirement | Task>;
    edges: Map<string, Dependency>;
  };

  crossLayerDependencies: Map<string, CrossLayerDependency>;

  metadata: GraphMetadata;
}

// Serializable version of layered graph for JSON storage
export interface SerializableLayeredGraph {
  version: string;

  narrativeLayer: {
    nodes: Record<string, Epic | UserStory>;
    edges: Record<string, Dependency>;
  };

  structureLayer: {
    featureGraph: {
      nodes: Record<string, Capability>;
      edges: Record<string, Dependency>;
    };
    flowGraph: {
      nodes: Record<string, FlowScreen | FlowAction>;
      edges: Record<string, Dependency>;
    };
    mappings: Record<string, FlowToCapabilityMapping>;
  };

  specificationLayer: {
    nodes: Record<string, TechnicalRequirement | Task>;
    edges: Record<string, Dependency>;
  };

  crossLayerDependencies: Record<string, CrossLayerDependency>;

  metadata: GraphMetadata;
}
