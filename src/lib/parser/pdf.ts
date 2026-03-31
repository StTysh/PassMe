import { UnprocessableEntityError } from "@/lib/api";
import { PDFParse } from "pdf-parse";

export async function extractPdfText(buffer: Buffer) {
  const parser = new PDFParse({ data: buffer });
  try {
    const result = await parser.getText();
    return result.text.trim();
  } catch (error) {
    const errorName = error instanceof Error ? error.name : "";
    const errorMessage = error instanceof Error ? error.message : "";

    if (errorName === "PasswordException") {
      throw new UnprocessableEntityError("Password-protected PDFs are not supported.");
    }

    if (
      errorName === "InvalidPDFException" ||
      errorName === "FormatError" ||
      /invalid pdf|bad xref|format error|corrupt/i.test(errorMessage)
    ) {
      throw new UnprocessableEntityError("The PDF is invalid or corrupted.");
    }

    throw new UnprocessableEntityError("Could not extract readable text from the PDF.");
  } finally {
    await parser.destroy().catch(() => undefined);
  }
}
