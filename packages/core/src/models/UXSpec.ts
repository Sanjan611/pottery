export interface UXSpec {
  id: string;                    // Format: "uxspec-<uuid>"
  linked_feature: string;        // Feature ID
  experience_goal: string;
  design_refs: string[];         // URLs or file paths
  created_at: string;
}
