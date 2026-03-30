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
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {items.map((item) => (
        <Card key={item.label}>
          <CardHeader className="space-y-3">
            <div className="flex items-start justify-between gap-4">
              <CardTitle className="text-lg">{item.label}</CardTitle>
              <span className="text-2xl font-semibold">{Math.round(item.score)}</span>
            </div>
            <Progress value={item.score} />
          </CardHeader>
          {item.description ? (
            <CardContent>
              <p className="text-sm leading-6 text-muted-foreground">{item.description}</p>
            </CardContent>
          ) : null}
        </Card>
      ))}
    </div>
  );
}
