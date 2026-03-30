import Link from "next/link";
import { ArrowUpRight, BotMessageSquare, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { env } from "@/lib/env";

export function Header() {
  return (
    <header className="flex flex-col gap-4 border-b border-border px-6 py-4 lg:flex-row lg:items-center lg:justify-between lg:px-10">
      <div>
        <h1 className="text-lg font-semibold tracking-tight">
          Interview Loop
        </h1>
        <p className="text-sm text-muted-foreground">
          Sharp, local-first interview simulation
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 rounded-lg border border-border bg-secondary/60 px-3 py-1.5 text-xs font-medium text-muted-foreground">
          <ShieldCheck className="size-3.5 text-primary" />
          {env.GEMINI_API_KEY ? "Gemini ready" : "Gemini not configured"}
        </div>
        <Button asChild variant="ghost" size="sm">
          <Link href="/settings">
            Settings
            <ArrowUpRight className="ml-1 size-3.5" />
          </Link>
        </Button>
        <Button asChild size="sm">
          <Link href="/interviews/new">
            <BotMessageSquare className="mr-1 size-3.5" />
            Start interview
          </Link>
        </Button>
      </div>
    </header>
  );
}
