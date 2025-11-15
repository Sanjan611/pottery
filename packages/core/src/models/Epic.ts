import { Layer } from './Layer';

export interface Epic {
  id: string;                    // "epic-xyz"
  name: string;
  description: string;
  userStories: string[];         // UserStory IDs
  version: string;
  layer: Layer.Narrative;
  created_at: string;
  updated_at: string;
}
