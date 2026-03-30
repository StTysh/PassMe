import { AlertTriangle } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import type { ReviewNote } from "@/components/review/strengths-list";

export type Weakness = ReviewNote & {
  severity: "low" | "medium" | "high";
};

export type WeaknessesListProps = {
  items: Weakness[];
  emptyLabel?: string;
};

export function WeaknessesList({
  items,
  emptyLabel = "No weaknesses captured yet.",
}: WeaknessesListProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="size-5 text-amber-600" />
          Weaknesses
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {items.length ? (
          items.map((item) => (
            <article key={item.title} className="rounded-2xl border border-border bg-muted/25 p-4">
              <div className="flex items-start justify-between gap-3">
                <h3 className="font-semibold">{item.title}</h3>
                <Badge
                  variant={
                    item.severity === "high"
                      ? "destructive"
                      : item.severity === "medium"
                        ? "warning"
                        : "outline"
                  }
                >
                  {item.severity}
                </Badge>
              </div>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.body}</p>
            </article>
          ))
        ) : (
          <p className="text-sm leading-6 text-muted-foreground">{emptyLabel}</p>
        )}
      </CardContent>
    </Card>
  );
}
