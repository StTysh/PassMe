import { CHUNK_OVERLAP, CHUNK_TARGET_SIZE } from "@/lib/constants";

export type ChunkedText = {
  chunkIndex: number;
  text: string;
  tokenEstimate: number;
};

export function chunkText(
  text: string,
  chunkSize = CHUNK_TARGET_SIZE,
  overlap = CHUNK_OVERLAP,
) {
  const normalized = text.replace(/\r/g, "").trim();
  if (!normalized) {
    return [] as ChunkedText[];
  }

  const chunks: ChunkedText[] = [];
  let cursor = 0;
  let index = 0;

  while (cursor < normalized.length) {
    const end = Math.min(normalized.length, cursor + chunkSize);
    const slice = normalized.slice(cursor, end).trim();

    if (slice) {
      chunks.push({
        chunkIndex: index,
        text: slice,
        tokenEstimate: estimateTokens(slice),
      });
      index += 1;
    }

    if (end === normalized.length) {
      break;
    }

    cursor = Math.max(end - overlap, cursor + 1);
  }

  return chunks;
}

export function estimateTokens(text: string) {
  return Math.ceil(text.split(/\s+/).filter(Boolean).length * 1.3);
}
