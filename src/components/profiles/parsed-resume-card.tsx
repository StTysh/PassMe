import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function ParsedResumeCard({
  parsed,
}: {
  parsed: Record<string, unknown> | null;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Parsed resume highlights</CardTitle>
      </CardHeader>
      <CardContent>
        {parsed ? (
          <pre className="overflow-x-auto rounded-2xl bg-muted/40 p-4 text-xs">
            {JSON.stringify(parsed, null, 2)}
          </pre>
        ) : (
          <p className="text-sm text-muted-foreground">
            Upload and parse a resume to see structured highlights here.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
