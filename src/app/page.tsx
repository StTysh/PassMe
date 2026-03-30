import Link from "next/link";
import { ArrowRight, Sparkles, Zap, Target, TrendingUp, BotMessageSquare, Wand2 } from "lucide-react";

import { SessionHistoryList } from "@/components/history/session-history-list";
import { Button } from "@/components/ui/button";
import { historyService } from "@/lib/services/history";
import { profilesService } from "@/lib/services/profiles";
import { isDemoModeEnabled } from "@/lib/env";

export const dynamic = "force-dynamic";

export default function HomePage() {
  const history = historyService.getHistorySummary();
  const profiles = profilesService.listProfiles();
  const hasProfiles = profiles.length > 0;

  return (
    <div className="space-y-8">
      <section className="relative overflow-hidden rounded-2xl border border-border bg-card/60 backdrop-blur-sm">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/5" />
        <div className="absolute -right-20 -top-20 h-60 w-60 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute -bottom-20 -left-20 h-60 w-60 rounded-full bg-accent/5 blur-3xl" />

        <div className="relative grid gap-8 p-6 sm:p-8 lg:grid-cols-[1.3fr_0.7fr] lg:p-10">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-primary">
              <Sparkles className="size-3.5" />
              Interview Loop
            </div>
            <h1 className="max-w-2xl text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
              Practice the interview you&apos;re{" "}
              <span className="gradient-text animate-gradient">actually going to have.</span>
            </h1>
            <p className="max-w-xl text-base leading-relaxed text-muted-foreground">
              Upload your resume, paste the job description, choose an interviewer persona, and get
              role-specific AI coaching with voice support.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button asChild size="lg" variant="glow">
                <Link href="/profiles/new">
                  Create profile
                  <ArrowRight className="ml-1 size-4 transition-transform group-hover:translate-x-0.5" />
                </Link>
              </Button>
              {hasProfiles ? (
                <Button asChild size="lg" variant="outline">
                  <Link href="/interviews/new">
                    <BotMessageSquare className="mr-1.5 size-4" />
                    Start interview
                  </Link>
                </Button>
              ) : isDemoModeEnabled ? (
                <DemoButton />
              ) : (
                <Button asChild size="lg" variant="outline">
                  <Link href="/interviews/new">
                    <BotMessageSquare className="mr-1.5 size-4" />
                    See what you need
                  </Link>
                </Button>
              )}
            </div>
          </div>

          <div className="space-y-3">
            <FeatureCard
              icon={Zap}
              title="AI-powered simulations"
              desc="Realistic role-aware interviews"
              colorClass="text-primary bg-primary/10"
            />
            <FeatureCard
              icon={Target}
              title="Targeted feedback"
              desc="Strengths, gaps, and rewrites"
              colorClass="text-accent bg-accent/10"
            />
            <FeatureCard
              icon={TrendingUp}
              title="Track progress"
              desc="Scores and trends over time"
              colorClass="text-emerald-400 bg-emerald-500/10"
            />
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Recent sessions</h2>
          {history.sessions.length > 0 && (
            <Button asChild variant="ghost" size="sm">
              <Link href="/history">
                View all
                <ArrowRight className="ml-1 size-3.5" />
              </Link>
            </Button>
          )}
        </div>
        {history.sessions.length > 0 ? (
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
        ) : (
          <div className="rounded-xl border border-dashed border-border bg-card/40 p-6 text-center text-sm text-muted-foreground">
            No sessions yet. Create a profile and run your first mock interview to see results here.
          </div>
        )}
      </section>
    </div>
  );
}

function FeatureCard({
  icon: Icon,
  title,
  desc,
  colorClass,
}: {
  icon: typeof Zap;
  title: string;
  desc: string;
  colorClass: string;
}) {
  const [iconColor, bgColor] = colorClass.split(" ");
  return (
    <div className="group/card rounded-xl border border-border bg-secondary/30 p-4 transition-all duration-200 hover:border-primary/20 hover:bg-secondary/50">
      <div className="flex items-center gap-3">
        <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${bgColor}`}>
          <Icon className={`size-4 ${iconColor}`} />
        </div>
        <div>
          <p className="text-sm font-semibold">{title}</p>
          <p className="text-xs text-muted-foreground">{desc}</p>
        </div>
      </div>
    </div>
  );
}

function DemoButton() {
  return (
    <form
      action={async () => {
        "use server";
        const { ensureDemoData } = await import("@/lib/services/demo");
        ensureDemoData();
      }}
    >
      <Button type="submit" size="lg" variant="outline">
        <Wand2 className="mr-1.5 size-4" />
        Load demo data
      </Button>
    </form>
  );
}
