import { Layer } from './Layer';

export type FlowActionTriggerType = "user" | "system";

export interface FlowAction {
  id: string;                    // "action-update-quantity"
  name: string;                  // "Update Item Quantity"
  description: string;
  triggerType: FlowActionTriggerType; // User-initiated or automatic
  parentScreen: string;          // FlowScreen ID
  nextScreen?: string;           // Optional transition to another screen (FlowScreen ID)
  linkedCapabilities: string[];  // Many-to-many mapping to capabilities (Capability IDs)
  version: string;
  layer: Layer.Structure;
  created_at: string;
  updated_at: string;
}
