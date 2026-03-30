import { CheckCircle2 } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export type ReviewNote = {
  title: string;
  body: string;
  sourceLabel?: string;
};

export type StrengthsListProps = {
  items: ReviewNote[];
  emptyLabel?: string;
};

export function StrengthsList({
  items,
  emptyLabel = "No strengths captured yet.",
}: StrengthsListProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckCircle2 className="size-4 text-emerald-400" />
          Strengths
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.length ? (
          items.map((item) => (
            <article key={item.title} className="rounded-lg border border-border bg-secondary/40 p-4">
              <h3 className="text-sm font-semibold">{item.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{item.body}</p>
              {item.sourceLabel ? (
                <p className="mt-2 text-[10px] uppercase tracking-widest text-muted-foreground">
                  {item.sourceLabel}
                </p>
              ) : null}
            </article>
          ))
        ) : (
          <p className="text-sm text-muted-foreground">{emptyLabel}</p>
        )}
      </CardContent>
    </Card>
  );
}
