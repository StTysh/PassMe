import { Database, Key, Mic, Search, Wand2, Info } from "lucide-react";

import { env } from "@/lib/env";
import { APP_VERSION } from "@/lib/constants";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ResetDemoButton } from "@/components/settings/reset-demo-button";
import { Separator } from "@/components/ui/separator";

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Environment configuration and demo tools.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="size-4 text-primary" />
              Environment
            </CardTitle>
            <CardDescription>Current runtime configuration</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-2 text-muted-foreground">
                <Database className="size-3.5" /> Database
              </span>
              <code className="max-w-[200px] truncate rounded bg-secondary px-2 py-0.5 font-mono text-xs">
                {env.DATABASE_PATH}
              </code>
            </div>
            <Separator />
            <div className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-2 text-muted-foreground">
                <Key className="size-3.5" /> Gemini API
              </span>
              <Badge variant={env.GEMINI_API_KEY ? "success" : "destructive"}>
                {env.GEMINI_API_KEY ? "Configured" : "Missing"}
              </Badge>
            </div>
            <Separator />
            <div className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-2 text-muted-foreground">
                <Mic className="size-3.5" /> Voice
              </span>
              <Badge variant={env.ENABLE_VOICE ? "success" : "outline"}>
                {String(env.ENABLE_VOICE)}
              </Badge>
            </div>
            <Separator />
            <div className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-2 text-muted-foreground">
                <Search className="size-3.5" /> Search page
              </span>
              <Badge variant={env.ENABLE_SEARCH_PAGE ? "success" : "outline"}>
                {String(env.ENABLE_SEARCH_PAGE)}
              </Badge>
            </div>
            <Separator />
            <div className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-2 text-muted-foreground">
                <Wand2 className="size-3.5" /> Demo mode
              </span>
              <Badge variant={env.ENABLE_DEMO_MODE ? "success" : "outline"}>
                {String(env.ENABLE_DEMO_MODE)}
              </Badge>
            </div>
            <Separator />
            <div className="flex items-center justify-between gap-2">
              <span className="text-muted-foreground">Version</span>
              <span className="font-mono text-xs">{APP_VERSION}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wand2 className="size-4 text-primary" />
              Demo tools
            </CardTitle>
            <CardDescription>
              Reset seed data to restore defaults
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm leading-relaxed text-muted-foreground">
              Re-seed demo data to restore the default candidate, job description, and sample
              completed session. This does not delete other profiles or sessions.
            </p>
            <ResetDemoButton />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
