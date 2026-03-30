import { ListChecks } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export type MissedPoint = {
  title: string;
  body: string;
};

export type MissedPointsListProps = {
  items: MissedPoint[];
  emptyLabel?: string;
};

export function MissedPointsList({
  items,
  emptyLabel = "No missed points captured yet.",
}: MissedPointsListProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ListChecks className="size-4 text-primary" />
          Missed points
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.length ? (
          items.map((item) => (
            <article key={item.title} className="rounded-lg border border-border bg-secondary/40 p-4">
              <h3 className="text-sm font-semibold">{item.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{item.body}</p>
            </article>
          ))
        ) : (
          <p className="text-sm text-muted-foreground">{emptyLabel}</p>
        )}
      </CardContent>
    </Card>
  );
}
