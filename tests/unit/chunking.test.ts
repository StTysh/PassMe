import { describe, expect, it } from "vitest";

import { chunkText } from "../../src/lib/chunking/text";

describe("chunkText", () => {
  it("returns no chunks for empty text", () => {
    expect(chunkText("")).toEqual([]);
  });

  it("splits long text into ordered chunks", () => {
    const text = Array.from({ length: 300 }, (_, index) => `word${index}`).join(" ");
    const chunks = chunkText(text, 120, 20);

    expect(chunks.length).toBeGreaterThan(1);
    expect(chunks[0]?.chunkIndex).toBe(0);
    expect(chunks[1]?.chunkIndex).toBe(1);
    expect(chunks.every((chunk) => chunk.text.length > 0)).toBe(true);
  });
});
