import Link from "next/link";
import { BotMessageSquare, Hash, Target, Trophy, ArrowUp, ArrowDown, Activity } from "lucide-react";

import { ScoreTrendCard } from "@/components/history/score-trend-card";
import { SessionHistoryList } from "@/components/history/session-history-list";
import { EmptyState } from "@/components/empty-state";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { historyService } from "@/lib/services/history";

export const dynamic = "force-dynamic";
const PAGE_SIZE = 20;

function sessionHref(session: {
  id: string;
  status: string;
  score?: { overallScore: number } | null;
}) {
  return session.status === "completed" && session.score
    ? `/interviews/${session.id}/review`
    : `/interviews/${session.id}`;
}

export default async function HistoryPage({
  searchParams,
}: {
  searchParams?: Promise<{ page?: string }>;
}) {
  const history = historyService.getHistorySummary();
  const hasSessions = history.sessions.length > 0;
  const pageParam = searchParams ? Number((await searchParams).page ?? "1") : 1;
  const totalPages = Math.max(1, Math.ceil(history.sessions.length / PAGE_SIZE));
  const currentPage = Number.isFinite(pageParam) ? Math.min(Math.max(1, pageParam), totalPages) : 1;
  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const visibleSessions = history.sessions.slice(startIndex, startIndex + PAGE_SIZE);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">History</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Track past sessions, review deltas, and show progress over time.
          </p>
        </div>
        {hasSessions && (
          <Button asChild>
            <Link href="/interviews/new">
              <BotMessageSquare className="mr-1.5 size-4" />
              New interview
            </Link>
          </Button>
        )}
      </div>

      {hasSessions ? (
        <>
          <div className="grid gap-4 lg:grid-cols-2">
            <ScoreTrendCard
              points={history.sessions
                .slice(0, 6)
                .reverse()
                .map((session) => ({
                  label: new Date(session.createdAt).toLocaleDateString(),
                  score: session.score?.overallScore ?? 0,
                }))}
            />
            <Card>
              <CardContent className="space-y-5 p-6">
                <p className="text-xs font-semibold uppercase tracking-widest text-primary">
                  Performance overview
                </p>

                {/* Key stats grid */}
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-xl bg-secondary/30 p-4">
                    <div className="flex items-center gap-2">
                      <Target className="size-4 text-primary" />
                      <p className="text-xs text-muted-foreground">Average score</p>
                    </div>
                    <p className="mt-1.5 text-3xl font-bold tabular-nums">
                      {history.summary.averageScore ?? "-"}
                    </p>
                    {history.summary.latestBand && (
                      <Badge variant="outline" className="mt-1.5 text-[10px]">
                        {history.summary.latestBand}
                      </Badge>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-xl bg-secondary/30 p-3">
                      <div className="flex items-center gap-1.5">
                        <Hash className="size-3.5 text-primary" />
                        <p className="text-[10px] text-muted-foreground">Sessions</p>
                      </div>
                      <p className="mt-1 text-xl font-bold tabular-nums">
                        {history.summary.completedSessions}
                      </p>
                    </div>
                    <div className="rounded-xl bg-secondary/30 p-3">
                      <div className="flex items-center gap-1.5">
                        <Trophy className="size-3.5 text-amber-400" />
                        <p className="text-[10px] text-muted-foreground">Best</p>
                      </div>
                      <p className="mt-1 text-xl font-bold tabular-nums text-amber-400">
                        {history.summary.bestScore ?? "-"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Strongest / Weakest */}
                {(history.summary.strongestDimension || history.summary.weakestDimension) && (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {history.summary.strongestDimension && (
                      <div className="flex items-center gap-3 rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-3 py-2.5">
                        <ArrowUp className="size-4 shrink-0 text-emerald-400" />
                        <div className="min-w-0">
                          <p className="text-[10px] uppercase tracking-wider text-emerald-400/80">
                            Strongest
                          </p>
                          <p className="truncate text-sm font-semibold capitalize">
                            {history.summary.strongestDimension.name}
                          </p>
                        </div>
                        <span className="ml-auto text-sm font-bold tabular-nums text-emerald-400">
                          {history.summary.strongestDimension.avg}
                        </span>
                      </div>
                    )}
                    {history.summary.weakestDimension && (
                      <div className="flex items-center gap-3 rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-2.5">
                        <ArrowDown className="size-4 shrink-0 text-amber-400" />
                        <div className="min-w-0">
                          <p className="text-[10px] uppercase tracking-wider text-amber-400/80">
                            Focus area
                          </p>
                          <p className="truncate text-sm font-semibold capitalize">
                            {history.summary.weakestDimension.name}
                          </p>
                        </div>
                        <span className="ml-auto text-sm font-bold tabular-nums text-amber-400">
                          {history.summary.weakestDimension.avg}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* Dimension breakdown */}
                {history.summary.dimensionAverages.length > 0 && (
                  <div className="space-y-2.5">
                    <div className="flex items-center gap-2">
                      <Activity className="size-3.5 text-muted-foreground" />
                      <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                        Dimension breakdown
                      </p>
                    </div>
                    <div className="space-y-2">
                      {history.summary.dimensionAverages.map((d) => (
                        <div key={d.dimension} className="flex items-center gap-3">
                          <span className="w-20 truncate text-xs capitalize text-muted-foreground">
                            {d.dimension === "roleFit" ? "Role fit" : d.dimension}
                          </span>
                          <Progress value={d.avg} className="h-1.5 flex-1" />
                          <span className="w-8 text-right text-xs font-semibold tabular-nums">
                            {d.avg}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <SessionHistoryList
            sessions={visibleSessions.map((session) => ({
              id: session.id,
              dateLabel: new Date(session.createdAt).toLocaleString(),
              profileName: session.profileName,
              interviewType: session.interviewType,
              personaName: session.personaName,
              difficulty: session.difficulty,
              score: session.score?.overallScore ?? 0,
              delta: historyService.compareAgainstPrevious(session.id)?.deltaOverall ?? null,
              href: sessionHref(session),
            }))}
          />
          {totalPages > 1 && (
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm text-muted-foreground">
                Page {currentPage} of {totalPages}
              </p>
              <div className="flex gap-2">
                <Button asChild variant="outline" size="sm">
                  <Link
                    href={currentPage <= 1 ? "/history" : `/history?page=${currentPage - 1}`}
                    aria-disabled={currentPage <= 1}
                    tabIndex={currentPage <= 1 ? -1 : 0}
                  >
                    Previous
                  </Link>
                </Button>
                <Button asChild variant="outline" size="sm">
                  <Link
                    href={currentPage >= totalPages ? `/history?page=${currentPage}` : `/history?page=${currentPage + 1}`}
                    aria-disabled={currentPage >= totalPages}
                    tabIndex={currentPage >= totalPages ? -1 : 0}
                  >
                    Next
                  </Link>
                </Button>
              </div>
            </div>
          )}
        </>
      ) : (
        <EmptyState
          eyebrow="No history yet"
          title="Complete your first mock interview to see results here."
          description="Set up a candidate profile, upload your resume and job description, then run an interview. Your scores and progress will appear on this page."
          actionLabel="Start an interview"
          actionHref="/interviews/new"
        />
      )}
    </div>
  );
}
