import { z } from "zod";

import {
  coachingSchema,
  dimensionScoresSchema,
  evaluationSchema,
  difficultySchema,
  feedbackCategorySchema,
  interviewTypeSchema,
  interestLevelSchema,
  personaKeySchema,
  severitySchema,
  strengthSchema,
  weaknessSchema,
  missedPointSchema,
} from "@/lib/types/domain";

import { scoreBandSchema } from "@/lib/scoring/rubric";

export const feedbackItemSchema = z
  .object({
    category: feedbackCategorySchema,
    title: z.string().trim().min(1),
    body: z.string().trim().min(1),
    severity: severitySchema.optional(),
    sourceTurnIds: z.array(z.number().int().nonnegative()).default([]),
  })
  .strict();

export const evaluationPayloadSchema = evaluationSchema;
export const coachingPayloadSchema = coachingSchema;

export const reviewPayloadSchema = z
  .object({
    scores: evaluationSchema,
    feedback: z
      .object({
        strengths: z.array(strengthSchema).default([]),
        weaknesses: z.array(weaknessSchema).default([]),
        missedPoints: z.array(missedPointSchema).default([]),
        rewrittenAnswers: coachingSchema.shape.rewrittenAnswers,
        nextSteps: coachingSchema.shape.nextSteps,
      })
      .strict(),
  })
  .strict();

export const historySessionRowSchema = z
  .object({
    id: z.string().trim().min(1),
    candidateProfileId: z.string().trim().min(1),
    candidateName: z.string().trim().min(1),
    personaKey: personaKeySchema,
    personaName: z.string().trim().min(1),
    interviewType: interviewTypeSchema,
    difficulty: difficultySchema,
    interestLevel: interestLevelSchema,
    overallScore: z.number().min(0).max(100),
    band: scoreBandSchema,
    completedAt: z.number().int().nonnegative(),
    createdAt: z.number().int().nonnegative(),
    deltaFromPrevious: z.number().optional().nullable(),
    biggestImprovementArea: z.string().trim().optional().nullable(),
  })
  .strict();

export const historySummarySchema = z
  .object({
    sessions: z.array(historySessionRowSchema).default([]),
    summary: z
      .object({
        totalSessions: z.number().int().nonnegative(),
        averageScore: z.number().min(0).max(100).nullable(),
        bestScore: z.number().min(0).max(100).nullable(),
        biggestImprovementArea: z.string().trim().optional().nullable(),
      })
      .strict(),
  })
  .strict();

export const scoreDimensionScoresSchema = dimensionScoresSchema;
export const scoreBandValueSchema = scoreBandSchema;
