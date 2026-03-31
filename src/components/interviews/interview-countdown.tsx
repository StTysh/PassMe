"use client";

import { useEffect, useState } from "react";
import type { PanelInterviewer } from "@/lib/types/domain";

function getInitials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function InterviewCountdown({
  panel,
  companyName,
  onComplete,
}: {
  panel: PanelInterviewer[];
  companyName?: string;
  onComplete: () => void;
}) {
  const [count, setCount] = useState(3);
  const [phase, setPhase] = useState<"counting" | "go">("counting");

  useEffect(() => {
    if (phase === "go") {
      const t = setTimeout(onComplete, 600);
      return () => clearTimeout(t);
    }

    if (count <= 0) {
      setPhase("go");
      return;
    }

    const t = setTimeout(() => setCount((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [count, phase, onComplete]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-lg">
      <div className="flex flex-col items-center gap-8">
        {/* Panel preview */}
        {panel.length > 0 && (
          <div className="flex flex-col items-center gap-3">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Your interview panel{companyName ? ` at ${companyName}` : ""}
            </p>
            <div className="flex items-center gap-4">
              {panel.map((interviewer) => (
                <div key={interviewer.key} className="flex flex-col items-center gap-2">
                  <div
                    className="flex h-14 w-14 items-center justify-center rounded-full text-lg font-bold text-white shadow-lg"
                    style={{ backgroundColor: interviewer.avatarColor }}
                  >
                    {getInitials(interviewer.name)}
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-semibold">{interviewer.name}</p>
                    <p className="text-[10px] text-muted-foreground">{interviewer.role}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Countdown circle */}
        <div className="relative flex h-40 w-40 items-center justify-center">
          <svg className="absolute inset-0 h-full w-full -rotate-90" viewBox="0 0 160 160">
            <circle
              cx="80"
              cy="80"
              r="72"
              fill="none"
              stroke="currentColor"
              className="text-muted-foreground/10"
              strokeWidth="4"
            />
            <circle
              cx="80"
              cy="80"
              r="72"
              fill="none"
              stroke="currentColor"
              className="text-primary transition-all duration-1000 ease-linear"
              strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray={2 * Math.PI * 72}
              strokeDashoffset={2 * Math.PI * 72 * (count / 3)}
            />
          </svg>

          {phase === "counting" ? (
            <span
              key={count}
              className="animate-in zoom-in-50 fade-in text-6xl font-bold tabular-nums text-primary duration-300"
            >
              {count}
            </span>
          ) : (
            <span className="animate-in zoom-in-50 fade-in text-4xl font-bold text-emerald-400 duration-300">
              GO
            </span>
          )}
        </div>

        <p className="text-sm text-muted-foreground">
          {phase === "counting"
            ? "Preparing your interview..."
            : "Starting now"}
        </p>
      </div>
    </div>
  );
}
