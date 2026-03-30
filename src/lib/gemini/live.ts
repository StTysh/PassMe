import { env } from "@/lib/env";

export function isVoiceModeAvailable(): boolean {
  return Boolean(env.ENABLE_VOICE);
}

export const VOICE_CONFIG = {
  silenceTimeoutMs: 2000,
  lang: "en-US",
  ttsRate: 1.05,
  ttsPitch: 1.0,
} as const;
