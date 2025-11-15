import { Layer } from './Layer';

export type TechnicalRequirementType =
  | "performance"
  | "security"
  | "scalability"
  | "reliability"
  | "other";

export interface TechnicalRequirement {
  id: string;                    // "req-xyz"
  type: TechnicalRequirementType;
  specification: string;
  linkedCapabilities: string[];  // Which capabilities this supports
  linkedTasks: string[];         // Implementation tasks
  version: string;
  layer: Layer.Specification;
  created_at: string;
  updated_at: string;
}
