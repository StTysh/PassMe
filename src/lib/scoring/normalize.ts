import type { EvaluationPayload } from "@/lib/types/domain";

export function clampScore(score: number) {
  return Math.max(0, Math.min(100, Math.round(score * 10) / 10));
}

export function normalizeDimensionScores(
  scores: EvaluationPayload["dimensionScores"],
) {
  return {
    clarity: clampScore(scores.clarity),
    relevance: clampScore(scores.relevance),
    evidence: clampScore(scores.evidence),
    structure: clampScore(scores.structure),
    roleFit: clampScore(scores.roleFit),
    confidence: clampScore(scores.confidence),
  };
}
