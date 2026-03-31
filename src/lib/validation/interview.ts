import { z } from "zod";

import {
  difficultySchema,
  interviewTypeSchema,
  interviewerResponseSchema,
  sessionModeSchema,
  sessionStatusSchema,
  speakerSchema,
} from "@/lib/types/domain";

export const interviewPlanRequestSchema = z
  .object({
    candidateProfileId: z.string().trim().min(1),
    jobDocumentId: z.string().trim().min(1),
    companyName: z.string().trim().min(1),
    panelSize: z.union([z.literal(1), z.literal(2), z.literal(3)]),
    interviewType: interviewTypeSchema,
    difficulty: difficultySchema,
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
