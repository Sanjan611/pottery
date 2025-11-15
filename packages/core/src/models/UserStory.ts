import { Layer } from './Layer';

export interface UserStory {
  id: string;                    // "story-xyz"
  narrative: string;             // "As a [user], I want [goal], so that [benefit]"
  acceptanceCriteria: string[];
  linkedCapabilities: string[];  // Capability IDs in structure layer
  parentEpic: string;            // Epic ID
  version: string;
  layer: Layer.Narrative;
  created_at: string;
  updated_at: string;
}
