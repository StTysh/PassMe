import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export type ScoreTrendPoint = {
  label: string;
  score: number;
};

export type ScoreTrendCardProps = {
  title?: string;
  points: ScoreTrendPoint[];
};

export function ScoreTrendCard({ title = "Score trend", points }: ScoreTrendCardProps) {
  const maxScore = Math.max(...points.map((point) => point.score), 100);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex h-36 items-end gap-2">
          {points.map((point) => (
            <div key={point.label} className="flex flex-1 flex-col items-center gap-2">
              <div
                className="w-full rounded-t-2xl bg-primary/85"
                style={{ height: `${Math.max(12, (point.score / maxScore) * 100)}%` }}
                title={`${point.label}: ${point.score}`}
              />
              <div className="text-center">
                <p className="text-xs font-medium text-foreground">{Math.round(point.score)}</p>
                <p className="text-[11px] text-muted-foreground">{point.label}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
