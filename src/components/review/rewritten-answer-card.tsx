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
          <Sparkles className="size-5 text-primary" />
          {title}
        </CardTitle>
        <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
          Rewrites turn {originalTurnIndex + 1}
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-2xl border border-border bg-muted/20 p-4">
          <p className="text-sm leading-7 text-foreground">{improvedAnswer}</p>
        </div>
        <p className="text-sm leading-6 text-muted-foreground">{rationale}</p>
      </CardContent>
    </Card>
  );
}
