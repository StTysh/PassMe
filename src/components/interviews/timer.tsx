import { Clock3 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

export type TimerProps = {
  label?: string;
  elapsedLabel: string;
  remainingLabel: string;
  progress: number;
};

export function Timer({
  label = "Time",
  elapsedLabel,
  remainingLabel,
  progress,
}: TimerProps) {
  return (
    <Card>
      <CardContent className="space-y-3 p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Clock3 className="size-4 text-primary" />
            {label}
          </div>
          <Badge variant="secondary">{remainingLabel}</Badge>
        </div>
        <Progress value={progress} />
        <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
          Elapsed {elapsedLabel}
        </p>
      </CardContent>
    </Card>
  );
}
