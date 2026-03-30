import { AlertTriangle } from "lucide-react";

import { Button } from "@/components/ui/button";

export function ErrorAlert({
  title,
  message,
  onRetry,
}: {
  title: string;
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-5 text-sm backdrop-blur-sm">
      <div className="flex items-start gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-destructive/10">
          <AlertTriangle className="size-4 text-red-400" />
        </div>
        <div>
          <p className="font-semibold text-red-400">{title}</p>
          <p className="mt-1 leading-relaxed text-red-400/80">{message}</p>
          {onRetry ? (
            <div className="mt-3">
              <Button variant="outline" size="sm" onClick={onRetry}>
                Try again
              </Button>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
