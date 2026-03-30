import { z } from "zod";

export const profileCreateSchema = z
  .object({
    fullName: z.string().trim().min(1).max(120),
    headline: z.string().trim().max(160).optional(),
    email: z.string().trim().email().optional(),
    yearsExperience: z.number().int().min(0).max(60).nullable().optional(),
    targetRoles: z.array(z.string().trim().min(1).max(120)).default([]),
    primaryDomain: z.string().trim().max(120).optional(),
    notes: z.string().trim().max(5000).optional(),
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
