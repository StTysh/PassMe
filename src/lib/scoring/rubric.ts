import { z } from "zod";

import { SCORE_BANDS } from "@/lib/constants";
import type { EvaluationPayload } from "@/lib/types/domain";

export const scoreBandSchema = z.enum([
  "Needs work",
  "Developing",
  "Promising",
  "Strong",
]);

export type ScoreBand = z.infer<typeof scoreBandSchema>;

export const SCORE_WEIGHTS = {
  clarity: 0.16,
  relevance: 0.19,
  evidence: 0.21,
  structure: 0.14,
  roleFit: 0.2,
  confidence: 0.1,
} as const;

export function computeOverallScore(
  dimensionScores: EvaluationPayload["dimensionScores"],
) {
  const weighted =
    dimensionScores.clarity * SCORE_WEIGHTS.clarity +
    dimensionScores.relevance * SCORE_WEIGHTS.relevance +
    dimensionScores.evidence * SCORE_WEIGHTS.evidence +
    dimensionScores.structure * SCORE_WEIGHTS.structure +
    dimensionScores.roleFit * SCORE_WEIGHTS.roleFit +
    dimensionScores.confidence * SCORE_WEIGHTS.confidence;

  return Math.round(weighted * 10) / 10;
}

export function bandForScore(score: number) {
  return (
    SCORE_BANDS.find((band) => score >= band.min && score <= band.max)?.label ??
    "Needs work"
  );
}
