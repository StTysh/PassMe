import { describe, expect, it } from "vitest";

import { sanitizeFtsQuery } from "../../src/lib/utils";
import {
  EXTRACT_PROFILE_MAX_FILE_SIZE_BYTES,
  documentUploadSchema,
  validateExtractProfileFile,
} from "../../src/lib/validation/documents";

describe("documentUploadSchema", () => {
  it("accepts text uploads using the standardized field name", () => {
    const result = documentUploadSchema.safeParse({
      candidateProfileId: "profile_123",
      type: "resume",
      title: "Resume",
      text: "Candidate summary",
    });

    expect(result.success).toBe(true);
    if (!result.success) return;

    expect(result.data.text).toBe("Candidate summary");
  });

  it("rejects the legacy rawText field", () => {
    const result = documentUploadSchema.safeParse({
      candidateProfileId: "profile_123",
      type: "resume",
      rawText: "legacy payload",
    });

    expect(result.success).toBe(false);
  });
});

describe("sanitizeFtsQuery", () => {
  it("strips FTS operators and punctuation from user queries", () => {
    expect(sanitizeFtsQuery('C++ AND "system design" NEAR/2 tradeoff')).toBe(
      '"C" "system" "design" "2" "tradeoff"',
    );
  });

  it("returns an empty query when no searchable terms remain", () => {
    expect(sanitizeFtsQuery('"" AND OR NOT')).toBe("");
  });
});

describe("validateExtractProfileFile", () => {
  it("accepts pdf and text files", () => {
    const pdfFile = new File(["resume"], "resume.pdf", { type: "application/pdf" });
    const textFile = new File(["resume"], "resume.txt", { type: "text/plain" });

    expect(validateExtractProfileFile(pdfFile)).toEqual({ isPdf: true, isText: false });
    expect(validateExtractProfileFile(textFile)).toEqual({ isPdf: false, isText: true });
  });

  it("rejects empty, oversized, and unsupported files", () => {
    const emptyFile = new File([], "resume.pdf", { type: "application/pdf" });
    const hugeFile = new File(["x".repeat(EXTRACT_PROFILE_MAX_FILE_SIZE_BYTES + 1)], "resume.txt", {
      type: "text/plain",
    });
    const badFile = new File(["binary"], "resume.exe", { type: "application/octet-stream" });

    expect(() => validateExtractProfileFile(emptyFile)).toThrow("File is empty.");
    expect(() => validateExtractProfileFile(hugeFile)).toThrow("File exceeds the 10 MB limit.");
    expect(() => validateExtractProfileFile(badFile)).toThrow(
      "Unsupported file type. Upload a PDF or plain text file.",
    );
  });
});
