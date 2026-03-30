import Link from "next/link";
import { notFound } from "next/navigation";

import { InterviewChatClient } from "@/components/interviews/interview-chat-client";
import { Button } from "@/components/ui/button";
import { interviewsRepo } from "@/lib/repositories/interviewsRepo";
import { personasRepo } from "@/lib/repositories/personasRepo";
import { transcriptRepo } from "@/lib/repositories/transcriptRepo";
import { ensureDatabaseReady } from "@/lib/services/bootstrap";
import { isVoiceEnabled } from "@/lib/env";

export const dynamic = "force-dynamic";

export default async function InterviewSessionPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  ensureDatabaseReady();
  const { sessionId } = await params;
  const session = interviewsRepo.getSessionById(sessionId);
  if (!session) {
    notFound();
  }

  const persona = personasRepo.listPersonas().find((item) => item.id === session.personaId);
  const turns = transcriptRepo.listTurnsForSession(sessionId);

  if (session.status === "completed") {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold tracking-tight">Interview complete</h1>
        <p className="text-sm text-muted-foreground">
          This session is already complete. Open the review to see scores and coaching.
        </p>
        <Button asChild>
          <Link href={`/interviews/${sessionId}/review`}>View review</Link>
        </Button>
      </div>
    );
  }

  return (
    <InterviewChatClient
      sessionId={sessionId}
      sessionMeta={{
        personaName: persona?.name ?? "Persona",
        interviewType: session.interviewType,
        status: session.status,
        durationMinutes: session.durationMinutes,
      }}
      initialTurns={turns.map((turn) => ({
        ...turn,
        speaker: turn.speaker as "agent" | "candidate" | "system",
      }))}
      voiceEnabled={isVoiceEnabled}
    />
  );
}
