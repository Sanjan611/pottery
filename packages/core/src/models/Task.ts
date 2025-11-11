export enum TaskType {
  Backend = "backend",
  Frontend = "frontend",
  Test = "test",
  Infrastructure = "infra"
}

export interface Task {
  id: string;                    // Format: "task-<uuid>"
  parent_feature: string;        // Feature ID
  type: TaskType;
  description: string;
  version: string;
  dependencies: string[];        // Dependency IDs
  created_at: string;
  updated_at: string;
}
