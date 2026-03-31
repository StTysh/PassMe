import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, CheckCircle2, RotateCcw, XCircle } from "lucide-react";

import { InterviewChatClient } from "@/components/interviews/interview-chat-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { interviewsRepo } from "@/lib/repositories/interviewsRepo";
import { personasRepo } from "@/lib/repositories/personasRepo";
import { transcriptRepo } from "@/lib/repositories/transcriptRepo";
import { scoresRepo } from "@/lib/repositories/scoresRepo";
import { ensureDatabaseReady } from "@/lib/services/bootstrap";
import { isVoiceEnabled, useElevenLabsTts } from "@/lib/env";
import type { PanelInterviewer } from "@/lib/types/domain";

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
  const panel = (session.panelJson ?? []) as PanelInterviewer[];
  const companyName = session.companyName ?? undefined;

  if (session.status === "cancelled") {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <Card className="overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-muted-foreground/40 via-muted-foreground/20 to-muted-foreground/40" />
          <CardContent className="p-6 sm:p-8">
            <div className="flex flex-col items-center text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
                <XCircle className="size-7 text-muted-foreground" />
              </div>
              <h1 className="mt-4 text-2xl font-bold tracking-tight">Interview cancelled</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                This session with {panel.length > 1 ? `${panel.length} interviewers` : persona?.name ?? "the interviewer"}
                {companyName ? ` at ${companyName}` : ""} was cancelled.
              </p>

              <div className="mt-4 flex flex-wrap justify-center gap-2">
                <Badge variant="outline">{session.interviewType}</Badge>
                {companyName && <Badge variant="secondary">{companyName}</Badge>}
                {turns.length > 0 && <Badge variant="outline">{turns.length} turns</Badge>}
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
                <Button asChild variant="glow">
                  <Link href="/interviews/new">
                    <RotateCcw className="mr-1.5 size-4" />
                    Start a new interview
                  </Link>
                </Button>
                <Button asChild variant="outline">
                  <Link href="/history">
                    View history
                  </Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (session.status === "completed") {
    const score = scoresRepo.getScoreForSession(sessionId);

    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <Card className="overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-emerald-500 via-primary to-emerald-500" />
          <CardContent className="p-6 sm:p-8">
            <div className="flex flex-col items-center text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10">
                <CheckCircle2 className="size-7 text-emerald-400" />
              </div>
              <h1 className="mt-4 text-2xl font-bold tracking-tight">Interview complete</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Your session with {panel.length > 1 ? `${panel.length} interviewers` : persona?.name ?? "the interviewer"}
                {companyName ? ` at ${companyName}` : ""} is finished.
              </p>

              <div className="mt-4 flex flex-wrap justify-center gap-2">
                <Badge variant="outline">{session.interviewType}</Badge>
                {companyName && <Badge variant="secondary">{companyName}</Badge>}
                <Badge variant="outline">{session.durationMinutes} min</Badge>
                <Badge variant="outline">{turns.length} turns</Badge>
              </div>

              {score && (
                <div className="mt-6 rounded-xl border border-border bg-secondary/30 px-8 py-4">
                  <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                    Overall score
                  </p>
                  <p className="mt-1 text-4xl font-bold tabular-nums text-primary">
                    {Math.round(score.overallScore)}
                  </p>
                  <Badge
                    variant={score.overallScore >= 65 ? "success" : "warning"}
                    className="mt-2"
                  >
                    {score.band}
                  </Badge>
                </div>
              )}

              <div className="mt-6 flex flex-wrap gap-3">
                <Button asChild variant="glow">
                  <Link href={`/interviews/${sessionId}/review`}>
                    View full review
                    <ArrowRight className="ml-1.5 size-4" />
                  </Link>
                </Button>
                <Button asChild variant="outline">
                  <Link href="/interviews/new">
                    <RotateCcw className="mr-1.5 size-4" />
                    New interview
                  </Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <InterviewChatClient
      sessionId={sessionId}
      sessionMeta={{
        personaName: panel[0]?.name ?? persona?.name ?? "Persona",
        interviewType: session.interviewType,
        status: session.status,
        durationMinutes: session.durationMinutes,
      }}
      initialTurns={turns.map((turn) => ({
        ...turn,
        speaker: turn.speaker as "agent" | "candidate" | "system",
      }))}
      voiceEnabled={isVoiceEnabled}
      useElevenLabs={useElevenLabsTts}
      panel={panel}
      companyName={companyName}
    />
  );
}
