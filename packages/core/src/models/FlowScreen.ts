import { Layer } from './Layer';

export interface FlowScreen {
  id: string;                    // "screen-cart-review"
  name: string;                  // "Cart Review"
  description: string;
  actions: string[];             // FlowAction IDs
  entryTransitions: string[];    // Screens that can navigate here (FlowScreen IDs)
  layer: Layer.Structure;
  version: string;
  created_at: string;
  updated_at: string;
}
