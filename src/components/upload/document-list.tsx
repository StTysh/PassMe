import { FileText, MoreHorizontal } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export type DocumentItem = {
  id: string;
  title: string;
  type: string;
  sourceFilename?: string;
  updatedLabel?: string;
  parsedStatus?: string;
};

export type DocumentListProps = {
  documents: DocumentItem[];
  emptyLabel?: string;
};

export function DocumentList({
  documents,
  emptyLabel = "No documents yet.",
}: DocumentListProps) {
  return (
    <div className="space-y-3">
      {documents.length ? (
        documents.map((document) => (
          <Card key={document.id}>
            <CardContent className="flex items-start gap-4 p-5">
              <div className="rounded-2xl bg-secondary p-3 text-primary">
                <FileText className="size-5" />
              </div>
              <div className="min-w-0 flex-1 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-semibold">{document.title}</h3>
                  <Badge variant="outline">{document.type}</Badge>
                  {document.parsedStatus ? (
                    <Badge variant="secondary">{document.parsedStatus}</Badge>
                  ) : null}
                </div>
                <p className="text-sm text-muted-foreground">
                  {document.sourceFilename ?? "Local document"}
                  {document.updatedLabel ? ` · ${document.updatedLabel}` : ""}
                </p>
              </div>
              <Button variant="ghost" size="sm" aria-label={`More actions for ${document.title}`}>
                <MoreHorizontal className="size-4" />
              </Button>
            </CardContent>
          </Card>
        ))
      ) : (
        <Card>
          <CardContent className="p-6 text-sm text-muted-foreground">{emptyLabel}</CardContent>
        </Card>
      )}
    </div>
  );
}
