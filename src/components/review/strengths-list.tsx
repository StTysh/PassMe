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
          <CheckCircle2 className="size-5 text-emerald-600" />
          Strengths
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {items.length ? (
          items.map((item) => (
            <article key={item.title} className="rounded-2xl border border-border bg-muted/25 p-4">
              <h3 className="font-semibold">{item.title}</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.body}</p>
              {item.sourceLabel ? (
                <p className="mt-3 text-xs uppercase tracking-[0.16em] text-muted-foreground">
                  {item.sourceLabel}
                </p>
              ) : null}
            </article>
          ))
        ) : (
          <p className="text-sm leading-6 text-muted-foreground">{emptyLabel}</p>
        )}
      </CardContent>
    </Card>
  );
}
