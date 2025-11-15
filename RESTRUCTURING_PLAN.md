# Pottery Multi-Layer Restructuring Plan

## Overview

This plan restructures Pottery from a single unified DAG to a multi-layer representation with dual graphs, enabling cross-layer dependency analysis from user narrative through to implementation specifications.

**Implementation Strategy**: Incremental/Phased (Clean Break)

---

## Phase 1: Three-Layer Foundation (Narrative → Structure → Specification)

**Goal**: Introduce layer concept and separate concerns

### 1.1 Create New Layer-Aware Models

**Location**: `packages/core/src/models/`

**New Files to Create**:
- `Layer.ts` - Enum defining three layers
- `Epic.ts` - Narrative layer root node
- `UserStory.ts` - Narrative layer story node
- `Capability.ts` - Structure layer capability node (replaces Feature)
- `TechnicalRequirement.ts` - Specification layer requirement node

**Files to Modify**:
- `Task.ts` - Add layer field, update to specification layer
- `Graph.ts` - Complete restructure for layered graphs

**New Type Definitions**:

```typescript
enum Layer {
  Narrative = "narrative",
  Structure = "structure",
  Specification = "specification"
}

interface Epic {
  id: string;                    // "epic-xyz"
  name: string;
  description: string;
  userStories: string[];         // UserStory IDs
  version: string;
  layer: Layer.Narrative;
  created_at: string;
  updated_at: string;
}

interface UserStory {
  id: string;                    // "story-xyz"
  narrative: string;             // "As a [user], I want [goal], so that [benefit]"
  acceptanceCriteria: string[];
  linkedCapabilities: string[];  // Capability IDs in structure layer
  parentEpic: string;            // Epic ID
  version: string;
  layer: Layer.Narrative;
  created_at: string;
  updated_at: string;
}

interface Capability {
  id: string;                    // "cap-xyz"
  name: string;
  description: string;           // What the system does
  linkedUserStories: string[];   // Back-reference to narrative layer
  linkedTechnicalReqs: string[]; // Forward-reference to spec layer
  version: string;
  layer: Layer.Structure;
  created_at: string;
  updated_at: string;
}

interface TechnicalRequirement {
  id: string;                    // "req-xyz"
  type: "performance" | "security" | "scalability" | "reliability" | "other";
  specification: string;
  linkedCapabilities: string[];  // Which capabilities this supports
  linkedTasks: string[];         // Implementation tasks
  version: string;
  layer: Layer.Specification;
  created_at: string;
  updated_at: string;
}
```

### 1.2 Restructure Graph Model

**File**: `packages/core/src/models/Graph.ts`

```typescript
interface LayeredGraph {
  version: string;  // "v0", "v1", etc.

  narrativeLayer: {
    nodes: Map<string, Epic | UserStory>;
    edges: Map<string, Dependency>;
  };

  structureLayer: {
    // Will be split into dual graphs in Phase 2
    nodes: Map<string, Capability>;
    edges: Map<string, Dependency>;
  };

  specificationLayer: {
    nodes: Map<string, TechnicalRequirement | Task>;
    edges: Map<string, Dependency>;
  };

  crossLayerDependencies: Map<string, CrossLayerDependency>;

  metadata: GraphMetadata;
}

interface CrossLayerDependency {
  id: string;
  type: CrossLayerDependencyType;
  fromNodeId: string;
  toNodeId: string;
  fromLayer: Layer;
  toLayer: Layer;
  rationale: string;
}

enum CrossLayerDependencyType {
  NarrativeToStructure = "narrative_to_structure",
  StructureToSpec = "structure_to_spec",
  SpecToNarrative = "spec_to_narrative"
}
```

### 1.3 Update Storage Layer

**File**: `packages/core/src/storage/ProjectStore.ts`

**Changes**:
- Replace single `graph.json` with layer-specific files:
  - `layers/narrative.json`
  - `layers/structure.json`
  - `layers/specification.json`
  - `cross-layer-deps.json`

- Update `saveGraph()` to save all layers atomically
- Update `loadGraph()` to load and merge all layers
- Update versioning to snapshot all layers together

**New File Structure**:
```
~/.pottery/
└── projects/
    └── proj_xyz/
        ├── metadata.json
        ├── layers/
        │   ├── narrative.json
        │   ├── structure.json
        │   └── specification.json
        ├── cross-layer-deps.json
        ├── change-requests/
        │   ├── CR-000.json
        │   └── CR-001.json
        └── versions/
            ├── v0/
            │   ├── narrative.json
            │   ├── structure.json
            │   ├── specification.json
            │   └── cross-layer-deps.json
            └── v1/
                └── ...
```

### 1.4 Update Validation Layer

**File**: `packages/core/src/validation/dag.ts`

**Changes**:
- Create `validateLayeredGraph()` function
- Validate each layer independently (each must be a DAG)
- Validate cross-layer dependencies don't create cycles
- Add layer-specific validation rules

### 1.5 Update BAML Types and Prompts

**File**: `packages/ai/baml_src/types/entities.baml`

**Changes**:
- Add layer-aware entity definitions
- Create separate classes for each layer

**New Files**:
- `packages/ai/baml_src/prompts/create_narrative.baml`
- `packages/ai/baml_src/prompts/create_structure.baml`
- `packages/ai/baml_src/prompts/create_specification.baml`

**New Prompt Structure**:
```baml
function CreateNarrativeLayer {
  input {
    intent string
  }
  output NarrativeLayer
}

class NarrativeLayer {
  epics Epic[]
  userStories UserStory[]
}

class Epic {
  name string
  description string
  userStoryNames string[] // Will be resolved to IDs
}

class UserStory {
  narrative string
  acceptanceCriteria string[]
  epicName string // Will be resolved to Epic ID
  linkedCapabilityNames string[] // Will be resolved in structure layer
}
```

### 1.6 Update Planner

**File**: `packages/ai/src/planner.ts`

**Changes**:
- Replace `createProject()` with layer-specific methods:
  - `createNarrativeLayer()`
  - `createStructureLayer()`
  - `createSpecificationLayer()`
- Add orchestration method that calls all three in sequence
- Update conversion logic to handle cross-layer references

### 1.7 Update CLI Commands

**Files to Modify**:
- `packages/cli/src/commands/create.ts` - Use new layered creation
- `packages/cli/src/commands/show.ts` - Add `--layer` filter option

**New CLI Usage**:
```bash
# Create project (generates all three layers)
pottery create --intent "Build a collaborative task manager"

# View specific layer
pottery show --project-id proj_xyz --layer narrative
pottery show --project-id proj_xyz --layer structure
pottery show --project-id proj_xyz --layer specification

# View all layers
pottery show --project-id proj_xyz
```

### 1.8 Update Web Visualization

**Files to Modify**:
- `packages/web/src/components/graph/GraphView.tsx` - Add layer selector
- Create new node components for each layer

**New Components to Create**:
- `components/graph/LayerSelector.tsx`
- `components/graph/nodes/EpicNode.tsx`
- `components/graph/nodes/UserStoryNode.tsx`
- `components/graph/nodes/CapabilityNode.tsx`
- `components/graph/nodes/TechnicalRequirementNode.tsx`

**Phase 1 Deliverable**: Projects have three distinct layers, CLI can show layer-filtered views

---

## Phase 2: Dual Graph Architecture (Feature Graph + Flow Graph)

**Goal**: Split Structure Layer into two interconnected graphs

### 2.1 Define Flow Node Models

**New Files**:
- `packages/core/src/models/FlowScreen.ts`
- `packages/core/src/models/FlowAction.ts`

**Type Definitions**:

```typescript
interface FlowScreen {
  id: string;                    // "screen-cart-review"
  name: string;                  // "Cart Review"
  description: string;
  actions: string[];             // FlowAction IDs
  entryTransitions: string[];    // Screens that can navigate here
  layer: Layer.Structure;
  version: string;
  created_at: string;
  updated_at: string;
}

interface FlowAction {
  id: string;                    // "action-update-quantity"
  name: string;                  // "Update Item Quantity"
  description: string;
  triggerType: "user" | "system"; // User-initiated or automatic
  parentScreen: string;          // FlowScreen ID
  nextScreen?: string;           // Optional transition to another screen
  linkedCapabilities: string[];  // Many-to-many mapping to capabilities
  version: string;
  layer: Layer.Structure;
  created_at: string;
  updated_at: string;
}
```

**Documentation to Create**:
- `docs/FLOW_MODELING.md` - Comprehensive guide on flow modeling
  - When to create a new screen vs reuse existing
  - When to model as user action vs system action
  - Examples from common app types (e-commerce, social, productivity)
  - Best practices for granularity

### 2.2 Split Structure Layer into Dual Graphs

**File**: `packages/core/src/models/Graph.ts`

**Updated Structure**:
```typescript
interface LayeredGraph {
  version: string;

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
  };

  specificationLayer: {
    nodes: Map<string, TechnicalRequirement | Task>;
    edges: Map<string, Dependency>;
  };

  crossLayerDependencies: Map<string, CrossLayerDependency>;
  metadata: GraphMetadata;
}
```

### 2.3 Update Storage for Dual Graphs

**File**: `packages/core/src/storage/ProjectStore.ts`

**Changes**:
- Split `layers/structure.json` into:
  - `layers/structure-features.json`
  - `layers/structure-flows.json`

### 2.4 Update Validation

**File**: `packages/core/src/validation/dag.ts`

**Changes**:
- Validate both feature graph and flow graph as independent DAGs
- Ensure flow screen transitions don't create cycles
- Validate that flow actions reference valid screens

### 2.5 Update BAML for Dual Graph Generation

**File**: `packages/ai/baml_src/prompts/create_structure.baml`

**Updated Prompt**:
```baml
function CreateStructureLayer {
  input {
    narrativeLayer NarrativeLayer
  }
  output StructureLayer
}

class StructureLayer {
  capabilities Capability[]
  flowScreens FlowScreen[]
  flowActions FlowAction[]
}

class FlowScreen {
  name string
  description string
  actionNames string[] // Will be resolved to FlowAction IDs
}

class FlowAction {
  name string
  description string
  triggerType "user" | "system"
  parentScreenName string // Will be resolved to FlowScreen ID
  nextScreenName string? // Optional transition
  linkedCapabilityNames string[] // For many-to-many mapping
}
```

**Prompt Engineering**:
- Instruct AI to think about user journeys
- Generate screens for major UI states
- Generate actions for each interaction point
- Automatically infer which capabilities each action needs

### 2.6 Update Web Visualization for Dual Graphs

**New Components**:
- `components/graph/GraphSelector.tsx` - Toggle between Feature/Flow view
- `components/graph/nodes/FlowScreenNode.tsx`
- `components/graph/nodes/FlowActionNode.tsx`

**File**: `packages/web/src/components/graph/GraphView.tsx`

**Changes**:
- Add graph type selector (Feature / Flow / Both)
- Different layouts for each graph:
  - Feature graph: Traditional hierarchical DAG
  - Flow graph: User journey flow (left-to-right)
- Color coding: Features (green), Screens (blue), Actions (purple)

### 2.7 Update CLI

**New Commands**:
```bash
pottery show --project-id proj_xyz --graph feature
pottery show --project-id proj_xyz --graph flow
pottery show --project-id proj_xyz --layer structure --graph feature
```

**Phase 2 Deliverable**: Structure layer has dual graphs showing capabilities and user journeys separately

---

## Phase 3: Many-to-Many Mappings

**Goal**: Enable cross-graph dependency analysis

### 3.1 Create Mapping Model

**New File**: `packages/core/src/models/FlowToCapabilityMapping.ts`

```typescript
interface FlowToCapabilityMapping {
  id: string;                    // "mapping-xyz"
  flowActionId: string;          // Which flow action
  capabilityIds: string[];       // Which capabilities it requires
  rationale: string;             // Why this mapping exists
  version: string;
  created_at: string;
  updated_at: string;
}
```

### 3.2 Add Mappings to Graph Structure

**File**: `packages/core/src/models/Graph.ts`

```typescript
interface LayeredGraph {
  // ... existing layers ...

  structureLayer: {
    featureGraph: { ... };
    flowGraph: { ... };
    mappings: Map<string, FlowToCapabilityMapping>;  // NEW
  };

  // ... rest ...
}
```

### 3.3 Update Storage

**File**: `packages/core/src/storage/ProjectStore.ts`

**New File**: `layers/mappings.json`

### 3.4 AI-Powered Mapping Generation

**File**: `packages/ai/baml_src/prompts/create_structure.baml`

**Updated Output**:
```baml
class StructureLayer {
  capabilities Capability[]
  flowScreens FlowScreen[]
  flowActions FlowAction[]
  mappings FlowToCapabilityMapping[]  // NEW
}

class FlowToCapabilityMapping {
  flowActionName string
  capabilityNames string[]
  rationale string
}
```

**Prompt Addition**:
- "For each flow action, identify which capabilities from the feature graph it requires"
- "Explain the rationale for each mapping"

### 3.5 Validation for Mappings

**File**: `packages/core/src/validation/mappings.ts` (NEW)

**Validation Rules**:
- All referenced flow action IDs exist in flow graph
- All referenced capability IDs exist in feature graph
- No orphaned mappings after deletions
- Warn if flow action has zero mappings

### 3.6 CLI Commands for Mappings

**New File**: `packages/cli/src/commands/mappings.ts`

**Commands**:
```bash
# List all mappings
pottery mappings list --project-id proj_xyz

# Show what capabilities a flow action requires
pottery mappings analyze --flow-action-id action-xyz

# Show which flow actions use a capability
pottery mappings analyze --capability-id cap-xyz

# Show all mappings for a specific screen
pottery mappings analyze --screen-id screen-xyz
```

### 3.7 Mapping Visualization

**New Component**: `components/graph/MappingView.tsx`

**Features**:
- Bipartite graph layout: Flow actions on left, Capabilities on right
- Lines connecting them with hover tooltips showing rationale
- Interactive filtering
- Highlight all related nodes when selecting one

**New Tab**: Add "Mappings" tab to web UI alongside graph view

**Phase 3 Deliverable**: Explicit many-to-many relationships between flows and capabilities

---

## Phase 4: Cross-Layer Dependency Analysis

**Goal**: Full impact analysis across all three layers

### 4.1 Implement Cross-Layer Dependency Tracking

**File**: `packages/core/src/models/Graph.ts` (already defined in Phase 1)

**Dependency Types**:
- `NarrativeToStructure`: UserStory → Capability
- `StructureToSpec`: Capability → TechnicalRequirement
- `SpecToNarrative`: Task → Capability → UserStory (for traceability)

### 4.2 Build Impact Analysis Engine

**New File**: `packages/core/src/analysis/ImpactAnalyzer.ts`

**Key Functions**:
```typescript
class ImpactAnalyzer {
  // Find all nodes affected by changing a given node
  analyzeImpact(nodeId: string, graph: LayeredGraph): ImpactReport;

  // Find downstream dependencies (what depends on this)
  getDownstreamImpact(nodeId: string): string[];

  // Find upstream dependencies (what this depends on)
  getUpstreamImpact(nodeId: string): string[];

  // Get cross-layer impact
  getCrossLayerImpact(nodeId: string): Map<Layer, string[]>;

  // Trace from narrative to implementation
  traceNarrativeToImplementation(epicId: string): TraceReport;

  // Trace from implementation back to narrative
  traceImplementationToNarrative(taskId: string): TraceReport;
}

interface ImpactReport {
  targetNode: string;
  affectedNodes: Map<Layer, string[]>;
  impactedFlows: string[];      // Which user flows are affected
  impactedCapabilities: string[]; // Which capabilities are affected
  impactedTasks: string[];       // Which tasks need updating
}

interface TraceReport {
  epicId?: string;
  userStories: string[];
  capabilities: string[];
  flowActions: string[];
  requirements: string[];
  tasks: string[];
  path: string[]; // Full dependency path
}
```

**Algorithm**:
1. Build combined dependency graph across all layers
2. Use BFS/DFS to traverse dependencies
3. Track which layers are crossed
4. Return structured impact report

### 4.3 Enhance ChangeRequest System

**File**: `packages/core/src/models/ChangeRequest.ts`

**Add Impact Analysis**:
```typescript
interface ChangeRequest {
  // ... existing fields ...

  impactAnalysis?: ImpactReport;  // NEW
  crossLayerChanges?: {           // NEW
    narrative: NodeChange[];
    structure: NodeChange[];
    specification: NodeChange[];
  };
}
```

**File**: `packages/ai/baml_src/prompts/analyze_change.baml`

**Enhanced Prompt**:
- Include current graph from ALL layers
- Ask AI to analyze impact across layers
- Generate changes for affected nodes in all layers

### 4.4 CLI Impact Analysis Commands

**New Commands**:
```bash
# Analyze impact of changing a node
pottery analyze impact --node-id epic-xyz

# Trace from narrative to implementation
pottery trace --from epic-xyz

# Trace from implementation to narrative
pottery trace --from task-xyz --reverse

# Show cross-layer dependencies for a node
pottery analyze dependencies --node-id cap-xyz
```

### 4.5 Advanced Visualization

**New Component**: `components/graph/ImpactView.tsx`

**Features**:
- "Layer Cake" view: Stack all three layers vertically
- Show cross-layer dependencies as vertical edges
- Click any node to highlight impact across all layers
- Animated propagation showing dependency flow

**New Component**: `components/graph/TraceView.tsx`

**Features**:
- Linear path visualization from Epic → Story → Capability → Requirement → Task
- Show how user intent maps to implementation
- Highlight gaps (e.g., capability with no tasks)

**Dependency Heat Map**:
- Color code nodes by number of dependencies
- Show which nodes are "hot spots" (highly connected)
- Identify bottleneck nodes

### 4.6 Update ChangeRequest Workflow

**File**: `packages/cli/src/commands/change.ts`

**Enhanced Output**:
```bash
pottery change --project-id proj_xyz "Add offline mode"

# Output shows:
# 🤖 AI analyzing impact across all layers...
#
# Impact Analysis:
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 📖 Narrative Layer:
#   • Epic: Core Experience → Modified
#   • UserStory: Use app without internet → Created
#
# 🔗 Structure Layer:
#   Feature Graph:
#     • Capability: Data Synchronization → Modified
#     • Capability: Local Storage → Created
#   Flow Graph:
#     • Screen: Settings → Modified (add offline toggle)
#     • Action: Sync Data → Created
#
# ⚙️ Specification Layer:
#   • TechnicalRequirement: IndexedDB storage → Created
#   • Task: Implement sync queue → Created
#   • Task: Add offline indicator → Created
#
# 🔀 Cross-Layer Dependencies:
#   • Story "Use app without internet" → Capability "Local Storage"
#   • Capability "Local Storage" → Requirement "IndexedDB storage"
#   • Flow Action "Sync Data" → Capability "Data Synchronization"
#
# Total Impact: 3 layers, 9 nodes, 4 cross-layer deps
```

**Phase 4 Deliverable**: Complete dependency tracking from user narrative → implementation specs

---

## Implementation File Changes Summary

### New Files to Create

**Core Package**:
- `packages/core/src/models/Layer.ts`
- `packages/core/src/models/Epic.ts`
- `packages/core/src/models/UserStory.ts`
- `packages/core/src/models/Capability.ts`
- `packages/core/src/models/TechnicalRequirement.ts`
- `packages/core/src/models/FlowScreen.ts`
- `packages/core/src/models/FlowAction.ts`
- `packages/core/src/models/FlowToCapabilityMapping.ts`
- `packages/core/src/analysis/ImpactAnalyzer.ts`
- `packages/core/src/validation/mappings.ts`

**AI Package**:
- `packages/ai/baml_src/prompts/create_narrative.baml`
- `packages/ai/baml_src/prompts/create_structure.baml`
- `packages/ai/baml_src/prompts/create_specification.baml`

**CLI Package**:
- `packages/cli/src/commands/mappings.ts`
- `packages/cli/src/commands/analyze.ts`
- `packages/cli/src/commands/trace.ts`

**Web Package**:
- `packages/web/src/components/graph/LayerSelector.tsx`
- `packages/web/src/components/graph/GraphSelector.tsx`
- `packages/web/src/components/graph/MappingView.tsx`
- `packages/web/src/components/graph/ImpactView.tsx`
- `packages/web/src/components/graph/TraceView.tsx`
- `packages/web/src/components/graph/nodes/EpicNode.tsx`
- `packages/web/src/components/graph/nodes/UserStoryNode.tsx`
- `packages/web/src/components/graph/nodes/CapabilityNode.tsx`
- `packages/web/src/components/graph/nodes/TechnicalRequirementNode.tsx`
- `packages/web/src/components/graph/nodes/FlowScreenNode.tsx`
- `packages/web/src/components/graph/nodes/FlowActionNode.tsx`

**Documentation**:
- `docs/FLOW_MODELING.md`
- `docs/LAYER_ARCHITECTURE.md`
- `docs/CROSS_LAYER_DEPENDENCIES.md`

### Files to Modify

**Core Package**:
- `packages/core/src/models/Graph.ts` - Complete restructure
- `packages/core/src/models/Task.ts` - Add layer field
- `packages/core/src/models/Dependency.ts` - Extend types
- `packages/core/src/models/ChangeRequest.ts` - Add impact analysis
- `packages/core/src/storage/ProjectStore.ts` - Multi-file storage
- `packages/core/src/validation/dag.ts` - Multi-graph validation

**AI Package**:
- `packages/ai/baml_src/types/entities.baml` - Layer-aware types
- `packages/ai/baml_src/prompts/analyze_change.baml` - Cross-layer analysis
- `packages/ai/src/planner.ts` - Multi-layer generation

**CLI Package**:
- `packages/cli/src/commands/create.ts` - Layer-aware creation
- `packages/cli/src/commands/show.ts` - Add layer filters
- `packages/cli/src/commands/change.ts` - Impact analysis output
- `packages/cli/src/commands/cr.ts` - Cross-layer CR display

**Web Package**:
- `packages/web/src/components/graph/GraphView.tsx` - Layer/graph selection
- `packages/web/src/lib/graph-utils.ts` - Multi-graph layout
- `packages/web/src/lib/hooks/useGraph.ts` - Multi-graph fetching
- `packages/web/src/app/api/projects/[projectId]/graph/route.ts` - Return layered data

---

## Success Criteria

After completing all four phases, users should be able to:

1. ✅ Create project with three distinct layers (Narrative, Structure, Specification)
2. ✅ View Feature Graph and Flow Graph separately within Structure Layer
3. ✅ See which capabilities a user flow requires via many-to-many mappings
4. ✅ Analyze impact of changing an Epic across all layers
5. ✅ Trace dependencies: User Story → Capability → Technical Requirement → Task
6. ✅ Propose changes that span layers with AI-generated impact analysis
7. ✅ Visualize cross-layer dependencies in web UI
8. ✅ Understand how UX flows map to feature capabilities and technical implementation

---

## Key Architectural Principles

### Layer Separation of Concerns

**Narrative Layer** - Human-first, motivation-driven
- Answers: "What are we trying to do and why?"
- Format: Natural language stories
- Users: Product managers, stakeholders

**Structure Layer** - Machine-reasonable, execution-oriented
- Answers: "What needs to happen and how do things depend on each other?"
- Format: Dual graphs (Feature + Flow)
- Users: Architects, AI agents

**Specification Layer** - Precise, testable, implementable
- Answers: "What does done look like?"
- Format: Technical requirements and tasks
- Users: Engineers, AI coding agents

### Dual Graph Philosophy

**Feature Graph** - What the system can do
- Nodes: Capabilities
- Edges: Dependencies between capabilities
- Layout: Hierarchical DAG

**Flow Graph** - How users interact
- Nodes: Screens and Actions
- Edges: User journey transitions
- Layout: Left-to-right flow

**Mappings** - Binding the two together
- Many-to-many relationships
- Each flow action maps to one or more capabilities
- Enables cross-graph impact analysis

### Cross-Layer Dependencies

Dependencies can exist within layers and across layers:
- Within layer: Feature depends on Feature, Task depends on Task
- Across layers: Story → Capability, Capability → Requirement, Requirement → Task

This creates a complete trace from user intent to implementation.
