import { z } from "zod";

function emptyStringToUndefined(value: unknown) {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  }

  return value;
}

function coerceYearsExperience(value: unknown) {
  if (value === "" || value === null || value === undefined) {
    return null;
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) {
      return null;
    }

    const parsed = Number(trimmed);
    return Number.isNaN(parsed) ? value : parsed;
  }

  return value;
}

export const profileCreateSchema = z
  .object({
    fullName: z.string().trim().min(1).max(120),
    headline: z.preprocess(emptyStringToUndefined, z.string().trim().max(160).optional()),
    email: z.preprocess(emptyStringToUndefined, z.string().trim().email().optional()),
    yearsExperience: z.preprocess(
      coerceYearsExperience,
      z.number().int().min(0).max(60).nullable().optional(),
    ),
    targetRoles: z.array(z.string().trim().min(1).max(120)).default([]),
    primaryDomain: z.preprocess(emptyStringToUndefined, z.string().trim().max(120).optional()),
    notes: z.preprocess(emptyStringToUndefined, z.string().trim().max(5000).optional()),
  })
  .strict();

export const profileSchema =
  profileCreateSchema as typeof profileCreateSchema & {
    _type: z.infer<typeof profileCreateSchema>;
  };

export const profileUpdateSchema = profileCreateSchema
  .partial()
  .extend({
    id: z.string().trim().min(1),
  })
  .strict();

export const profileListQuerySchema = z
  .object({
    q: z.string().trim().min(1).optional(),
  })
  .strict();
