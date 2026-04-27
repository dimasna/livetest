import { z } from 'zod';

// ---------------------------------------------------------------------------
// Zod schemas — shape + business rules (client-safe, no mongoose)
// ---------------------------------------------------------------------------

export const IngredientSchema = z.object({
  name: z.string().min(1, 'Ingredient name is required'),
  qty: z.number(),
  unit: z.string().min(1, 'Unit is required'),
});

export type TIngredient = z.infer<typeof IngredientSchema>;

const TAG_REGEX = /^[a-z0-9-]+$/;

export const RecipeSchema = z
  .object({
    title: z
      .string()
      .transform((s) => s.trim())
      .pipe(z.string().min(1, 'Title is required')),
    description: z.string().min(1, 'Description is required'),
    servings: z.number().int().positive('Servings must be at least 1'),
    prepMin: z.number().int().nonnegative('Prep time cannot be negative'),
    cookMin: z.number().int().nonnegative('Cook time cannot be negative'),
    difficulty: z.enum(['easy', 'medium', 'hard']),
    tags: z
      .array(z.string().regex(TAG_REGEX, 'Tag must be lowercase alphanumeric or hyphens'))
      .max(5, 'Maximum 5 tags')
      .refine(
        (tags) => tags.every((t) => t.length >= 2 && t.length <= 20),
        'Each tag must be 2–20 characters',
      ),
    ingredients: z
      .array(IngredientSchema)
      .min(1, 'At least 1 ingredient is required')
      .max(50, 'Maximum 50 ingredients')
      .refine(
        (ings) => {
          const names = ings.map((i) => i.name.trim().toLowerCase());
          return new Set(names).size === names.length;
        },
        'Ingredient names must be unique (case-insensitive)',
      ),
    steps: z
      .array(
        z
          .string()
          .min(5, 'Each step must be at least 5 characters')
          .max(500, 'Each step must be at most 500 characters'),
      )
      .max(30, 'Maximum 30 steps'),
  })
  .refine(
    ({ prepMin, cookMin }) => {
      const total = prepMin + cookMin;
      return total > 0 && total <= 1440;
    },
    {
      message: 'Total time (prep + cook) must be between 1 and 1440 minutes',
      path: ['prepMin'],
    },
  );

export type TCreateRecipeInput = z.infer<typeof RecipeSchema>;

export const RecipeUpdateSchema = z
  .object({
    title: z.string().transform((s) => s.trim()).pipe(z.string().min(1, 'Title is required')).optional(),
    description: z.string().min(1).optional(),
    servings: z.number().int().positive().optional(),
    prepMin: z.number().int().nonnegative().optional(),
    cookMin: z.number().int().nonnegative().optional(),
    difficulty: z.enum(['easy', 'medium', 'hard']).optional(),
    tags: z
      .array(z.string().regex(TAG_REGEX, 'Tag must be lowercase alphanumeric or hyphens'))
      .max(5, 'Maximum 5 tags')
      .refine(
        (tags) => tags.every((t) => t.length >= 2 && t.length <= 20),
        'Each tag must be 2–20 characters',
      )
      .optional(),
    ingredients: z
      .array(IngredientSchema)
      .min(1, 'At least 1 ingredient is required')
      .max(50, 'Maximum 50 ingredients')
      .refine(
        (ings) => {
          const names = ings.map((i) => i.name.trim().toLowerCase());
          return new Set(names).size === names.length;
        },
        'Ingredient names must be unique (case-insensitive)',
      )
      .optional(),
    steps: z
      .array(
        z
          .string()
          .min(5, 'Each step must be at least 5 characters')
          .max(500, 'Each step must be at most 500 characters'),
      )
      .max(30, 'Maximum 30 steps')
      .optional(),
  })
  .refine(
    (data) => {
      if (data.prepMin !== undefined || data.cookMin !== undefined) {
        const prep = data.prepMin ?? 0;
        const cook = data.cookMin ?? 0;
        const total = prep + cook;
        return total > 0 && total <= 1440;
      }
      return true;
    },
    {
      message: 'Total time (prep + cook) must be between 1 and 1440 minutes',
      path: ['prepMin'],
    },
  );

export type TUpdateRecipeInput = z.infer<typeof RecipeUpdateSchema>;

export const RecipeDocumentSchema = z.object({
  _id: z.string(),
  title: z.string(),
  description: z.string(),
  servings: z.number().int().positive(),
  prepMin: z.number().int().nonnegative(),
  cookMin: z.number().int().nonnegative(),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  tags: z.array(z.string()),
  ingredients: z.array(IngredientSchema),
  steps: z.array(z.string()),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type TRecipeDocument = z.infer<typeof RecipeDocumentSchema>;