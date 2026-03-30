import Link from "next/link";
import { ArrowRight, CalendarClock } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export type HistorySession = {
  id: string;
  dateLabel: string;
  profileName: string;
  interviewType: string;
  personaName: string;
  difficulty: string;
  score: number;
  delta?: number | null;
  href: string;
};

export type SessionHistoryListProps = {
  sessions: HistorySession[];
  emptyLabel?: string;
};

function scoreColor(score: number) {
  if (score >= 80) return "text-emerald-400";
  if (score >= 65) return "text-primary";
  if (score >= 50) return "text-amber-400";
  return "text-red-400";
}

export function SessionHistoryList({
  sessions,
  emptyLabel = "No sessions yet.",
}: SessionHistoryListProps) {
  return (
    <div className="space-y-2">
      {sessions.length ? (
        sessions.map((session) => (
          <Card
            key={session.id}
            className="transition-all duration-200 hover:border-primary/20 hover:shadow-sm hover:shadow-primary/5"
          >
            <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-1.5">
                  <Badge variant="outline">{session.interviewType}</Badge>
                  <Badge variant="secondary">{session.personaName}</Badge>
                  <Badge>{session.difficulty}</Badge>
                </div>
                <div>
                  <h3 className="font-semibold">{session.profileName}</h3>
                  <p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                    <CalendarClock className="size-3.5" />
                    {session.dateLabel}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
                    Score
                  </p>
                  <p className={`text-2xl font-bold tabular-nums ${scoreColor(session.score)}`}>
                    {Math.round(session.score)}
                  </p>
                  {typeof session.delta === "number" ? (
                    <p
                      className={`text-xs font-medium ${
                        session.delta >= 0 ? "text-emerald-400" : "text-red-400"
                      }`}
                    >
                      {session.delta >= 0 ? "+" : ""}
                      {session.delta.toFixed(1)} vs prev
                    </p>
                  ) : null}
                </div>
                <Button asChild variant="ghost" size="sm">
                  <Link href={session.href}>
                    View
                    <ArrowRight className="ml-1 size-3.5 transition-transform group-hover:translate-x-0.5" />
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))
      ) : (
        <Card>
          <CardContent className="p-8 text-center text-sm text-muted-foreground">
            {emptyLabel}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
