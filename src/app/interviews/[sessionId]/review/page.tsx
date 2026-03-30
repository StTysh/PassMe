import Link from "next/link";
import { notFound } from "next/navigation";

import { DimensionScoreGrid } from "@/components/review/dimension-score-grid";
import { MissedPointsList } from "@/components/review/missed-points-list";
import { NextStepsList } from "@/components/review/next-steps-list";
import { RewrittenAnswerCard } from "@/components/review/rewritten-answer-card";
import { ScoreCard } from "@/components/review/score-card";
import { StrengthsList } from "@/components/review/strengths-list";
import { WeaknessesList } from "@/components/review/weaknesses-list";
import { Button } from "@/components/ui/button";
import { interviewsRepo } from "@/lib/repositories/interviewsRepo";
import { scoresRepo } from "@/lib/repositories/scoresRepo";
import { ensureDatabaseReady } from "@/lib/services/bootstrap";

export const dynamic = "force-dynamic";

export default async function ReviewPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  ensureDatabaseReady();
  const { sessionId } = await params;
  const session = interviewsRepo.getSessionById(sessionId);
  const score = scoresRepo.getScoreForSession(sessionId);

  if (!session || !score) {
    notFound();
  }

  const feedback = scoresRepo.listFeedbackItems(sessionId);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Interview review</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Score breakdown, targeted feedback, and concrete next steps.
          </p>
        </div>
        <Button asChild>
          <Link href="/interviews/new">Retry this interview</Link>
        </Button>
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

      <div className="grid gap-6">
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
