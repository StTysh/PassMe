import { NextResponse } from "next/server";
import { z } from "zod";
import { synthesizeSpeechStream, getElevenLabsApiKey } from "@/lib/elevenlabs/client";
import { ttsProvider } from "@/lib/env";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ttsRequestSchema = z.object({
  text: z.string().trim().min(1).max(5000),
  voiceId: z.string().trim().min(1),
});

export async function POST(request: Request) {
  try {
    if (ttsProvider !== "elevenlabs") {
      return NextResponse.json(
        { ok: false, error: "TTS_PROVIDER is set to browser — ElevenLabs API disabled" },
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
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (error) {
    console.error("[TTS API] Error:", error);
    const message = error instanceof Error ? error.message : "TTS generation failed";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
