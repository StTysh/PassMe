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
    <div className="rounded-[1.5rem] border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive">
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 size-4" />
        <div>
          <p className="font-semibold">{title}</p>
          <p className="mt-1 leading-6 text-destructive/80">{message}</p>
          {onRetry ? (
            <div className="mt-4">
              <Button variant="outline" onClick={onRetry}>
                Try again
              </Button>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
