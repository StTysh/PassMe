import { ArrowRightCircle } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export type NextStep = {
  title: string;
  body: string;
};

export type NextStepsListProps = {
  items: NextStep[];
  emptyLabel?: string;
};

export function NextStepsList({
  items,
  emptyLabel = "No next steps captured yet.",
}: NextStepsListProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ArrowRightCircle className="size-4 text-primary" />
          Next steps
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.length ? (
          items.map((item, i) => (
            <article
              key={item.title}
              className="flex gap-3 rounded-xl border border-border bg-secondary/20 p-4 transition-colors hover:border-primary/15"
            >
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                {i + 1}
              </span>
              <div>
                <h3 className="text-sm font-semibold">{item.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{item.body}</p>
              </div>
            </article>
          ))
        ) : (
          <p className="text-sm text-muted-foreground">{emptyLabel}</p>
        )}
      </CardContent>
    </Card>
  );
}
