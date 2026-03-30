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

export function SessionHistoryList({
  sessions,
  emptyLabel = "No sessions yet.",
}: SessionHistoryListProps) {
  return (
    <div className="space-y-3">
      {sessions.length ? (
        sessions.map((session) => (
          <Card key={session.id}>
            <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline">{session.interviewType}</Badge>
                  <Badge variant="secondary">{session.personaName}</Badge>
                  <Badge>{session.difficulty}</Badge>
                </div>
                <div>
                  <h3 className="text-lg font-semibold">{session.profileName}</h3>
                  <p className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                    <CalendarClock className="size-4" />
                    {session.dateLabel}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                    Score
                  </p>
                  <p className="text-3xl font-semibold">{Math.round(session.score)}</p>
                  {typeof session.delta === "number" ? (
                    <p className="text-sm text-muted-foreground">
                      {session.delta >= 0 ? "+" : ""}
                      {session.delta.toFixed(1)} vs previous
                    </p>
                  ) : null}
                </div>
                <Button asChild variant="secondary">
                  <Link href={session.href}>
                    View
                    <ArrowRight className="size-4" />
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))
      ) : (
        <Card>
          <CardContent className="p-6 text-sm text-muted-foreground">{emptyLabel}</CardContent>
        </Card>
      )}
    </div>
  );
}
