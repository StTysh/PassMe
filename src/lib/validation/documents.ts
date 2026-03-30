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
    rawText: z.string().trim().optional(),
  })
  .strict();

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
