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
            <p className="text-sm font-medium uppercase tracking-[0.18em] text-primary">
              {label}
            </p>
            <CardTitle className="mt-2 text-4xl">{Math.round(overallScore)}</CardTitle>
          </div>
          <Badge variant="secondary">{band}</Badge>
        </div>
        <Progress value={overallScore} />
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm leading-7 text-muted-foreground">{summary}</p>
        {context ? (
          <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
            {context}
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
