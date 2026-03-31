"use client";

import { useState } from "react";
import { TrendingUp } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export type ScoreTrendPoint = {
  label: string;
  score: number;
};

export type ScoreTrendCardProps = {
  title?: string;
  points: ScoreTrendPoint[];
};

function barColor(score: number) {
  if (score >= 80) return "from-emerald-500 to-emerald-400";
  if (score >= 65) return "from-primary to-primary/70";
  if (score >= 50) return "from-amber-500 to-amber-400";
  return "from-red-500 to-red-400";
}

function bandLabel(score: number) {
  if (score >= 80) return "Strong";
  if (score >= 65) return "Solid";
  if (score >= 50) return "Developing";
  return "Needs work";
}

const Y_TICKS = [0, 25, 50, 75, 100];

export function ScoreTrendCard({ title = "Score trend", points }: ScoreTrendCardProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const hasData = points.length > 0;

  const latestDelta =
    points.length >= 2
      ? points[points.length - 1].score - points[points.length - 2].score
      : null;

  return (
    <Card className="flex flex-col">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="size-4 text-primary" />
            {title}
          </CardTitle>
          {latestDelta !== null && (
            <span
              className={`text-xs font-semibold ${
                latestDelta >= 0 ? "text-emerald-400" : "text-red-400"
              }`}
            >
              {latestDelta >= 0 ? "+" : ""}
              {latestDelta.toFixed(1)} latest
            </span>
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          {hasData
            ? `Last ${points.length} session${points.length > 1 ? "s" : ""}`
            : "Complete interviews to track your progress"}
        </p>
      </CardHeader>
      <CardContent className="flex min-h-0 flex-1 flex-col">
        {hasData ? (
          <div className="flex min-h-0 flex-1 gap-1">
            <div className="flex flex-col justify-between pb-8 pr-1.5">
              {[...Y_TICKS].reverse().map((tick) => (
                <span
                  key={tick}
                  className="text-[10px] tabular-nums leading-none text-muted-foreground/60"
                >
                  {tick}
                </span>
              ))}
            </div>

            <div className="relative min-h-0 flex-1">
              <div className="pointer-events-none absolute inset-x-0 bottom-8 top-0 flex flex-col justify-between">
                {[...Y_TICKS].reverse().map((tick) => (
                  <div
                    key={tick}
                    className="h-px w-full border-b border-dashed border-muted-foreground/10"
                  />
                ))}
              </div>

              <div className="relative flex h-full items-end gap-1.5 pb-8">
                {points.map((point, index) => {
                  const pct = Math.max(4, point.score);
                  const isHovered = hoveredIndex === index;
                  return (
                    <div
                      key={`${point.label}-${index}`}
                      className="group relative flex flex-1 flex-col items-center"
                      onMouseEnter={() => setHoveredIndex(index)}
                      onMouseLeave={() => setHoveredIndex(null)}
                    >
                      {isHovered && (
                        <div className="absolute -top-12 z-10 rounded-lg border border-border/50 bg-popover px-2.5 py-1.5 shadow-lg">
                          <p className="whitespace-nowrap text-xs font-bold tabular-nums">
                            {Math.round(point.score)} - {bandLabel(point.score)}
                          </p>
                          <p className="text-[10px] text-muted-foreground">{point.label}</p>
                        </div>
                      )}

                      <div className="flex w-full flex-1 items-end">
                        <div
                          className={`w-full rounded-t-md bg-gradient-to-t ${barColor(point.score)} transition-all duration-500 ease-out ${
                            isHovered ? "opacity-100 shadow-md shadow-primary/10" : "opacity-80"
                          }`}
                          style={{ height: `${pct}%` }}
                        />
                      </div>

                      <div className="mt-1.5 text-center">
                        <p className="text-[10px] font-semibold tabular-nums text-muted-foreground">
                          {Math.round(point.score)}
                        </p>
                        <p className="max-w-[56px] truncate text-[9px] text-muted-foreground/60">
                          {point.label}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-muted-foreground/20">
            <TrendingUp className="size-8 text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground">No scored sessions yet</p>
            <p className="text-xs text-muted-foreground/60">
              Bars will appear here as you complete interviews
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
