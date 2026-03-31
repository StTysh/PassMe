import { chunkText } from "@/lib/chunking/text";
import { geminiTasks } from "@/lib/gemini/tasks";
import { documentsRepo } from "@/lib/repositories/documentsRepo";
import { ensureDatabaseReady } from "@/lib/services/bootstrap";
import { extractPdfText } from "@/lib/parser/pdf";
import { normalizeDocumentText } from "@/lib/parser/documents";

export const documentsService = {
  async storeUploadedDocument(input: {
    candidateProfileId: string;
    type: "resume" | "job_description" | "cover_letter" | "application_answer" | "company_context";
    title?: string;
    text?: string;
    file?: File;
  }) {
    ensureDatabaseReady();

    let rawText = input.text?.trim() ?? "";
    let sourceFilename: string | null = null;
    let mimeType: string | null = null;

    if (input.file) {
      sourceFilename = input.file.name;
      mimeType = input.file.type;
      const buffer = Buffer.from(await input.file.arrayBuffer());
      rawText =
        input.file.type === "application/pdf"
          ? await extractPdfText(buffer)
          : buffer.toString("utf8");
    }

    rawText = normalizeDocumentText(rawText);

    if (!rawText) {
      throw new Error("Document text is empty after extraction.");
    }

    const document = documentsRepo.createDocument({
      candidateProfileId: input.candidateProfileId,
      type: input.type,
      title: input.title ?? sourceFilename ?? input.type,
      sourceFilename,
      mimeType,
      rawText,
    });

    if (!document) {
      throw new Error("Failed to store document.");
    }

    const chunks = chunkText(rawText);
    documentsRepo.replaceChunks(document.id, chunks);

    return document;
  },

  async parseResumeDocument(documentId: string) {
    ensureDatabaseReady();
    const document = documentsRepo.getDocumentById(documentId);
    if (!document) {
      throw new Error("Document not found.");
    }

    const parsed = await geminiTasks.parseResume(document.rawText);
    documentsRepo.updateParsedDocument(documentId, parsed);

    const validation = await geminiTasks.validateResume(parsed);
    return { ...parsed, _validation: validation };
  },

  async parseJobDocument(documentId: string) {
    ensureDatabaseReady();
    const document = documentsRepo.getDocumentById(documentId);
    if (!document) {
      throw new Error("Document not found.");
    }

    const parsed = await geminiTasks.analyzeJob(document.rawText);
    documentsRepo.updateParsedDocument(documentId, parsed);
    return parsed;
  },

  chunkDocument(documentId: string) {
    ensureDatabaseReady();
    const document = documentsRepo.getDocumentById(documentId);
    if (!document) {
      throw new Error("Document not found.");
    }

    const chunks = chunkText(document.rawText);
    documentsRepo.replaceChunks(documentId, chunks);
    return chunks;
  },
};
