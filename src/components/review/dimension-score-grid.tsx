import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

export type DimensionScore = {
  label: string;
  score: number;
  description?: string;
};

export type DimensionScoreGridProps = {
  items: DimensionScore[];
};

export function DimensionScoreGrid({ items }: DimensionScoreGridProps) {
  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
      {items.map((item) => (
        <Card key={item.label}>
          <CardHeader className="space-y-3 pb-3">
            <div className="flex items-start justify-between gap-4">
              <CardTitle className="text-sm">{item.label}</CardTitle>
              <span className="text-xl font-bold tabular-nums">{Math.round(item.score)}</span>
            </div>
            <Progress value={item.score} />
          </CardHeader>
          {item.description ? (
            <CardContent>
              <p className="text-xs leading-relaxed text-muted-foreground">{item.description}</p>
            </CardContent>
          ) : null}
        </Card>
      ))}
    </div>
  );
}
