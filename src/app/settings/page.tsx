import { env } from "@/lib/env";
import { APP_VERSION } from "@/lib/constants";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ResetDemoButton } from "@/components/settings/reset-demo-button";

export default function SettingsPage() {
  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
      <Card>
        <CardHeader>
          <CardTitle>Environment</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <p>Database path: <span className="font-mono">{env.DATABASE_PATH}</span></p>
          <p>Gemini API: {env.GEMINI_API_KEY ? "Configured" : "Missing"}</p>
          <p>Voice enabled: {String(env.ENABLE_VOICE)}</p>
          <p>Search enabled: {String(env.ENABLE_SEARCH_PAGE)}</p>
          <p>Demo mode: {String(env.ENABLE_DEMO_MODE)}</p>
          <p>App version: {APP_VERSION}</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Demo tools</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-muted-foreground">
          <p>Re-seed demo data to restore the default candidate, job description, and sample completed session.</p>
          <ResetDemoButton />
        </CardContent>
      </Card>
    </div>
  );
}
