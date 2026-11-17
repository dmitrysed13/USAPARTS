export const SEMANTIC_CLUSTER_INTENTS = [
  "COMMERCIAL_BROAD",
  "COMMERCIAL_MID",
  "COMMERCIAL_NARROW",
  "INFORMATIONAL",
  "GEO",
  "B2B",
] as const;

export type SemanticClusterIntentId = (typeof SEMANTIC_CLUSTER_INTENTS)[number];
