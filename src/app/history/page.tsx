import { ScoreTrendCard } from "@/components/history/score-trend-card";
import { SessionHistoryList } from "@/components/history/session-history-list";
import { historyService } from "@/lib/services/history";

export const dynamic = "force-dynamic";

export default function HistoryPage() {
  const history = historyService.getHistorySummary();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">History</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Track past sessions, review deltas, and show progress over time.
        </p>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <ScoreTrendCard
          points={history.sessions.slice(0, 6).reverse().map((session) => ({
            label: new Date(session.createdAt).toLocaleDateString(),
            score: session.score?.overallScore ?? 0,
          }))}
        />
        <div className="rounded-xl border border-border bg-card p-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary">Summary</p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-sm text-muted-foreground">Average score</p>
              <p className="text-3xl font-bold tabular-nums">{history.summary.averageScore ?? "—"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Completed sessions</p>
              <p className="text-3xl font-bold tabular-nums">{history.summary.completedSessions}</p>
            </div>
          </div>
        </div>
      </div>

      <SessionHistoryList
        sessions={history.sessions.map((session) => ({
          id: session.id,
          dateLabel: new Date(session.createdAt).toLocaleString(),
          profileName: session.profileName,
          interviewType: session.interviewType,
          personaName: session.personaName,
          difficulty: session.difficulty,
          score: session.score?.overallScore ?? 0,
          delta: historyService.compareAgainstPrevious(session.id)?.deltaOverall ?? null,
          href: `/interviews/${session.id}/review`,
        }))}
      />
    </div>
  );
}
