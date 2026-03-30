"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export function ResetDemoButton() {
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");

  async function handleReset() {
    setStatus("loading");
    try {
      const res = await fetch("/api/settings/reset-demo", { method: "POST" });
      if (!res.ok) throw new Error("Reset failed");
      setStatus("done");
    } catch {
      setStatus("error");
    }
  }

  return (
    <div className="flex items-center gap-3">
      <Button onClick={handleReset} disabled={status === "loading"} variant="outline">
        {status === "loading" ? "Resetting..." : "Reset demo data"}
      </Button>
      {status === "done" && <span className="text-sm text-emerald-400">Done</span>}
      {status === "error" && <span className="text-sm text-red-400">Failed</span>}
    </div>
  );
}
