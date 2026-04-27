import { z } from 'zod';

const TAG_REGEX = /^[a-z0-9-]+$/;

export const TagCreateSchema = z.object({
  name: z
    .string()
    .min(2, 'Tag must be at least 2 characters')
    .max(20, 'Tag must be at most 20 characters')
    .regex(TAG_REGEX, 'Tag must be lowercase alphanumeric or hyphens'),
});

export type TCreateTagInput = z.infer<typeof TagCreateSchema>;

export const TagUpdateSchema = z.object({
  name: z
    .string()
    .min(2, 'Tag must be at least 2 characters')
    .max(20, 'Tag must be at most 20 characters')
    .regex(TAG_REGEX, 'Tag must be lowercase alphanumeric or hyphens'),
});

export type TUpdateTagInput = z.infer<typeof TagUpdateSchema>;

export const TagDocumentSchema = z.object({
  _id: z.string(),
  name: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type TTagDocument = z.infer<typeof TagDocumentSchema>;