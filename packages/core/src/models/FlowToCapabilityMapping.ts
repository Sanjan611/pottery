export interface FlowToCapabilityMapping {
  id: string;                    // "mapping-xyz"
  flowActionId: string;          // Which flow action
  capabilityIds: string[];       // Which capabilities it requires
  rationale: string;             // Why this mapping exists
  version: string;
  created_at: string;
  updated_at: string;
}
