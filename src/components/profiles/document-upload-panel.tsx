"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { DOCUMENT_TYPES } from "@/lib/constants";
import { fetchJson } from "@/lib/fetcher";

export function DocumentUploadPanel({ profileId }: { profileId: string }) {
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [type, setType] = useState<"resume" | "job_description" | "cover_letter" | "application_answer" | "company_context">("resume");
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [pending, setPending] = useState(false);

  async function handleSubmit() {
    try {
      setPending(true);
      const formData = new FormData();
      formData.set("candidateProfileId", profileId);
      formData.set("type", type);
      formData.set("title", title);
      formData.set("text", text);
      const file = fileRef.current?.files?.[0];
      if (file) {
        formData.set("file", file);
      }

      const result = await fetchJson<{ documentId: string }>("/api/documents/upload", {
        method: "POST",
        body: formData,
      });

      if (type === "resume" || type === "job_description") {
        await fetchJson("/api/documents/parse", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            documentId: result.documentId,
            parseMode: type === "resume" ? "resume" : "job_description",
          }),
        });
      }

      toast.success("Document saved");
      window.location.reload();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Upload failed");
    } finally {
      setPending(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add document</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Document type</Label>
            <Select value={type} onChange={(event) => setType(event.target.value as typeof type)}>
              {DOCUMENT_TYPES.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Title</Label>
            <Input value={title} onChange={(event) => setTitle(event.target.value)} />
          </div>
        </div>
        <div className="space-y-2">
          <Label>PDF upload</Label>
          <Input ref={fileRef} type="file" accept=".pdf,.txt" />
        </div>
        <div className="space-y-2">
          <Label>Or paste text</Label>
          <Textarea value={text} onChange={(event) => setText(event.target.value)} />
        </div>
        <div className="flex justify-end">
          <Button type="button" onClick={handleSubmit} disabled={pending}>
            Save document
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
