import { env } from "@/lib/env";

export const VOICE_FEATURE_FLAG = "ENABLE_VOICE" as const;

export function isVoiceModeEnabled() {
  return env.ENABLE_VOICE;
}

export function getVoiceModePlaceholderNotice() {
  return "Voice mode is reserved for v2 and remains disabled in the text-first build.";
}
