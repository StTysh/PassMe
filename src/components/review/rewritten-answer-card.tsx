import { Sparkles } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export type RewrittenAnswerCardProps = {
  originalTurnIndex: number;
  title: string;
  improvedAnswer: string;
  rationale: string;
};

export function RewrittenAnswerCard({
  originalTurnIndex,
  title,
  improvedAnswer,
  rationale,
}: RewrittenAnswerCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="size-4 text-primary" />
          {title}
        </CardTitle>
        <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
          Rewrites turn {originalTurnIndex + 1}
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="rounded-lg border border-border bg-secondary/40 p-4">
          <p className="text-sm leading-relaxed">{improvedAnswer}</p>
        </div>
        <p className="text-sm leading-relaxed text-muted-foreground">{rationale}</p>
      </CardContent>
    </Card>
  );
}
