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
          <ArrowRightCircle className="size-5 text-primary" />
          Next steps
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.length ? (
          items.map((item) => (
            <article key={item.title} className="rounded-2xl border border-border bg-muted/25 p-4">
              <h3 className="font-semibold">{item.title}</h3>
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
