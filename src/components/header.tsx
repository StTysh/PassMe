import Link from "next/link";
import { ArrowUpRight, BotMessageSquare, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { env } from "@/lib/env";

export function Header() {
  return (
    <header className="flex flex-col gap-4 border-b border-border/80 px-5 py-5 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
      <div className="space-y-1">
        <p className="text-sm font-medium uppercase tracking-[0.18em] text-primary">
          Interview Loop
        </p>
        <h1 className="text-2xl font-semibold tracking-tight">
          Sharp, local-first interview simulation.
        </h1>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 rounded-full border border-border bg-muted/40 px-3 py-2 text-xs font-medium text-muted-foreground">
          <ShieldCheck className="size-3.5 text-primary" />
          {env.GEMINI_API_KEY ? "Gemini configured" : "Gemini not configured yet"}
        </div>
        <Button asChild variant="secondary">
          <Link href="/settings">
            Settings
            <ArrowUpRight className="size-4" />
          </Link>
        </Button>
        <Button asChild>
          <Link href="/interviews/new">
            <BotMessageSquare className="size-4" />
            Start interview
          </Link>
        </Button>
      </div>
    </header>
  );
}
