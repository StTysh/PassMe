import { documentTypeSchema } from "@/lib/validation/documents";

export function normalizeDocumentText(text: string) {
  return text.replace(/\r/g, "").trim();
}

export function normalizeDocumentType(value: string) {
  return documentTypeSchema.parse(value);
}
