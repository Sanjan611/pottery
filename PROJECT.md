# 🧩 Product Requirements Document (PRD)

**Product Name:** Pottery

**Tagline:** A planning framework that enables autonomous software agents to build products by representing project structure as a living directed acyclic graph (DAG).

---

## 1. Product Overview

**High-Level Goal:** Pottery is designed to create the framework for **autonomous software agents** to build and evolve software products end-to-end. By representing product structure as a structured graph, agents can understand context, dependencies, and impact of changes—enabling them to make intelligent decisions during development.

Pottery is a planning system designed for **greenfield projects** that turns high-level product goals into structured plans and evolves them safely over time. It represents every component of a product—vision, UX, features, and tasks—as nodes in a living directed acyclic graph (DAG).

**Design Philosophy:**
- Built for greenfield projects where circular dependencies can be avoided from the start
- Circular dependencies are treated as anti-patterns and prevented by DAG constraints
- Focus on clean architectural boundaries and explicit dependency management
- Provides rich, structured context for autonomous agents to understand the entire product

The MVP enables:

- **Structured product representation** as a graph of intents, features, and tasks
- **AI-assisted task decomposition and impact analysis**
- **Versioned ChangeRequests** for safe evolution of the product graph
- **Web-based visualization** of the entire product structure
- **Foundation for agent-driven development** (full autonomy is a future feature)

---

## 2. Terminology

**Node:** Any entity in the product graph (ProductIntent, SubIntent, Feature, Task, UXSpec, Dependency, or ChangeRequest). Nodes are connected by edges to form a directed acyclic graph (DAG) that represents the entire product structure. Each node has a unique ID, version, and can be linked to other nodes through dependencies. **Task** is the smallest executable unit in the system.

---

## 3. Core Entities

| Entity | Description | Key Fields |
|--------|-------------|------------|
| **ProductIntent** | The root "why." Defines the product's vision, goals, and qualitative constraints. | `id`, `name`, `description`, `version`, `linked_features[]` |
| **SubIntent** | A strategic pillar under the main intent (e.g. "Scalability," "Human–AI collaboration"). | `id`, `parent_intent`, `name`, `linked_features[]` |
| **Feature** | A distinct capability or user-facing behavior. | `id`, `name`, `description`, `version`, `linked_tasks[]`, `linked_intent`, `ux_spec` |
| **Task** | Atomic unit of work generated from a Feature. Sizing is variable. | `id`, `type` (backend/frontend/test/infra), `description`, `version`, `dependencies[]` |
| **Dependency** | Defines relationships between nodes. Validated with type-specific rules. | `from_id`, `to_id`, `type` (requires, blocks, impacts, supersedes) |
| **ChangeRequest (CR)** | A structured diff proposing modification to any node. | `id`, `initiator`, `node_target`, `change_summary`, `impact_map[]` |
| **UXSpec** | Captures UX discussion and goals for a Feature (similar to product team practices). | `id`, `linked_feature`, `experience_goal`, `design_refs[]` |

---

## 4. Node Hierarchy

```
ProductIntent
   ├── SubIntents
   │     ├── Features
   │     │     ├── Tasks
   │     │     └── UXSpecs
   │     └── Dependencies
   └── ChangeRequests (link anywhere)
```

**Key Principles:**

- Parents own lifecycle; children evolve via versioning, not mutation.
- Cross-intent relationships are modeled as Dependency edges, not shared ownership.
- Circular dependencies are not allowed (DAG constraint).

### Dependency Type Validation:

| Type | Validation Rules |
|------|------------------|
| **requires** | Target node must exist and not be deprecated. Creates a directed edge. |
| **blocks** | Indicates that source node blocks the target node. Creates a directed edge. |
| **impacts** | Indicates related nodes affected by changes. Potentially non-directed (bidirectional relationship). AI determines impact semantics. |
| **supersedes** | Both nodes must be the same entity type; old node is marked as deprecated. |

---

## 5. User Interaction Workflow

The system is designed for minimal user input with maximum AI automation:

1. **User provides high-level change** (e.g., `pottery change "Add user authentication"`)
2. **AI analyzes the product graph** and determines all impacts across nodes
3. **AI automatically creates a ChangeRequest** showing:
   - New nodes to be created
   - Existing nodes to be modified
   - Dependencies to be added/updated
   - Full impact propagation map
4. **User reviews and decides**: approve, modify, or reject
5. **System executes the merge**: regenerates affected nodes with new versions

**Example CLI Interaction:**
```
$ pottery change "Add user authentication"

Analyzing impact across product graph...

Created ChangeRequest CR-001:
├─ New Feature: User Authentication
│  └─ Generates 5 new Tasks:
│     ├─ Task: Implement auth service
│     ├─ Task: Create login UI
│     └─ ...
└─ Impacts existing nodes:
   └─ Feature: API Gateway (requires auth middleware)

Review this change request? [approve/modify/reject]
```

---

## 6. ChangeRequest (CR) Lifecycle

**Purpose:** Represent evolution at any level (intent → feature → task).

### Stages:

1. **Proposed** – created by AI.
2. **Analyzed** – planner builds impact graph and identifies affected nodes.
3. **Reviewed** – human approves or modifies.
4. **Merged** – system generates new versions of affected nodes; dependencies automatically point to new versions.

**MVP Scope Note:** Concurrent ChangeRequest conflict resolution is out of scope. The system assumes sequential CR processing. Conflict handling will be addressed in future releases.

### Scope Levels:

| CR Target | Example | Propagation |
|-----------|---------|-------------|
| ProductIntent | "Shift focus to serverless cost efficiency" | Full product re-plan |
| Feature | "Add real-time comments" | Rebuild related tasks |
| Task | "Refactor WebSocket handler to async" | Update dependent tasks |
| Cross-intent | "Update shared auth service" | Multi-intent impact |

---

## 7. Evolution Model

Every entity is versioned. Changing a feature creates `feature@vNext` with lineage links:

```
feat_103@v1.0  (live)
   └─ superseded_by → feat_103@v2.0  (draft)
```

**Versioning Approach:**
- Version control is performed at the **graph level** (not individual files)
- Diffs between graph versions are displayed similar to git code diffs
- Each CR merge creates a new graph version with updated node versions
- Planner re-analyzes affected dependencies and regenerates impacted tasks only

---

## 8. Implementation Scope

### MVP (Initial Release)

**Purpose:** Purely a planning system. Task execution is out of scope for MVP.

Core entities to be implemented:
- ProductIntent
- SubIntent
- Feature
- UXSpec
- Task (atomic unit, variable sizing)
- Dependency
- ChangeRequest

**Interface:**
- **CLI tool** for core operations (create, change, apply, list, delete)
- **Web-based visualization** (read-only for MVP) with:
  - Interactive graph rendering with automatic hierarchical layout
  - Zoom, pan, and minimap navigation
  - Search nodes by name, ID, or description
  - Filter by node type (Intent, SubIntent, Feature, Task, UXSpec)
  - Click nodes to view detailed information, dependencies, and metadata
  - Real-time updates (auto-refresh every 5 seconds)
  - Color-coded nodes by entity type
  - Hierarchical edge rendering showing parent-child relationships
  - Dependency edge rendering (requires, blocks, impacts, supersedes)

**Storage:** Graph-level version control with git-like diffs.

---

## 9. Future Features (Out of MVP Scope)

### **Agent Autonomy (Primary Goal):**
- **Autonomous task execution:** Enable agents to execute tasks by extracting context from the graph
- **Context generation for coding agents:** Traversing graph to provide relevant dependencies, requirements, and constraints
- **Agent orchestration:** Managing multiple agents working on different parts of the graph simultaneously
- **Artifact tracking:** Linking code, tests, docs, and design outputs to tasks for agent verification
- **Continuous validation:** Agents verify their work against ProductIntent and UXSpec goals

### **Planning & Evolution:**
- **Concurrent ChangeRequest conflict resolution:** Handling multiple overlapping CRs
- **Advanced AI capabilities:** Improved impact analysis, dependency inference, and task decomposition
- **Task granularity refinement:** Formal definition of atomic task sizing optimized for agent execution
- **Self-updating PRDs:** Auto-generation of human-readable documents from graph

### **Observability & Management:**
- **Status and priority fields:** Workflow states (draft/active/completed), priority levels (P0-P3)
- **Metrics tracking:** Measuring SubIntent and UXSpec success criteria
- **Effort estimation:** Both developer hours and LLM token costs
- **Agent execution logs:** Tracking agent decisions, tool usage, and reasoning

### **Web Visualization Enhancements:**
- **ChangeRequest visualization:** Show pending CRs with highlighted affected nodes
- **Version history view:** Timeline of graph evolution with diffs between versions
- **Graph editing:** Drag nodes to reposition, add/remove nodes via UI, edit properties
- **Export capabilities:** Export graph as PNG/SVG, export data as JSON
- **Real-time collaboration:** Multi-user viewing with live updates and comments on nodes
