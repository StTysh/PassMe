import { describe, expect, it } from "vitest";

import { profileCreateSchema } from "../../src/lib/validation/profile";

describe("profileCreateSchema", () => {
  it("accepts blank optional text fields and blank email", () => {
    const result = profileCreateSchema.safeParse({
      fullName: "Jane Doe",
      headline: "",
      email: "",
      yearsExperience: null,
      targetRoles: [],
      primaryDomain: "",
      notes: "",
    });

    expect(result.success).toBe(true);
    if (!result.success) return;

    expect(result.data.headline).toBeUndefined();
    expect(result.data.email).toBeUndefined();
    expect(result.data.primaryDomain).toBeUndefined();
    expect(result.data.notes).toBeUndefined();
  });

  it("coerces yearsExperience from a numeric string", () => {
    const result = profileCreateSchema.safeParse({
      fullName: "Jane Doe",
      email: "jane@example.com",
      yearsExperience: "5",
      targetRoles: [],
    });

    expect(result.success).toBe(true);
    if (!result.success) return;

    expect(result.data.yearsExperience).toBe(5);
  });

  it("rejects whitespace-only required fields", () => {
    const result = profileCreateSchema.safeParse({
      fullName: "   ",
      targetRoles: [],
    });

    expect(result.success).toBe(false);
  });
});
