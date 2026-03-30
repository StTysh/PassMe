import { BotMessageSquare, UserRound } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export type TranscriptTurn = {
  id: string;
  speaker: "agent" | "candidate" | "system";
  text: string;
  timestampLabel?: string;
  category?: string;
};

export type TranscriptPanelProps = {
  turns: TranscriptTurn[];
  emptyLabel?: string;
};

export function TranscriptPanel({
  turns,
  emptyLabel = "The transcript will appear here once the interview starts.",
}: TranscriptPanelProps) {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="border-b border-border/60">
        <CardTitle>Transcript</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 p-4 sm:p-6">
        {turns.length ? (
          turns.map((turn) => {
            const isAgent = turn.speaker === "agent";
            const isSystem = turn.speaker === "system";

            return (
              <article
                key={turn.id}
                className={`flex gap-3 ${isAgent ? "justify-start" : "justify-end"}`}
              >
                {isAgent ? (
                  <div className="mt-1 rounded-2xl bg-secondary p-2 text-primary">
                    <BotMessageSquare className="size-4" />
                  </div>
                ) : null}
                <div
                  className={`max-w-[84%] rounded-[1.5rem] border px-4 py-3 text-sm leading-6 ${
                    isAgent
                      ? "border-border bg-muted/30 text-foreground"
                      : isSystem
                        ? "border-dashed border-border bg-card text-muted-foreground"
                        : "border-primary/15 bg-primary text-primary-foreground"
                  }`}
                >
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <Badge variant={isAgent ? "outline" : isSystem ? "secondary" : "default"}>
                      {turn.speaker}
                    </Badge>
                    {turn.category ? <Badge variant="secondary">{turn.category}</Badge> : null}
                    {turn.timestampLabel ? (
                      <span className="text-xs uppercase tracking-[0.16em] opacity-80">
                        {turn.timestampLabel}
                      </span>
                    ) : null}
                  </div>
                  <p>{turn.text}</p>
                </div>
                {!isAgent ? (
                  <div className="mt-1 rounded-2xl bg-secondary p-2 text-primary">
                    <UserRound className="size-4" />
                  </div>
                ) : null}
              </article>
            );
          })
        ) : (
          <p className="rounded-[1.5rem] border border-dashed border-border bg-muted/25 p-6 text-sm leading-6 text-muted-foreground">
            {emptyLabel}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
