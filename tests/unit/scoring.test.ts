import { describe, expect, it } from "vitest";

import { bandForScore, computeOverallScore } from "../../src/lib/scoring/rubric";

describe("scoring", () => {
  it("computes the weighted overall score", () => {
    const overall = computeOverallScore({
      clarity: 80,
      relevance: 70,
      evidence: 90,
      structure: 75,
      roleFit: 85,
      confidence: 65,
    });

    expect(overall).toBe(79);
  });

  it("maps score bands", () => {
    expect(bandForScore(45)).toBe("Needs work");
    expect(bandForScore(58)).toBe("Developing");
    expect(bandForScore(72)).toBe("Promising");
    expect(bandForScore(88)).toBe("Strong");
  });
});
