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
