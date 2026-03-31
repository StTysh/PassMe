import { z } from "zod";

export {
  coachingSchema,
  difficultySchema,
  documentTypeSchema,
  evaluationSchema,
  interviewPlanSchema,
  interviewTypeSchema,
  interestLevelSchema,
  jobAnalysisSchema,
  personaConfigSchema,
  personaKeySchema,
  resumeProfileSchema,
  sessionModeSchema,
  sessionStatusSchema,
  speakerSchema,
} from "@/lib/types/domain";

export const interviewerResponseSchema = z.object({
  agentMessage: z.string().min(1),
  interviewerKey: z.string().min(1).default("interviewer_1"),
  questionCategory: z.string().min(1).optional(),
  shouldEnd: z.preprocess((v) => (typeof v === "boolean" ? v : false), z.boolean()).default(false),
  handoffNote: z.string().min(1).optional(),
});

export const apiErrorSchema = z
  .object({
    ok: z.literal(false),
    error: z
      .object({
        code: z.string().min(1),
        message: z.string().min(1),
        details: z.unknown().optional(),
      })
      .strict(),
  })
  .strict();

export const apiOkSchema = z
  .object({
    ok: z.literal(true),
  })
  .passthrough();

export function createApiEnvelopeSchema<TSchema extends z.ZodTypeAny>(
  payloadSchema: TSchema,
) {
  return z
    .object({
      ok: z.literal(true),
    })
    .and(payloadSchema);
}

export const historyFilterSchema = z
  .object({
    profileId: z.string().optional(),
    interviewType: z
      .enum([
        "recruiter_screen",
        "hiring_manager",
        "behavioral",
        "technical_general",
        "system_design_light",
      ])
      .optional(),
    personaKey: z
      .enum([
        "warm_recruiter",
        "skeptical_manager",
        "neutral_manager",
        "detail_oriented_interviewer",
      ])
      .optional(),
  })
  .strict();

export const searchQuerySchema = z
  .object({
    q: z.string().trim().min(1),
    profileId: z.string().optional(),
    scope: z.enum(["documents", "transcripts", "all"]).default("all"),
  })
  .strict();
