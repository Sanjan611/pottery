# Pottery Restructuring - Implementation Checklist

**Last Updated**: 2025-11-14
**Status**: Not Started

---

## Phase 1: Three-Layer Foundation

### 1.1 Create New Layer-Aware Models ⬜

- [ ] Create `packages/core/src/models/Layer.ts`
  - [ ] Define `Layer` enum with three values
  - [ ] Export layer type

- [ ] Create `packages/core/src/models/Epic.ts`
  - [ ] Define Epic interface
  - [ ] Add layer field set to `Layer.Narrative`
  - [ ] Add version, timestamps, userStories array

- [ ] Create `packages/core/src/models/UserStory.ts`
  - [ ] Define UserStory interface
  - [ ] Add narrative, acceptanceCriteria fields
  - [ ] Add linkedCapabilities for cross-layer references
  - [ ] Add parentEpic reference

- [ ] Create `packages/core/src/models/Capability.ts`
  - [ ] Define Capability interface (replaces Feature)
  - [ ] Add linkedUserStories (back-reference)
  - [ ] Add linkedTechnicalReqs (forward-reference)
  - [ ] Add layer field set to `Layer.Structure`

- [ ] Create `packages/core/src/models/TechnicalRequirement.ts`
  - [ ] Define TechnicalRequirement interface
  - [ ] Add type enum (performance, security, etc.)
  - [ ] Add linkedCapabilities and linkedTasks
  - [ ] Add layer field set to `Layer.Specification`

- [ ] Modify `packages/core/src/models/Task.ts`
  - [ ] Add `layer: Layer.Specification` field
  - [ ] Ensure compatibility with existing structure

### 1.2 Restructure Graph Model ⬜

- [ ] Modify `packages/core/src/models/Graph.ts`
  - [ ] Create `LayeredGraph` interface
  - [ ] Add narrativeLayer with nodes and edges
  - [ ] Add structureLayer with nodes and edges (single graph for now)
  - [ ] Add specificationLayer with nodes and edges
  - [ ] Add crossLayerDependencies map
  - [ ] Create `CrossLayerDependency` interface
  - [ ] Create `CrossLayerDependencyType` enum
  - [ ] Update serialization/deserialization logic

### 1.3 Update Storage Layer ⬜

- [ ] Modify `packages/core/src/storage/ProjectStore.ts`
  - [ ] Create `layers/` subdirectory in project folder
  - [ ] Implement `saveNarrativeLayer()` → `layers/narrative.json`
  - [ ] Implement `saveStructureLayer()` → `layers/structure.json`
  - [ ] Implement `saveSpecificationLayer()` → `layers/specification.json`
  - [ ] Implement `saveCrossLayerDeps()` → `cross-layer-deps.json`
  - [ ] Update `saveGraph()` to save all layers atomically
  - [ ] Update `loadGraph()` to load and merge all layers
  - [ ] Update versioning to snapshot all layers in `versions/vN/` folder
  - [ ] Test atomic save/load (all or nothing)

### 1.4 Update Validation Layer ⬜

- [ ] Modify `packages/core/src/validation/dag.ts`
  - [ ] Create `validateLayeredGraph()` function
  - [ ] Implement per-layer DAG validation
  - [ ] Ensure narrativeLayer is acyclic
  - [ ] Ensure structureLayer is acyclic
  - [ ] Ensure specificationLayer is acyclic
  - [ ] Validate cross-layer dependencies don't create global cycles
  - [ ] Add layer-specific validation rules
  - [ ] Test with various graph structures

### 1.5 Update BAML Types and Prompts ⬜

- [ ] Modify `packages/ai/baml_src/types/entities.baml`
  - [ ] Add layer-aware entity classes
  - [ ] Create `Epic` class
  - [ ] Create `UserStory` class
  - [ ] Create `Capability` class
  - [ ] Create `TechnicalRequirement` class

- [ ] Create `packages/ai/baml_src/prompts/create_narrative.baml`
  - [ ] Define `CreateNarrativeLayer` function
  - [ ] Write prompt for generating Epics and UserStories
  - [ ] Specify output structure

- [ ] Create `packages/ai/baml_src/prompts/create_structure.baml`
  - [ ] Define `CreateStructureLayer` function
  - [ ] Write prompt for generating Capabilities
  - [ ] Accept narrativeLayer as input

- [ ] Create `packages/ai/baml_src/prompts/create_specification.baml`
  - [ ] Define `CreateSpecificationLayer` function
  - [ ] Write prompt for generating TechnicalRequirements and Tasks
  - [ ] Accept structureLayer as input

- [ ] Run BAML codegen
  - [ ] `cd packages/ai && pnpm baml-cli generate`
  - [ ] Verify generated TypeScript types

### 1.6 Update Planner ⬜

- [ ] Modify `packages/ai/src/planner.ts`
  - [ ] Create `createNarrativeLayer(intent: string)` method
  - [ ] Create `createStructureLayer(narrative: NarrativeLayer)` method
  - [ ] Create `createSpecificationLayer(structure: StructureLayer)` method
  - [ ] Create orchestration method `createLayeredProject(intent: string)`
  - [ ] Implement name→ID resolution across layers
  - [ ] Handle cross-layer references
  - [ ] Test end-to-end generation

### 1.7 Update CLI Commands ⬜

- [ ] Modify `packages/cli/src/commands/create.ts`
  - [ ] Use new `planner.createLayeredProject()`
  - [ ] Update output formatting to show all layers
  - [ ] Test project creation

- [ ] Modify `packages/cli/src/commands/show.ts`
  - [ ] Add `--layer <narrative|structure|specification>` option
  - [ ] Implement layer filtering
  - [ ] Show appropriate nodes based on layer
  - [ ] Test layer-specific display

- [ ] Modify `packages/cli/src/commands/list.ts`
  - [ ] Update to work with new layered structure
  - [ ] Test project listing

### 1.8 Update Web Visualization ⬜

- [ ] Create `packages/web/src/components/graph/LayerSelector.tsx`
  - [ ] Three-option selector: Narrative / Structure / Specification
  - [ ] Styled UI component

- [ ] Create new node components:
  - [ ] `components/graph/nodes/EpicNode.tsx`
  - [ ] `components/graph/nodes/UserStoryNode.tsx`
  - [ ] `components/graph/nodes/CapabilityNode.tsx`
  - [ ] `components/graph/nodes/TechnicalRequirementNode.tsx`

- [ ] Modify `packages/web/src/components/graph/GraphView.tsx`
  - [ ] Integrate LayerSelector component
  - [ ] Filter nodes based on selected layer
  - [ ] Update node type mapping
  - [ ] Test layer switching

- [ ] Modify `packages/web/src/lib/graph-utils.ts`
  - [ ] Update `convertToReactFlow()` to handle layered graph
  - [ ] Different layouts per layer
  - [ ] Update edge extraction

- [ ] Modify API routes:
  - [ ] `packages/web/src/app/api/projects/[projectId]/graph/route.ts`
  - [ ] Return layered graph structure
  - [ ] Add layer query parameter support

- [ ] Test web UI
  - [ ] Layer selector works
  - [ ] Each layer displays correctly
  - [ ] Nodes render properly

### Phase 1 Testing ⬜

- [ ] Create test project via CLI
- [ ] Verify three layers are generated
- [ ] Check all JSON files created correctly
- [ ] View each layer in web UI
- [ ] Verify cross-layer references resolve
- [ ] Test versioning with layer snapshots
- [ ] Validate DAG constraints per layer

**Phase 1 Complete**: ⬜

---

## Phase 2: Dual Graph Architecture

### 2.1 Define Flow Node Models ⬜

- [ ] Create `packages/core/src/models/FlowScreen.ts`
  - [ ] Define FlowScreen interface
  - [ ] Add actions array (FlowAction IDs)
  - [ ] Add entryTransitions (incoming screens)
  - [ ] Add layer field set to `Layer.Structure`

- [ ] Create `packages/core/src/models/FlowAction.ts`
  - [ ] Define FlowAction interface
  - [ ] Add triggerType enum (user | system)
  - [ ] Add parentScreen reference
  - [ ] Add nextScreen optional transition
  - [ ] Add linkedCapabilities for many-to-many mapping

- [ ] Create `docs/FLOW_MODELING.md`
  - [ ] Document when to create screens vs actions
  - [ ] Provide examples from e-commerce apps
  - [ ] Provide examples from social apps
  - [ ] Provide examples from productivity apps
  - [ ] Best practices for granularity
  - [ ] Guidelines for trigger types

### 2.2 Split Structure Layer into Dual Graphs ⬜

- [ ] Modify `packages/core/src/models/Graph.ts`
  - [ ] Update structureLayer to contain featureGraph and flowGraph
  - [ ] featureGraph: nodes (Capability), edges (Dependency)
  - [ ] flowGraph: nodes (FlowScreen | FlowAction), edges (Dependency)
  - [ ] Update type definitions
  - [ ] Update serialization logic

### 2.3 Update Storage for Dual Graphs ⬜

- [ ] Modify `packages/core/src/storage/ProjectStore.ts`
  - [ ] Split `layers/structure.json` into:
    - [ ] `layers/structure-features.json`
    - [ ] `layers/structure-flows.json`
  - [ ] Update save methods
  - [ ] Update load methods
  - [ ] Update versioning to include both files

### 2.4 Update Validation ⬜

- [ ] Modify `packages/core/src/validation/dag.ts`
  - [ ] Validate feature graph is a DAG
  - [ ] Validate flow graph is a DAG
  - [ ] Ensure flow screen transitions don't create cycles
  - [ ] Validate flow actions reference valid parent screens
  - [ ] Validate nextScreen references exist
  - [ ] Test with complex flow scenarios

### 2.5 Update BAML for Dual Graph Generation ⬜

- [ ] Modify `packages/ai/baml_src/types/entities.baml`
  - [ ] Add FlowScreen class
  - [ ] Add FlowAction class

- [ ] Modify `packages/ai/baml_src/prompts/create_structure.baml`
  - [ ] Update to generate both capabilities and flows
  - [ ] Add instructions for user journey modeling
  - [ ] Add instructions for screen creation
  - [ ] Add instructions for action creation
  - [ ] Specify linking actions to capabilities

- [ ] Run BAML codegen
  - [ ] Verify new types generated

- [ ] Update `packages/ai/src/planner.ts`
  - [ ] Update `createStructureLayer()` to handle dual graphs
  - [ ] Resolve screen→action relationships
  - [ ] Resolve action→capability linkages
  - [ ] Test generation

### 2.6 Update Web Visualization for Dual Graphs ⬜

- [ ] Create `packages/web/src/components/graph/GraphSelector.tsx`
  - [ ] Three options: Feature / Flow / Both
  - [ ] Only visible when Structure layer selected

- [ ] Create new node components:
  - [ ] `components/graph/nodes/FlowScreenNode.tsx` (blue)
  - [ ] `components/graph/nodes/FlowActionNode.tsx` (purple)

- [ ] Modify `packages/web/src/components/graph/GraphView.tsx`
  - [ ] Integrate GraphSelector
  - [ ] Show feature graph when "Feature" selected
  - [ ] Show flow graph when "Flow" selected
  - [ ] Show both with different colors when "Both" selected
  - [ ] Update node type mapping

- [ ] Modify `packages/web/src/lib/graph-utils.ts`
  - [ ] Create separate layout for feature graph (hierarchical)
  - [ ] Create separate layout for flow graph (left-to-right)
  - [ ] Handle combined layout for "Both" view

- [ ] Test dual graph visualization
  - [ ] Feature graph displays correctly
  - [ ] Flow graph displays correctly
  - [ ] Combined view shows both

### 2.7 Update CLI ⬜

- [ ] Modify `packages/cli/src/commands/show.ts`
  - [ ] Add `--graph <feature|flow>` option
  - [ ] Works with `--layer structure`
  - [ ] Filter output based on graph type

- [ ] Test CLI commands
  - [ ] `pottery show --project-id X --layer structure --graph feature`
  - [ ] `pottery show --project-id X --layer structure --graph flow`

### Phase 2 Testing ⬜

- [ ] Create new project
- [ ] Verify both feature and flow graphs generated
- [ ] Check structure-features.json has capabilities
- [ ] Check structure-flows.json has screens and actions
- [ ] View feature graph in web UI
- [ ] View flow graph in web UI
- [ ] View both graphs simultaneously
- [ ] Verify flow actions reference correct screens
- [ ] Validate DAG constraints on both graphs

**Phase 2 Complete**: ⬜

---

## Phase 3: Many-to-Many Mappings

### 3.1 Create Mapping Model ⬜

- [ ] Create `packages/core/src/models/FlowToCapabilityMapping.ts`
  - [ ] Define FlowToCapabilityMapping interface
  - [ ] Include flowActionId, capabilityIds array, rationale
  - [ ] Add version and timestamps

### 3.2 Add Mappings to Graph Structure ⬜

- [ ] Modify `packages/core/src/models/Graph.ts`
  - [ ] Add `mappings: Map<string, FlowToCapabilityMapping>` to structureLayer
  - [ ] Update serialization

### 3.3 Update Storage ⬜

- [ ] Modify `packages/core/src/storage/ProjectStore.ts`
  - [ ] Add `layers/mappings.json` file
  - [ ] Implement save/load for mappings
  - [ ] Include in version snapshots

### 3.4 AI-Powered Mapping Generation ⬜

- [ ] Modify `packages/ai/baml_src/types/entities.baml`
  - [ ] Add FlowToCapabilityMapping class

- [ ] Modify `packages/ai/baml_src/prompts/create_structure.baml`
  - [ ] Update output to include mappings array
  - [ ] Add prompt instructions for mapping inference
  - [ ] Ask AI to explain rationale for each mapping

- [ ] Run BAML codegen

- [ ] Update `packages/ai/src/planner.ts`
  - [ ] Process mapping output from AI
  - [ ] Resolve flow action names → IDs
  - [ ] Resolve capability names → IDs
  - [ ] Store mappings in graph
  - [ ] Test mapping generation

### 3.5 Validation for Mappings ⬜

- [ ] Create `packages/core/src/validation/mappings.ts`
  - [ ] Validate all flowActionIds exist in flow graph
  - [ ] Validate all capabilityIds exist in feature graph
  - [ ] Detect orphaned mappings (references to deleted nodes)
  - [ ] Warn if flow action has zero mappings
  - [ ] Test validation logic

### 3.6 CLI Commands for Mappings ⬜

- [ ] Create `packages/cli/src/commands/mappings.ts`
  - [ ] Implement `pottery mappings list --project-id X`
  - [ ] Implement `pottery mappings analyze --flow-action-id X`
  - [ ] Implement `pottery mappings analyze --capability-id X`
  - [ ] Implement `pottery mappings analyze --screen-id X`
  - [ ] Format output with tables
  - [ ] Show rationale for each mapping

- [ ] Test all mapping commands

### 3.7 Mapping Visualization ⬜

- [ ] Create `packages/web/src/components/graph/MappingView.tsx`
  - [ ] Bipartite graph layout
  - [ ] Flow actions on left, capabilities on right
  - [ ] Lines connecting them
  - [ ] Hover tooltips showing rationale
  - [ ] Interactive filtering
  - [ ] Highlight related nodes on selection

- [ ] Add "Mappings" tab to web UI
  - [ ] Update navigation
  - [ ] Route to MappingView component

- [ ] Test mapping visualization
  - [ ] Mappings render correctly
  - [ ] Hover shows rationale
  - [ ] Selection highlights work
  - [ ] Filtering works

### Phase 3 Testing ⬜

- [ ] Create new project
- [ ] Verify mappings are generated by AI
- [ ] Check mappings.json file created
- [ ] View mappings in CLI
- [ ] Analyze specific flow action dependencies
- [ ] Analyze specific capability usage
- [ ] View mappings in web UI
- [ ] Test interactive features
- [ ] Validate mapping consistency

**Phase 3 Complete**: ⬜

---

## Phase 4: Cross-Layer Dependency Analysis

### 4.1 Cross-Layer Dependency Tracking ⬜

- [ ] Verify `CrossLayerDependency` interface exists (from Phase 1)
- [ ] Verify `CrossLayerDependencyType` enum exists
- [ ] Test cross-layer dependency storage

### 4.2 Build Impact Analysis Engine ⬜

- [ ] Create `packages/core/src/analysis/ImpactAnalyzer.ts`
  - [ ] Define ImpactAnalyzer class
  - [ ] Implement `analyzeImpact(nodeId, graph)` method
  - [ ] Implement `getDownstreamImpact(nodeId)` method
  - [ ] Implement `getUpstreamImpact(nodeId)` method
  - [ ] Implement `getCrossLayerImpact(nodeId)` method
  - [ ] Implement `traceNarrativeToImplementation(epicId)` method
  - [ ] Implement `traceImplementationToNarrative(taskId)` method
  - [ ] Define ImpactReport interface
  - [ ] Define TraceReport interface

- [ ] Algorithm implementation:
  - [ ] Build combined dependency graph across all layers
  - [ ] Implement BFS/DFS traversal
  - [ ] Track layer crossings
  - [ ] Return structured reports

- [ ] Test impact analysis:
  - [ ] Test with single-layer changes
  - [ ] Test with cross-layer changes
  - [ ] Test trace from epic to tasks
  - [ ] Test reverse trace from task to epic

### 4.3 Enhance ChangeRequest System ⬜

- [ ] Modify `packages/core/src/models/ChangeRequest.ts`
  - [ ] Add `impactAnalysis?: ImpactReport` field
  - [ ] Add `crossLayerChanges` field with per-layer changes
  - [ ] Update serialization

- [ ] Modify `packages/ai/baml_src/prompts/analyze_change.baml`
  - [ ] Include entire layered graph in prompt
  - [ ] Ask AI to analyze impact across all layers
  - [ ] Request changes for affected nodes in all layers
  - [ ] Output structured cross-layer change plan

- [ ] Run BAML codegen

- [ ] Update `packages/ai/src/planner.ts`
  - [ ] Implement `analyzeChangeWithImpact(description, graph)` method
  - [ ] Process cross-layer impact from AI
  - [ ] Generate ImpactReport
  - [ ] Test change analysis

### 4.4 CLI Impact Analysis Commands ⬜

- [ ] Create `packages/cli/src/commands/analyze.ts`
  - [ ] Implement `pottery analyze impact --node-id X`
  - [ ] Implement `pottery analyze dependencies --node-id X`
  - [ ] Format impact report output
  - [ ] Show affected nodes per layer

- [ ] Create `packages/cli/src/commands/trace.ts`
  - [ ] Implement `pottery trace --from epic-X`
  - [ ] Implement `pottery trace --from task-X --reverse`
  - [ ] Format trace path output
  - [ ] Show full dependency path

- [ ] Test all analysis commands

### 4.5 Advanced Visualization ⬜

- [ ] Create `packages/web/src/components/graph/ImpactView.tsx`
  - [ ] "Layer Cake" vertical stack layout
  - [ ] Show all three layers
  - [ ] Show cross-layer dependencies as vertical edges
  - [ ] Click node to highlight impact across layers
  - [ ] Animated propagation effect

- [ ] Create `packages/web/src/components/graph/TraceView.tsx`
  - [ ] Linear path visualization
  - [ ] Epic → Story → Capability → Requirement → Task
  - [ ] Show gaps (e.g., capability with no tasks)
  - [ ] Highlight path on selection

- [ ] Add dependency heat map:
  - [ ] Color code nodes by number of dependencies
  - [ ] Identify hot spots
  - [ ] Show bottleneck nodes

- [ ] Add new tabs to web UI:
  - [ ] "Impact" tab
  - [ ] "Trace" tab

- [ ] Test advanced visualizations

### 4.6 Update ChangeRequest Workflow ⬜

- [ ] Modify `packages/cli/src/commands/change.ts`
  - [ ] Use new `analyzeChangeWithImpact()` method
  - [ ] Display impact analysis in output
  - [ ] Show affected nodes per layer
  - [ ] Show cross-layer dependencies created/modified
  - [ ] Format with tables and colors

- [ ] Modify `packages/cli/src/commands/cr.ts`
  - [ ] Update `cr show` to display impact analysis
  - [ ] Show cross-layer changes
  - [ ] Highlight scope of impact

- [ ] Test enhanced change workflow:
  - [ ] Create change request
  - [ ] Verify impact analysis shown
  - [ ] Verify cross-layer changes identified
  - [ ] Review CR with impact details

### Phase 4 Testing ⬜

- [ ] Create project with all layers
- [ ] Test impact analysis on Epic change
- [ ] Test impact analysis on Capability change
- [ ] Test impact analysis on Task change
- [ ] Test trace from Epic to Task
- [ ] Test reverse trace from Task to Epic
- [ ] Create change request affecting multiple layers
- [ ] Verify impact analysis in CR output
- [ ] View impact in web UI
- [ ] View trace in web UI
- [ ] Test heat map visualization

**Phase 4 Complete**: ⬜

---

## Final Integration Testing

### End-to-End Workflows ⬜

- [ ] Create new project from scratch
  - [ ] Verify all three layers generated
  - [ ] Verify dual graphs in structure layer
  - [ ] Verify mappings created
  - [ ] Verify cross-layer dependencies

- [ ] View in web UI
  - [ ] Test layer selector
  - [ ] Test graph selector
  - [ ] Test mapping view
  - [ ] Test impact view
  - [ ] Test trace view

- [ ] Create change request
  - [ ] Verify cross-layer impact analysis
  - [ ] Apply change request
  - [ ] Verify all layers updated correctly
  - [ ] Verify version snapshot includes all layers

- [ ] CLI operations
  - [ ] List projects
  - [ ] Show project by layer
  - [ ] Show project by graph
  - [ ] Analyze impact
  - [ ] Trace dependencies
  - [ ] View mappings

### Documentation ⬜

- [ ] Update `README.md` with new architecture
- [ ] Update `QUICKSTART.md` with layer examples
- [ ] Update `USER_INTERFACE.md` with new CLI commands
- [ ] Verify `docs/FLOW_MODELING.md` is complete
- [ ] Create `docs/LAYER_ARCHITECTURE.md`
- [ ] Create `docs/CROSS_LAYER_DEPENDENCIES.md`
- [ ] Update all code examples in docs

### Build and Deployment ⬜

- [ ] Build all packages
  - [ ] `pnpm --filter @pottery/core build`
  - [ ] `pnpm --filter @pottery/ai build`
  - [ ] `pnpm --filter @pottery/cli build`
  - [ ] `pnpm --filter @pottery/web build`

- [ ] Verify no build errors
- [ ] Test CLI installation: `cd packages/cli && npm link`
- [ ] Test all commands work after build

---

## Completion Checklist

- [ ] Phase 1 Complete
- [ ] Phase 2 Complete
- [ ] Phase 3 Complete
- [ ] Phase 4 Complete
- [ ] All tests passing
- [ ] Documentation updated
- [ ] Build successful
- [ ] Ready for use

**Project Status**: Not Started
**Estimated Completion**: TBD
