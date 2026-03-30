import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";

import { SessionHistoryList } from "@/components/history/session-history-list";
import { Button } from "@/components/ui/button";
import { historyService } from "@/lib/services/history";

export const dynamic = "force-dynamic";

export default function HomePage() {
  const history = historyService.getHistorySummary();

  return (
    <div className="space-y-8">
      <section className="overflow-hidden rounded-[2rem] border border-border/80 bg-card shadow-[0_30px_80px_-50px_rgba(16,38,56,0.55)]">
        <div className="grid gap-8 px-8 py-10 lg:grid-cols-[1.2fr_0.8fr] lg:px-10 lg:py-12">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-medium uppercase tracking-[0.2em] text-primary">
              <Sparkles className="size-3.5" />
              Interview Loop
            </div>
            <div className="space-y-4">
              <h1 className="max-w-3xl text-4xl font-semibold tracking-tight sm:text-5xl">
                Practice the interview you&apos;re actually going to have.
              </h1>
              <p className="max-w-2xl text-lg leading-8 text-muted-foreground">
                Upload your resume, paste the job description, choose an interviewer persona, and get role-specific feedback.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg">
                <Link href="/profiles/new">
                  Create profile
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="secondary">
                <Link href="/interviews/new">Try demo</Link>
              </Button>
            </div>
          </div>

          <div className="rounded-[1.75rem] border border-border/70 bg-muted/60 p-6">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">
              Demo-ready loop
            </p>
            <div className="mt-4 space-y-3 text-sm text-muted-foreground">
              <p>1. Create or use the seeded Alex Morgan profile.</p>
              <p>2. Upload a real resume or use seeded materials.</p>
              <p>3. Generate a plan, run a text interview, and review coaching.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold">Recent sessions</h2>
          <Button asChild variant="outline">
            <Link href="/history">Open history</Link>
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
