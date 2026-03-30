import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

export type ScoreCardProps = {
  overallScore: number;
  band: string;
  summary: string;
  label?: string;
  context?: string;
};

export function ScoreCard({
  overallScore,
  band,
  summary,
  label = "Overall score",
  context,
}: ScoreCardProps) {
  return (
    <Card>
      <CardHeader className="space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-primary">
              {label}
            </p>
            <CardTitle className="mt-2 text-4xl font-bold tabular-nums">
              {Math.round(overallScore)}
            </CardTitle>
          </div>
          <Badge variant="secondary">{band}</Badge>
        </div>
        <Progress value={overallScore} />
      </CardHeader>
      <CardContent className="space-y-2">
        <p className="text-sm leading-relaxed text-muted-foreground">{summary}</p>
        {context ? (
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
            {context}
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
