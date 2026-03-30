import { Trophy } from "lucide-react";

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

function bandVariant(band: string) {
  const lower = band.toLowerCase();
  if (lower === "strong") return "success" as const;
  if (lower === "promising") return "default" as const;
  if (lower === "developing") return "warning" as const;
  return "destructive" as const;
}

export function ScoreCard({
  overallScore,
  band,
  summary,
  label = "Overall score",
  context,
}: ScoreCardProps) {
  return (
    <Card className="overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent pointer-events-none" />
      <CardHeader className="relative space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-primary">
              <Trophy className="size-3.5" />
              {label}
            </p>
            <CardTitle className="mt-2 text-5xl font-bold tabular-nums tracking-tight">
              {Math.round(overallScore)}
            </CardTitle>
          </div>
          <Badge variant={bandVariant(band)} className="text-sm px-3 py-1">
            {band}
          </Badge>
        </div>
        <Progress value={overallScore} className="h-3" />
      </CardHeader>
      <CardContent className="relative space-y-2">
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
