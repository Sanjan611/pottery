export interface Feature {
  id: string;                    // Format: "feature-<uuid>"
  name: string;
  description: string;
  version: string;
  linked_intent: string;         // SubIntent ID
  linked_tasks: string[];        // Task IDs
  ux_spec?: string;              // UXSpec ID (optional)
  created_at: string;
  updated_at: string;
}
