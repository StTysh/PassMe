import Link from "next/link";
import { ArrowRight, Sparkles, Zap, Target, TrendingUp } from "lucide-react";

import { SessionHistoryList } from "@/components/history/session-history-list";
import { Button } from "@/components/ui/button";
import { historyService } from "@/lib/services/history";

export const dynamic = "force-dynamic";

export default function HomePage() {
  const history = historyService.getHistorySummary();

  return (
    <div className="space-y-8">
      <section className="relative overflow-hidden rounded-xl border border-border bg-card">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/5" />
        <div className="relative grid gap-8 p-8 lg:grid-cols-[1.3fr_0.7fr] lg:p-10">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 rounded-md bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary">
              <Sparkles className="size-3.5" />
              Interview Loop
            </div>
            <h1 className="max-w-2xl text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
              Practice the interview you&apos;re actually going to have.
            </h1>
            <p className="max-w-xl text-base leading-relaxed text-muted-foreground">
              Upload your resume, paste the job description, choose an interviewer persona, and get role-specific AI coaching.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link href="/profiles/new">
                  Create profile
                  <ArrowRight className="ml-1 size-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/interviews/new">Try demo</Link>
              </Button>
            </div>
          </div>

          <div className="space-y-3">
            <div className="rounded-lg border border-border bg-secondary/40 p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/15">
                  <Zap className="size-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-semibold">AI-powered simulations</p>
                  <p className="text-xs text-muted-foreground">Realistic role-aware interviews</p>
                </div>
              </div>
            </div>
            <div className="rounded-lg border border-border bg-secondary/40 p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/15">
                  <Target className="size-4 text-accent" />
                </div>
                <div>
                  <p className="text-sm font-semibold">Targeted feedback</p>
                  <p className="text-xs text-muted-foreground">Strengths, gaps, and rewrites</p>
                </div>
              </div>
            </div>
            <div className="rounded-lg border border-border bg-secondary/40 p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/15">
                  <TrendingUp className="size-4 text-emerald-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold">Track progress</p>
                  <p className="text-xs text-muted-foreground">Scores and trends over time</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Recent sessions</h2>
          <Button asChild variant="ghost" size="sm">
            <Link href="/history">View all</Link>
          </Button>
        </div>
        <SessionHistoryList
          sessions={history.sessions.slice(0, 5).map((session) => ({
            id: session.id,
            dateLabel: new Date(session.createdAt).toLocaleString(),
            profileName: session.profileName,
            interviewType: session.interviewType,
            personaName: session.personaName,
            difficulty: session.difficulty,
            score: session.score?.overallScore ?? 0,
            href: `/interviews/${session.id}/review`,
          }))}
        />
      </section>
    </div>
  );
}
