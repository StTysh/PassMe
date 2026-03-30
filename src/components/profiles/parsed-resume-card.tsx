import { FileText } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function ParsedResumeCard({
  parsed,
}: {
  parsed: Record<string, unknown> | null;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="size-4 text-primary" />
          Parsed resume highlights
        </CardTitle>
      </CardHeader>
      <CardContent>
        {parsed ? (
          <pre className="overflow-x-auto rounded-xl border border-border bg-secondary/30 p-4 text-xs leading-relaxed text-muted-foreground">
            {JSON.stringify(parsed, null, 2)}
          </pre>
        ) : (
          <div className="rounded-xl border border-dashed border-border bg-secondary/10 p-6 text-center">
            <FileText className="mx-auto size-8 text-muted-foreground/30" />
            <p className="mt-2 text-sm text-muted-foreground">
              Upload and parse a resume to see structured highlights here.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
