import { z } from "zod";
import { DEFAULT_DB_PATH, FEATURE_FLAGS } from "@/lib/constants";

const booleanLike = z.preprocess((value) => {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();

    if (["1", "true", "yes", "on"].includes(normalized)) {
      return true;
    }

    if (["0", "false", "no", "off"].includes(normalized)) {
      return false;
    }
  }

  return value;
}, z.boolean());

const aiProvider = z.enum(["gemini", "openai"]);

const envSchema = z.object({
  GEMINI_API_KEY: z.string().optional(),
  OPENAI_API_KEY: z.string().optional(),
  ELEVENLABS_API_KEY: z.string().optional(),
  DATABASE_PATH: z.string().min(1).default(DEFAULT_DB_PATH),
  ENABLE_VOICE: booleanLike.default(FEATURE_FLAGS.ENABLE_VOICE),
  ENABLE_SEARCH_PAGE: booleanLike.default(FEATURE_FLAGS.ENABLE_SEARCH_PAGE),
  ENABLE_DEMO_MODE: booleanLike.default(FEATURE_FLAGS.ENABLE_DEMO_MODE),
  TTS_PROVIDER: z.enum(["elevenlabs", "browser"]).default("elevenlabs"),

  GEMINI_MODEL: z.string().min(1).default("gemini-2.5-flash"),
  GEMINI_LITE_MODEL: z.string().min(1).default("gemini-2.5-flash-lite"),
  OPENAI_MODEL: z.string().min(1).default("gpt-4o-mini"),
  OPENAI_SMART_MODEL: z.string().min(1).default("gpt-4o"),

  AI_PROVIDER: aiProvider.default("gemini"),
  AI_PROVIDER_RESUME: aiProvider.optional(),
  AI_PROVIDER_JOB: aiProvider.optional(),
  AI_PROVIDER_VALIDATE: aiProvider.optional(),
  AI_PROVIDER_COMPANY: aiProvider.optional(),
  AI_PROVIDER_RESEARCH: aiProvider.optional(),
  AI_PROVIDER_PANEL: aiProvider.optional(),
  AI_PROVIDER_PLAN: aiProvider.optional(),
  AI_PROVIDER_INTERVIEW: aiProvider.optional(),
  AI_PROVIDER_EVALUATE: aiProvider.optional(),
  AI_PROVIDER_COACH: aiProvider.optional(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error(
    "[env] Invalid environment configuration. Falling back to defaults for invalid values:",
    parsed.error.issues.map((issue) => ({
      path: issue.path.join("."),
      message: issue.message,
    })),
  );
}

export const env = parsed.success
  ? parsed.data
  : {
      GEMINI_API_KEY: process.env.GEMINI_API_KEY,
      OPENAI_API_KEY: process.env.OPENAI_API_KEY,
      ELEVENLABS_API_KEY: process.env.ELEVENLABS_API_KEY,
      DATABASE_PATH: DEFAULT_DB_PATH,
      ENABLE_VOICE: FEATURE_FLAGS.ENABLE_VOICE,
      ENABLE_SEARCH_PAGE: FEATURE_FLAGS.ENABLE_SEARCH_PAGE,
      ENABLE_DEMO_MODE: FEATURE_FLAGS.ENABLE_DEMO_MODE,
      TTS_PROVIDER: "elevenlabs" as const,
      GEMINI_MODEL: "gemini-2.5-flash",
      GEMINI_LITE_MODEL: "gemini-2.5-flash-lite",
      OPENAI_MODEL: "gpt-4o-mini",
      OPENAI_SMART_MODEL: "gpt-4o",
      AI_PROVIDER: "gemini" as const,
      AI_PROVIDER_RESUME: undefined,
      AI_PROVIDER_JOB: undefined,
      AI_PROVIDER_VALIDATE: undefined,
      AI_PROVIDER_COMPANY: undefined,
      AI_PROVIDER_RESEARCH: undefined,
      AI_PROVIDER_PANEL: undefined,
      AI_PROVIDER_PLAN: undefined,
      AI_PROVIDER_INTERVIEW: undefined,
      AI_PROVIDER_EVALUATE: undefined,
      AI_PROVIDER_COACH: undefined,
    };

export type AIProvider = "gemini" | "openai";

export const hasGeminiApiKey = Boolean(env.GEMINI_API_KEY?.trim());
export const hasOpenAIApiKey = Boolean(env.OPENAI_API_KEY?.trim());
export const hasElevenLabsApiKey = Boolean(env.ELEVENLABS_API_KEY?.trim());
export const isDemoModeEnabled = env.ENABLE_DEMO_MODE;
export const isVoiceEnabled = env.ENABLE_VOICE;
export const isSearchPageEnabled = env.ENABLE_SEARCH_PAGE;
export const ttsProvider = env.TTS_PROVIDER;
export const useElevenLabsTts = ttsProvider === "elevenlabs" && hasElevenLabsApiKey;

const TASK_PROVIDER_MAP: Record<string, AIProvider | undefined> = {
  parseResume: env.AI_PROVIDER_RESUME,
  analyzeJob: env.AI_PROVIDER_JOB,
  validateResume: env.AI_PROVIDER_VALIDATE,
  resolveCompany: env.AI_PROVIDER_COMPANY,
  companyResearch: env.AI_PROVIDER_RESEARCH,
  generatePanel: env.AI_PROVIDER_PANEL,
  enrichPanel: env.AI_PROVIDER_PANEL,
  buildInterviewPlan: env.AI_PROVIDER_PLAN,
  liveInterviewer: env.AI_PROVIDER_INTERVIEW,
  evaluateSession: env.AI_PROVIDER_EVALUATE,
  coachSession: env.AI_PROVIDER_COACH,
};

export function getProviderForTask(taskName: string): AIProvider {
  return TASK_PROVIDER_MAP[taskName] ?? env.AI_PROVIDER;
}
