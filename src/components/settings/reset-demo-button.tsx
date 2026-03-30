"use client";

import { useState } from "react";
import { Loader2, RotateCcw, Check, X } from "lucide-react";

import { Button } from "@/components/ui/button";

export function ResetDemoButton() {
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");

  async function handleReset() {
    setStatus("loading");
    try {
      const res = await fetch("/api/settings/reset-demo", { method: "POST" });
      if (!res.ok) throw new Error("Reset failed");
      setStatus("done");
      window.location.reload();
    } catch {
      setStatus("error");
      setTimeout(() => setStatus("idle"), 3000);
    }
  }

  return (
    <div className="flex items-center gap-3">
      <Button onClick={handleReset} disabled={status === "loading"} variant="outline">
        {status === "loading" ? (
          <>
            <Loader2 className="mr-1.5 size-4 animate-spin" />
            Resetting...
          </>
        ) : (
          <>
            <RotateCcw className="mr-1.5 size-4" />
            Reset demo data
          </>
        )}
      </Button>
      {status === "done" && (
        <span className="flex items-center gap-1 text-sm text-emerald-400">
          <Check className="size-3.5" /> Done
        </span>
      )}
      {status === "error" && (
        <span className="flex items-center gap-1 text-sm text-red-400">
          <X className="size-3.5" /> Failed
        </span>
      )}
    </div>
  );
}
