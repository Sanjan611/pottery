export enum DependencyType {
  Requires = "requires",
  Blocks = "blocks",
  Impacts = "impacts",
  Supersedes = "supersedes"
}

export interface Dependency {
  id: string;                    // Format: "dep-<uuid>"
  from_id: string;               // Source node ID
  to_id: string;                 // Target node ID
  type: DependencyType;
  created_at: string;
}
