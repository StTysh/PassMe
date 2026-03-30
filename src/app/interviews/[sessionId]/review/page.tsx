import Link from "next/link";
import { notFound } from "next/navigation";
import { AlertTriangle, RotateCcw } from "lucide-react";

import { DimensionScoreGrid } from "@/components/review/dimension-score-grid";
import { MissedPointsList } from "@/components/review/missed-points-list";
import { NextStepsList } from "@/components/review/next-steps-list";
import { RewrittenAnswerCard } from "@/components/review/rewritten-answer-card";
import { ScoreCard } from "@/components/review/score-card";
import { StrengthsList } from "@/components/review/strengths-list";
import { WeaknessesList } from "@/components/review/weaknesses-list";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { interviewsRepo } from "@/lib/repositories/interviewsRepo";
import { personasRepo } from "@/lib/repositories/personasRepo";
import { scoresRepo } from "@/lib/repositories/scoresRepo";
import { ensureDatabaseReady } from "@/lib/services/bootstrap";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

export default async function ReviewPage({
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

  const score = scoresRepo.getScoreForSession(sessionId);
  const persona = personasRepo.listPersonas().find((p) => p.id === session.personaId);

  if (!score) {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <Card className="overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500" />
          <CardContent className="p-6 sm:p-8">
            <div className="flex flex-col items-center text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-amber-500/10">
                <AlertTriangle className="size-7 text-amber-400" />
              </div>
              <h1 className="mt-4 text-2xl font-bold tracking-tight">
                No review available
              </h1>
              <p className="mt-2 max-w-md text-sm text-muted-foreground">
                This session was ended before enough conversation happened to
                generate a meaningful review. Try running a full interview with a
                few back-and-forth exchanges.
              </p>

              <div className="mt-4 flex flex-wrap justify-center gap-2">
                <Badge variant="outline">{session.interviewType}</Badge>
                <Badge variant="secondary">{persona?.name ?? "Persona"}</Badge>
                <Badge variant="outline">{session.durationMinutes} min</Badge>
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
                <Button asChild>
                  <Link href={`/interviews/new?profileId=${session.candidateProfileId}`}>
                    <RotateCcw className="mr-1.5 size-4" />
                    Try again
                  </Link>
                </Button>
                <Button asChild variant="outline">
                  <Link href="/history">Back to history</Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const feedback = scoresRepo.listFeedbackItems(sessionId);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Interview review</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Score breakdown, targeted feedback, and concrete next steps.
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href="/history">All sessions</Link>
          </Button>
          <Button asChild>
            <Link href={`/interviews/new?profileId=${session.candidateProfileId}`}>
              Retry interview
            </Link>
          </Button>
        </div>
      </div>

      <ScoreCard
        overallScore={score.overallScore}
        band={score.band}
        summary={score.summary}
      />

      <DimensionScoreGrid
        items={[
          { label: "Clarity", score: score.clarityScore },
          { label: "Relevance", score: score.relevanceScore },
          { label: "Evidence", score: score.evidenceScore },
          { label: "Structure", score: score.structureScore },
          { label: "Role fit", score: score.roleFitScore },
          { label: "Confidence", score: score.confidenceScore },
        ]}
      />

      <div className="grid gap-6 xl:grid-cols-2">
        <StrengthsList
          items={feedback
            .filter((item) => item.category === "strength")
            .map((item) => ({ title: item.title, body: item.body }))}
        />
        <WeaknessesList
          items={feedback
            .filter((item) => item.category === "weakness")
            .map((item) => ({
              title: item.title,
              body: item.body,
              severity: (item.severity as "low" | "medium" | "high") ?? "medium",
            }))}
        />
      </div>

      <MissedPointsList
        items={feedback
          .filter((item) => item.category === "missed_point")
          .map((item) => ({ title: item.title, body: item.body }))}
      />

      <div className="grid gap-4">
        {feedback
          .filter((item) => item.category === "rewritten_answer")
          .map((item) => (
            <RewrittenAnswerCard
              key={item.id}
              originalTurnIndex={0}
              title={item.title}
              improvedAnswer={item.body}
              rationale="Stored coaching output."
            />
          ))}
      </div>

      <NextStepsList
        items={feedback
          .filter((item) => item.category === "next_step")
          .map((item) => ({ title: item.title, body: item.body }))}
      />
    </div>
  );
}
