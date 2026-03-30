import { env } from "@/lib/env";
import { APP_VERSION } from "@/lib/constants";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ResetDemoButton } from "@/components/settings/reset-demo-button";

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Environment configuration and demo tools.
        </p>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Environment</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Database path</span>
              <code className="rounded bg-secondary px-2 py-0.5 font-mono text-xs">{env.DATABASE_PATH}</code>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Gemini API</span>
              <Badge variant={env.GEMINI_API_KEY ? "success" : "destructive"}>
                {env.GEMINI_API_KEY ? "Configured" : "Missing"}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Voice</span>
              <Badge variant={env.ENABLE_VOICE ? "success" : "outline"}>
                {String(env.ENABLE_VOICE)}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Search page</span>
              <Badge variant={env.ENABLE_SEARCH_PAGE ? "success" : "outline"}>
                {String(env.ENABLE_SEARCH_PAGE)}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Demo mode</span>
              <Badge variant={env.ENABLE_DEMO_MODE ? "success" : "outline"}>
                {String(env.ENABLE_DEMO_MODE)}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Version</span>
              <span className="font-mono text-xs">{APP_VERSION}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Demo tools</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm leading-relaxed text-muted-foreground">
              Re-seed demo data to restore the default candidate, job description, and sample completed session.
            </p>
            <ResetDemoButton />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
