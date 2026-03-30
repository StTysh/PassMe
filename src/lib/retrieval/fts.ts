import { RETRIEVAL_TOP_K } from "@/lib/constants";
import { documentsRepo } from "@/lib/repositories/documentsRepo";
import { transcriptRepo } from "@/lib/repositories/transcriptRepo";

export function searchDocumentChunks(query: string, profileId?: string, topK = RETRIEVAL_TOP_K) {
  return documentsRepo.searchChunks(query, profileId).slice(0, topK) as Array<{ text: string }>;
}

export function searchTranscript(query: string, sessionId?: string, topK = RETRIEVAL_TOP_K) {
  return transcriptRepo.searchTranscript(query, sessionId).slice(0, topK) as Array<{ text: string }>;
}

export function getRecentTranscriptWindow(sessionId: string, n: number) {
  return transcriptRepo.getLastTurns(sessionId, n);
}
