import { chunkText } from "@/lib/chunking/text";
import {
  BadRequestError,
  ConflictError,
  NotFoundError,
  PayloadTooLargeError,
  UnsupportedMediaTypeError,
  UnprocessableEntityError,
} from "@/lib/api";
import { geminiTasks } from "@/lib/gemini/tasks";
import { documentsRepo } from "@/lib/repositories/documentsRepo";
import { interviewsRepo } from "@/lib/repositories/interviewsRepo";
import { profilesRepo } from "@/lib/repositories/profilesRepo";
import { ensureDatabaseReady } from "@/lib/services/bootstrap";
import { extractPdfText } from "@/lib/parser/pdf";
import { normalizeDocumentText } from "@/lib/parser/documents";

const GENERIC_UPLOAD_MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;
const GENERIC_UPLOAD_SUPPORTED_EXTENSIONS = new Set([".pdf", ".txt"]);

function resolveGenericUploadFileKind(file: File) {
  const normalizedName = file.name.toLowerCase();
  const mimeType = file.type.trim().toLowerCase();
  const dotIndex = normalizedName.lastIndexOf(".");
  const extension = dotIndex >= 0 ? normalizedName.slice(dotIndex) : "";
  const hasSupportedExtension = GENERIC_UPLOAD_SUPPORTED_EXTENSIONS.has(extension);
  const hasSupportedMime =
    mimeType === "application/pdf" || mimeType === "text/plain";
  const mimeIsGeneric = mimeType === "" || mimeType === "application/octet-stream";

  if (file.size === 0) {
    throw new BadRequestError("Uploaded file is empty.");
  }

  if (file.size > GENERIC_UPLOAD_MAX_FILE_SIZE_BYTES) {
    throw new PayloadTooLargeError("Uploaded file exceeds the 10 MB limit.");
  }

  if (!hasSupportedExtension && !hasSupportedMime) {
    throw new UnsupportedMediaTypeError("Unsupported file type. Upload a PDF or plain text file.");
  }

  if (hasSupportedMime) {
    if (mimeType === "application/pdf" && (!hasSupportedExtension || extension === ".pdf")) {
      return "pdf" as const;
    }

    if (mimeType === "text/plain" && (!hasSupportedExtension || extension === ".txt")) {
      return "text" as const;
    }

    throw new UnsupportedMediaTypeError("File extension and MIME type do not match a supported document type.");
  }

  if (mimeIsGeneric && hasSupportedExtension) {
    return extension === ".pdf" ? ("pdf" as const) : ("text" as const);
  }

  throw new UnsupportedMediaTypeError("Unsupported file type. Upload a PDF or plain text file.");
}

export const documentsService = {
  async storeUploadedDocument(input: {
    candidateProfileId: string;
    type: "resume" | "job_description" | "cover_letter" | "application_answer" | "company_context";
    title?: string;
    text?: string;
    file?: File;
  }) {
    ensureDatabaseReady();
    const profile = profilesRepo.getProfileById(input.candidateProfileId);
    if (!profile) {
      throw new NotFoundError("Candidate profile not found.");
    }

    if (!input.file && !input.text?.trim()) {
      throw new BadRequestError("Either a file or text content is required.");
    }

    if (input.type === "job_description" && !input.title?.trim()) {
      throw new BadRequestError("Job title is required when uploading a job description.");
    }

    let rawText = input.text?.trim() ?? "";
    let sourceFilename: string | null = null;
    let mimeType: string | null = null;

    if (input.file) {
      sourceFilename = input.file.name;
      mimeType = input.file.type;
      const fileKind = resolveGenericUploadFileKind(input.file);
      const buffer = Buffer.from(await input.file.arrayBuffer());
      try {
        rawText = fileKind === "pdf" ? await extractPdfText(buffer) : buffer.toString("utf8");
      } catch (error) {
        throw new UnprocessableEntityError(
          error instanceof Error && error.message
            ? `Failed to read uploaded file: ${error.message}`
            : "Failed to read uploaded file.",
        );
      }
    }

    rawText = normalizeDocumentText(rawText);

    if (!rawText) {
      throw new BadRequestError("Document text is empty after extraction.");
    }

    const chunks = chunkText(rawText);
    const document = documentsRepo.createDocument({
      candidateProfileId: input.candidateProfileId,
      type: input.type,
      title: input.title ?? sourceFilename ?? input.type,
      sourceFilename,
      mimeType,
      rawText,
      chunks,
    });

    if (!document) {
      throw new Error("Failed to store document.");
    }

    return document;
  },

  async parseResumeDocument(documentId: string) {
    ensureDatabaseReady();
    const document = documentsRepo.getDocumentById(documentId);
    if (!document) {
      throw new NotFoundError("Document not found.");
    }
    if (document.type !== "resume") {
      throw new ConflictError("Only resume documents can be parsed as resumes.");
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
      throw new NotFoundError("Document not found.");
    }
    if (document.type !== "job_description") {
      throw new ConflictError("Only job descriptions can be parsed as job descriptions.");
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

  deleteDocument(documentId: string) {
    ensureDatabaseReady();
    const document = documentsRepo.getDocumentById(documentId);
    if (!document) {
      throw new NotFoundError("Document not found.");
    }

    if (document.type === "resume") {
      const referencedSessions = interviewsRepo.listSessionsByResumeDocument(
        documentId,
        ["planned", "active", "completed", "cancelled"],
      );

      if (referencedSessions.length > 0) {
        throw new ConflictError("Cannot delete a resume that is referenced by an interview session.");
      }
    }

    if (document.type === "job_description") {
      const referencedSessions = interviewsRepo.listSessionsByJobDocument(documentId, [
        "planned",
        "active",
        "completed",
        "cancelled",
      ]);
      if (referencedSessions.length > 0) {
        throw new ConflictError("Cannot delete a job description that is referenced by an interview session.");
      }
    }

    try {
      documentsRepo.deleteDocument(documentId);
    } catch (error) {
      if (
        error instanceof Error &&
        /FOREIGN KEY constraint failed|SQLITE_CONSTRAINT_FOREIGNKEY/i.test(error.message)
      ) {
        throw new ConflictError("Cannot delete a document that is still referenced by an interview session.");
      }

      throw error;
    }
    return { deleted: true, document };
  },
};
