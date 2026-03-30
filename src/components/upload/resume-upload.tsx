import { ArrowUpToLine, FileText } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export type ResumeUploadProps = {
  title?: string;
  description?: string;
  acceptedTypes?: string;
  fileName?: string;
  hint?: string;
  actionLabel?: string;
};

export function ResumeUpload({
  title = "Upload resume",
  description = "Drop a PDF here or choose a file from your machine.",
  acceptedTypes = "PDF only",
  fileName,
  hint = "We will extract text locally before later parsing steps.",
  actionLabel = "Choose file",
}: ResumeUploadProps) {
  return (
    <Card className="border-dashed">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ArrowUpToLine className="size-5 text-primary" />
          {title}
        </CardTitle>
        <p className="text-sm leading-6 text-muted-foreground">{description}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-[1.5rem] border border-dashed border-border bg-muted/30 p-6 text-center">
          <FileText className="mx-auto size-8 text-primary" />
          <p className="mt-3 text-sm font-medium">{acceptedTypes}</p>
          <p className="mt-2 text-sm text-muted-foreground">{hint}</p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Button variant="secondary">{actionLabel}</Button>
          {fileName ? (
            <p className="text-sm text-muted-foreground">
              Selected file: <span className="font-medium text-foreground">{fileName}</span>
            </p>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
