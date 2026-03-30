import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export type SessionSummaryItem = {
  label: string;
  value: string;
  hint?: string;
};

export type SessionSummaryProps = {
  title?: string;
  statusLabel?: string;
  items: SessionSummaryItem[];
};

export function SessionSummary({
  title = "Session summary",
  statusLabel,
  items,
}: SessionSummaryProps) {
  return (
    <Card>
      <CardHeader className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <CardTitle>{title}</CardTitle>
          {statusLabel ? <Badge variant="secondary">{statusLabel}</Badge> : null}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.map((item) => (
          <div key={item.label} className="rounded-2xl border border-border bg-muted/25 p-4">
            <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
              {item.label}
            </p>
            <p className="mt-2 text-sm font-semibold">{item.value}</p>
            {item.hint ? <p className="mt-1 text-sm text-muted-foreground">{item.hint}</p> : null}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
