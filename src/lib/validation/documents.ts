import { z } from "zod";

import { documentTypeSchema as domainDocumentTypeSchema } from "@/lib/types/domain";

export const documentTypeSchema = domainDocumentTypeSchema;

export const documentUploadMetadataSchema = z
  .object({
    candidateProfileId: z.string().trim().min(1),
    type: documentTypeSchema,
    title: z.string().trim().optional(),
    sourceFilename: z.string().trim().optional(),
    mimeType: z.string().trim().optional(),
  })
  .strict();

export const documentUploadSchema = documentUploadMetadataSchema
  .extend({
    text: z.string().trim().optional(),
  })
  .strict();

export const EXTRACT_PROFILE_MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;
export const EXTRACT_PROFILE_SUPPORTED_MIME_TYPES = new Set([
  "application/pdf",
  "text/plain",
]);
export const EXTRACT_PROFILE_SUPPORTED_EXTENSIONS = [".pdf", ".txt"];

export function validateExtractProfileFile(file: File | null | undefined) {
  if (!(file instanceof File)) {
    throw new Error("No file provided.");
  }

  if (file.size === 0) {
    throw new Error("File is empty.");
  }

  if (file.size > EXTRACT_PROFILE_MAX_FILE_SIZE_BYTES) {
    throw new Error("File exceeds the 10 MB limit.");
  }

  const normalizedName = file.name.toLowerCase();
  const hasSupportedExtension = EXTRACT_PROFILE_SUPPORTED_EXTENSIONS.some((extension) =>
    normalizedName.endsWith(extension),
  );
  const hasSupportedMime = EXTRACT_PROFILE_SUPPORTED_MIME_TYPES.has(file.type);

  if (!hasSupportedExtension && !hasSupportedMime) {
    throw new Error("Unsupported file type. Upload a PDF or plain text file.");
  }

  return {
    isPdf: file.type === "application/pdf" || normalizedName.endsWith(".pdf"),
    isText: file.type === "text/plain" || normalizedName.endsWith(".txt"),
  };
}

export const parseDocumentSchema = z
  .object({
    documentId: z.string().trim().min(1),
    parseMode: z.enum(["resume", "job_description"]),
  })
  .strict();

export const documentParseRequestSchema = parseDocumentSchema;

export const documentSearchQuerySchema = z
  .object({
    q: z.string().trim().min(1),
    profileId: z.string().trim().optional(),
    scope: z.enum(["documents", "transcripts", "all"]).default("all"),
  })
  .strict();
