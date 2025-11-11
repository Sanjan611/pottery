export interface ProductIntent {
  id: string;                    // Format: "intent-<uuid>"
  name: string;
  description: string;
  version: string;               // Semver: "1.0.0"
  linked_sub_intents: string[];  // SubIntent IDs
  created_at: string;            // ISO 8601
  updated_at: string;            // ISO 8601
}
