// Core entity type definitions

class ProductIntent {
  name string
  description string
  sub_intents SubIntent[]
}

class SubIntent {
  name string
  description string
  features Feature[]
}

class Feature {
  name string
  description string
  linked_intent string  // SubIntent name
  tasks Task[]
  ux_spec UXSpec?
}

class Task {
  type TaskType
  description string
  dependencies string[]  // Task descriptions they depend on
}

enum TaskType {
  Backend
  Frontend
  Test
  Infrastructure
}

class UXSpec {
  experience_goal string
  design_refs string[]
}

class Dependency {
  from_description string
  to_description string
  type DependencyType
}

enum DependencyType {
  Requires
  Blocks
  Impacts
  Supersedes
}

class ChangeRequestPlan {
  description string
  new_features Feature[]
  modified_features FeatureModification[]
  new_tasks Task[]
  modified_tasks TaskModification[]
  impact_analysis ImpactAnalysis
}

class FeatureModification {
  feature_name string
  reason string
  new_tasks Task[]
  updated_tasks TaskUpdate[]
}

class TaskUpdate {
  original_description string
  new_description string
  reason string
}

class TaskModification {
  task_description string
  modification_reason string
  new_description string?
}

class ImpactAnalysis {
  affected_features string[]
  affected_tasks string[]
  reasoning string
  risk_level RiskLevel
}

enum RiskLevel {
  Low
  Medium
  High
}

// ========================================
// Layered Architecture Types (Phase 1)
// ========================================

// Narrative Layer
class Epic {
  name string
  description string
  userStoryNames string[]  // Will be resolved to UserStory IDs
}

class UserStory {
  narrative string  // "As a [user], I want [goal], so that [benefit]"
  acceptanceCriteria string[]
  epicName string  // Will be resolved to Epic ID
  linkedCapabilityNames string[]  // Will be resolved to Capability IDs in structure layer
}

// Structure Layer - Feature Graph
class Capability {
  name string
  description string  // What the system does
  linkedUserStoryNames string[]  // Back-reference to narrative layer
}

// Structure Layer - Flow Graph
class FlowScreen {
  name string
  description string
  actionNames string[]  // Will be resolved to FlowAction IDs
}

class FlowAction {
  name string
  description string
  triggerType FlowActionTriggerType
  parentScreenName string  // Will be resolved to FlowScreen ID
  nextScreenName string?  // Optional transition to another screen
  linkedCapabilityNames string[]  // For many-to-many mapping to capabilities
}

enum FlowActionTriggerType {
  User
  System
}

// Many-to-many mapping between FlowActions and Capabilities
class FlowToCapabilityMapping {
  flowActionName string  // Will be resolved to FlowAction ID
  capabilityNames string[]  // Will be resolved to Capability IDs
  rationale string  // Why this mapping exists - explain the relationship
}

// Specification Layer
class TechnicalRequirement {
  type TechnicalRequirementType
  specification string
  linkedCapabilityNames string[]  // Which capabilities this supports
}

enum TechnicalRequirementType {
  Performance
  Security
  Scalability
  Reliability
  Other
}

// Layered project structure
class NarrativeLayer {
  epics Epic[]
  userStories UserStory[]
}

class StructureLayer {
  capabilities Capability[]  // Feature graph
  flowScreens FlowScreen[]  // Flow graph
  flowActions FlowAction[]  // Flow graph
  mappings FlowToCapabilityMapping[]  // Explicit many-to-many mappings between actions and capabilities
}

class SpecificationLayer {
  technicalRequirements TechnicalRequirement[]
  tasks Task[]
}

class LayeredProject {
  narrativeLayer NarrativeLayer
  structureLayer StructureLayer
  specificationLayer SpecificationLayer
}
