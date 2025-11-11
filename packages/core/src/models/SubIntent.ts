export interface SubIntent {
  id: string;                    // Format: "subintent-<uuid>"
  parent_intent: string;         // ProductIntent ID
  name: string;
  description: string;
  version: string;
  linked_features: string[];
  created_at: string;
  updated_at: string;
}
