import { searchDocumentChunks } from "@/lib/retrieval/fts";

export function buildRetrievalContext(profileId: string, query: string) {
  return searchDocumentChunks(query, profileId).map((chunk) => chunk.text);
}
