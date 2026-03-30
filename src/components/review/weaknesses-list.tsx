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
          <AlertTriangle className="size-4 text-amber-400" />
          Weaknesses
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.length ? (
          items.map((item) => (
            <article key={item.title} className="rounded-lg border border-border bg-secondary/40 p-4">
              <div className="flex items-start justify-between gap-3">
                <h3 className="text-sm font-semibold">{item.title}</h3>
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
