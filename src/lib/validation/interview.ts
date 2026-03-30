import { z } from "zod";

import {
  difficultySchema,
  interviewTypeSchema,
  interestLevelSchema,
  interviewerResponseSchema,
  personaKeySchema,
  sessionModeSchema,
  sessionStatusSchema,
  speakerSchema,
} from "@/lib/types/domain";

export const interviewPlanRequestSchema = z
  .object({
    candidateProfileId: z.string().trim().min(1),
    jobDocumentId: z.string().trim().min(1),
    personaKey: personaKeySchema,
    interviewType: interviewTypeSchema,
    difficulty: difficultySchema,
    interestLevel: interestLevelSchema,
    durationMinutes: z.union([z.literal(5), z.literal(10), z.literal(15)]),
  })
  .strict();

export const interviewStartRequestSchema = z
  .object({
    sessionId: z.string().trim().min(1),
  })
  .strict();

export const startInterviewSchema = interviewStartRequestSchema;

export const nextTurnRequestSchema = z
  .object({
    candidateMessage: z.string().trim().min(1).max(10_000),
  })
  .strict();

export const nextTurnSchema = nextTurnRequestSchema;

export const finishInterviewRequestSchema = z
  .object({
    force: z.boolean().default(false),
  })
  .strict();

export const finishInterviewSchema = finishInterviewRequestSchema;

export const sessionModeValueSchema = sessionModeSchema;
export const sessionStatusValueSchema = sessionStatusSchema;
export const speakerValueSchema = speakerSchema;
export const nextTurnResponseSchema = interviewerResponseSchema;
