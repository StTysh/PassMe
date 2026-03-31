"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { FileText, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { fetchJson } from "@/lib/fetcher";

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
  allowDelete?: boolean;
};

export function DocumentList({
  documents,
  emptyLabel = "No documents yet.",
  allowDelete = false,
}: DocumentListProps) {
  const router = useRouter();
  const [pendingDocumentId, setPendingDocumentId] = useState<string | null>(null);

  async function handleDelete(documentId: string, title: string) {
    const confirmed = window.confirm(`Delete "${title}"? This cannot be undone.`);
    if (!confirmed) {
      return;
    }

    try {
      setPendingDocumentId(documentId);
      await fetchJson(`/api/documents/${documentId}`, { method: "DELETE" });
      toast.success("Document deleted");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete document");
    } finally {
      setPendingDocumentId(null);
    }
  }

  return (
    <div className="space-y-2">
      {documents.length ? (
        documents.map((document) => (
          <div
            key={document.id}
            className="flex items-start gap-4 rounded-xl border border-border bg-secondary/20 p-4 transition-colors hover:bg-secondary/30"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-secondary">
              <FileText className="size-4 text-primary" />
            </div>
            <div className="min-w-0 flex-1 space-y-1">
              <div className="flex flex-wrap items-center gap-1.5">
                <h3 className="text-sm font-semibold">{document.title}</h3>
                <Badge variant="outline">{document.type}</Badge>
                {document.parsedStatus ? (
                  <Badge
                    variant={document.parsedStatus === "Parsed" ? "success" : "secondary"}
                  >
                    {document.parsedStatus}
                  </Badge>
                ) : null}
              </div>
              <p className="text-xs text-muted-foreground">
                {document.sourceFilename ?? "Pasted text"}
                {document.updatedLabel ? ` - ${document.updatedLabel}` : ""}
              </p>
            </div>
            {allowDelete ? (
              <Button
                type="button"
                size="icon"
                variant="ghost"
                disabled={pendingDocumentId === document.id}
                onClick={() => void handleDelete(document.id, document.title)}
                aria-label={`Delete ${document.title}`}
              >
                {pendingDocumentId === document.id ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Trash2 className="size-4" />
                )}
              </Button>
            ) : null}
          </div>
        ))
      ) : (
        <Card>
          <CardContent className="p-6 text-center text-sm text-muted-foreground">
            {emptyLabel}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
