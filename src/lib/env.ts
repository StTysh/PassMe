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

const envSchema = z.object({
  GEMINI_API_KEY: z.string().optional(),
  DATABASE_PATH: z.string().min(1).default(DEFAULT_DB_PATH),
  ENABLE_VOICE: booleanLike.default(FEATURE_FLAGS.ENABLE_VOICE),
  ENABLE_SEARCH_PAGE: booleanLike.default(FEATURE_FLAGS.ENABLE_SEARCH_PAGE),
  ENABLE_DEMO_MODE: booleanLike.default(FEATURE_FLAGS.ENABLE_DEMO_MODE),
});

const parsed = envSchema.safeParse(process.env);

export const env = parsed.success
  ? parsed.data
  : {
      GEMINI_API_KEY: process.env.GEMINI_API_KEY,
      DATABASE_PATH: DEFAULT_DB_PATH,
      ENABLE_VOICE: FEATURE_FLAGS.ENABLE_VOICE,
      ENABLE_SEARCH_PAGE: FEATURE_FLAGS.ENABLE_SEARCH_PAGE,
      ENABLE_DEMO_MODE: FEATURE_FLAGS.ENABLE_DEMO_MODE,
    };

export const hasGeminiApiKey = Boolean(env.GEMINI_API_KEY?.trim());
export const isDemoModeEnabled = env.ENABLE_DEMO_MODE;
export const isVoiceEnabled = env.ENABLE_VOICE;
export const isSearchPageEnabled = env.ENABLE_SEARCH_PAGE;
