import { NextResponse } from "next/server";
import { z } from "zod";

import { handleRouteError } from "@/lib/api";
import { getElevenLabsApiKey, synthesizeSpeechStream } from "@/lib/elevenlabs/client";
import { ttsProvider } from "@/lib/env";
import { assertRateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ttsRequestSchema = z.object({
  text: z.string().trim().min(1).max(5000),
  voiceId: z.string().trim().min(1),
});

export async function POST(request: Request) {
  try {
    assertRateLimit(request, "tts:stream", 30, 60_000);

    if (ttsProvider !== "elevenlabs") {
      return NextResponse.json(
        { ok: false, error: "TTS_PROVIDER is set to browser - ElevenLabs API disabled" },
        { status: 501 },
      );
    }

    if (!getElevenLabsApiKey()) {
      return NextResponse.json(
        { ok: false, error: "ElevenLabs API key not configured" },
        { status: 501 },
      );
    }

    const body = ttsRequestSchema.parse(await request.json());
    const stream = await synthesizeSpeechStream(body.text, body.voiceId);

    return new NextResponse(stream, {
      status: 200,
      headers: {
        "Content-Type": "audio/mpeg",
        "Transfer-Encoding": "chunked",
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
