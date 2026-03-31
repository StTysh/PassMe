import { env } from "@/lib/env";

const ELEVENLABS_API_BASE = "https://api.elevenlabs.io/v1";

export type ElevenLabsVoiceConfig = {
  voiceId: string;
  name: string;
  gender: "male" | "female";
};

const VOICE_POOL: ElevenLabsVoiceConfig[] = [
  { voiceId: "pNInz6obpgDQGcFmaJgB", name: "Adam", gender: "male" },
  { voiceId: "nPczCjzI2devNBz1zQrb", name: "Brian", gender: "male" },
  { voiceId: "ErXwobaYiN019PkySvjV", name: "Antoni", gender: "male" },
  { voiceId: "IKne3meq5aSn9XLyUdCD", name: "Charlie", gender: "male" },
  { voiceId: "Xb7hH8MSUJpSbSDYk0k2", name: "Alice", gender: "female" },
  { voiceId: "XB0fDUnXU5powFXDhCwa", name: "Charlotte", gender: "female" },
  { voiceId: "pqHfZKP75CvOlQylNhV4", name: "Bill", gender: "male" },
];

export function getElevenLabsApiKey(): string | undefined {
  return env.ELEVENLABS_API_KEY?.trim() || undefined;
}

export function assignVoiceToInterviewer(
  gender: "male" | "female",
  indexWithinGender: number,
): ElevenLabsVoiceConfig {
  const genderPool = VOICE_POOL.filter((v) => v.gender === gender);
  if (genderPool.length === 0) {
    return VOICE_POOL[0];
  }
  return genderPool[indexWithinGender % genderPool.length];
}

const TTS_BODY_BASE = {
  model_id: "eleven_flash_v2_5",
  voice_settings: {
    stability: 0.5,
    similarity_boost: 0.75,
    style: 0.0,
    use_speaker_boost: true,
  },
};

export async function synthesizeSpeech(
  text: string,
  voiceId: string,
): Promise<Buffer> {
  const apiKey = getElevenLabsApiKey();
  if (!apiKey) throw new Error("ELEVENLABS_API_KEY is not configured.");

  const response = await fetch(
    `${ELEVENLABS_API_BASE}/text-to-speech/${voiceId}`,
    {
      method: "POST",
      headers: { "xi-api-key": apiKey, "Content-Type": "application/json", Accept: "audio/mpeg" },
      body: JSON.stringify({ text, ...TTS_BODY_BASE }),
    },
  );

  if (!response.ok) {
    const errorText = await response.text().catch(() => "Unknown error");
    throw new Error(`ElevenLabs API error ${response.status}: ${errorText}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

export async function synthesizeSpeechStream(
  text: string,
  voiceId: string,
): Promise<ReadableStream<Uint8Array>> {
  const apiKey = getElevenLabsApiKey();
  if (!apiKey) throw new Error("ELEVENLABS_API_KEY is not configured.");

  const response = await fetch(
    `${ELEVENLABS_API_BASE}/text-to-speech/${voiceId}/stream`,
    {
      method: "POST",
      headers: { "xi-api-key": apiKey, "Content-Type": "application/json", Accept: "audio/mpeg" },
      body: JSON.stringify({ text, ...TTS_BODY_BASE }),
    },
  );

  if (!response.ok) {
    const errorText = await response.text().catch(() => "Unknown error");
    throw new Error(`ElevenLabs streaming API error ${response.status}: ${errorText}`);
  }

  if (!response.body) throw new Error("No response body from ElevenLabs stream.");
  return response.body as ReadableStream<Uint8Array>;
}
