import { Layer } from './Layer';

export interface Capability {
  id: string;                    // "cap-xyz"
  name: string;
  description: string;           // What the system does
  linkedUserStories: string[];   // Back-reference to narrative layer
  linkedTechnicalReqs: string[]; // Forward-reference to spec layer
  version: string;
  layer: Layer.Structure;
  created_at: string;
  updated_at: string;
}
