import { describe, test, expect } from 'vitest';
import { RecipeSchema, RecipeUpdateSchema, IngredientSchema } from './recipe';
import { RecipeModel } from '@/lib/recipe-model';

const validRecipe = {
  title: 'Classic Spaghetti',
  description: 'A simple pasta dish with tomato sauce.',
  servings: 4,
  prepMin: 10,
  cookMin: 20,
  difficulty: 'easy' as const,
  tags: ['quick', 'comfort'],
  ingredients: [
    { name: 'Spaghetti', qty: 400, unit: 'g' },
    { name: 'Tomato sauce', qty: 500, unit: 'ml' },
  ],
  steps: [
    'Boil salted water.',
    'Cook pasta for 10 minutes.',
    'Heat the sauce and combine.',
  ],
};

describe('IngredientSchema', () => {
  test('accepts valid ingredient', () => {
    const result = IngredientSchema.safeParse({ name: 'Salt', qty: 5, unit: 'g' });
    expect(result.success).toBe(true);
  });

  test('rejects empty name', () => {
    const result = IngredientSchema.safeParse({ name: '', qty: 5, unit: 'g' });
    expect(result.success).toBe(false);
  });

  test('rejects empty unit', () => {
    const result = IngredientSchema.safeParse({ name: 'Salt', qty: 5, unit: '' });
    expect(result.success).toBe(false);
  });
});

describe('RecipeSchema — business rules', () => {
  // ------------------------------------------------------------------
  // Rule 1: Title must be unique (enforced server-side via DB, not zod)
  //    → Tested separately in API tests
  // ------------------------------------------------------------------

  test('trims title whitespace', () => {
    const result = RecipeSchema.safeParse({ ...validRecipe, title: '  Spaghetti  ' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.title).toBe('Spaghetti');
    }
  });

  test('rejects empty title', () => {
    const result = RecipeSchema.safeParse({ ...validRecipe, title: '' });
    expect(result.success).toBe(false);
  });

  test('rejects whitespace-only title', () => {
    const result = RecipeSchema.safeParse({ ...validRecipe, title: '   ' });
    expect(result.success).toBe(false);
  });

  // ------------------------------------------------------------------
  // Rule 2: Total time must be 1–1440 minutes
  // ------------------------------------------------------------------

  test('rejects total time of 0 (prep=0, cook=0)', () => {
    const result = RecipeSchema.safeParse({ ...validRecipe, prepMin: 0, cookMin: 0 });
    expect(result.success).toBe(false);
  });

  test('accepts total time of 1', () => {
    const result = RecipeSchema.safeParse({ ...validRecipe, prepMin: 1, cookMin: 0 });
    expect(result.success).toBe(true);
  });

  test('accepts total time of 1440 (24h)', () => {
    const result = RecipeSchema.safeParse({ ...validRecipe, prepMin: 720, cookMin: 720 });
    expect(result.success).toBe(true);
  });

  test('rejects total time exceeding 1440', () => {
    const result = RecipeSchema.safeParse({ ...validRecipe, prepMin: 800, cookMin: 700 });
    expect(result.success).toBe(false);
  });

  // ------------------------------------------------------------------
  // Rule 3: Ingredients — no dupes, min 1, max 50
  // ------------------------------------------------------------------

  test('rejects duplicate ingredient names (case-insensitive)', () => {
    const result = RecipeSchema.safeParse({
      ...validRecipe,
      ingredients: [
        { name: 'Salt', qty: 5, unit: 'g' },
        { name: 'salt', qty: 3, unit: 'g' },
      ],
    });
    expect(result.success).toBe(false);
  });

  test('rejects zero ingredients', () => {
    const result = RecipeSchema.safeParse({ ...validRecipe, ingredients: [] });
    expect(result.success).toBe(false);
  });

  test('rejects more than 50 ingredients', () => {
    const ingredients = Array.from({ length: 51 }, (_, i) => ({
      name: `Ingredient ${i}`,
      qty: 1,
      unit: 'g',
    }));
    const result = RecipeSchema.safeParse({ ...validRecipe, ingredients });
    expect(result.success).toBe(false);
  });

  test('accepts 50 ingredients', () => {
    const ingredients = Array.from({ length: 50 }, (_, i) => ({
      name: `Ingredient ${i}`,
      qty: 1,
      unit: 'g',
    }));
    const result = RecipeSchema.safeParse({ ...validRecipe, ingredients });
    expect(result.success).toBe(true);
  });

  // ------------------------------------------------------------------
  // Rule 4: Tags — max 5, each 2–20 chars, matching ^[a-z0-9-]+$
  // ------------------------------------------------------------------

  test('rejects more than 5 tags', () => {
    const result = RecipeSchema.safeParse({
      ...validRecipe,
      tags: ['aa', 'bb', 'cc', 'dd', 'ee', 'ff'],
    });
    expect(result.success).toBe(false);
  });

  test('accepts 5 tags', () => {
    const result = RecipeSchema.safeParse({
      ...validRecipe,
      tags: ['aa', 'bb', 'cc', 'dd', 'ee'],
    });
    expect(result.success).toBe(true);
  });

  test('rejects tag shorter than 2 chars', () => {
    const result = RecipeSchema.safeParse({ ...validRecipe, tags: ['a'] });
    expect(result.success).toBe(false);
  });

  test('rejects tag longer than 20 chars', () => {
    const result = RecipeSchema.safeParse({
      ...validRecipe,
      tags: ['abcdefghijklmnopqrstuvwxyz'],
    });
    expect(result.success).toBe(false);
  });

  test('rejects tag with uppercase', () => {
    const result = RecipeSchema.safeParse({ ...validRecipe, tags: ['Quick'] });
    expect(result.success).toBe(false);
  });

  test('rejects tag with spaces', () => {
    const result = RecipeSchema.safeParse({ ...validRecipe, tags: ['quick meal'] });
    expect(result.success).toBe(false);
  });

  test('accepts tag with hyphens and numbers', () => {
    const result = RecipeSchema.safeParse({ ...validRecipe, tags: ['high-protein-2'] });
    expect(result.success).toBe(true);
  });

  // ------------------------------------------------------------------
  // Rule 5: Steps — each 5–500 chars, max 30
  // ------------------------------------------------------------------

  test('rejects step shorter than 5 characters', () => {
    const result = RecipeSchema.safeParse({ ...validRecipe, steps: ['Do'] });
    expect(result.success).toBe(false);
  });

  test('accepts step of exactly 5 characters', () => {
    const result = RecipeSchema.safeParse({ ...validRecipe, steps: ['12345'] });
    expect(result.success).toBe(true);
  });

  test('rejects step exceeding 500 characters', () => {
    const longStep = 'a'.repeat(501);
    const result = RecipeSchema.safeParse({ ...validRecipe, steps: [longStep] });
    expect(result.success).toBe(false);
  });

  test('accepts step of exactly 500 characters', () => {
    const step500 = 'a'.repeat(500);
    const result = RecipeSchema.safeParse({ ...validRecipe, steps: [step500] });
    expect(result.success).toBe(true);
  });

  test('rejects more than 30 steps', () => {
    const steps = Array.from({ length: 31 }, (_, i) => `Step number ${i + 1} here`);
    const result = RecipeSchema.safeParse({ ...validRecipe, steps });
    expect(result.success).toBe(false);
  });

  test('accepts 30 steps', () => {
    const steps = Array.from({ length: 30 }, (_, i) => `Step number ${i + 1} here`);
    const result = RecipeSchema.safeParse({ ...validRecipe, steps });
    expect(result.success).toBe(true);
  });

  // ------------------------------------------------------------------
  // General shape validation (from original test)
  // ------------------------------------------------------------------

  test('accepts a valid recipe', () => {
    const result = RecipeSchema.safeParse(validRecipe);
    expect(result.success).toBe(true);
  });

  test('rejects a recipe with missing title field', () => {
    const { title: _title, ...noTitle } = validRecipe;
    const result = RecipeSchema.safeParse(noTitle);
    expect(result.success).toBe(false);
  });

  test('rejects an invalid difficulty value', () => {
    const result = RecipeSchema.safeParse({
      ...validRecipe,
      difficulty: 'extreme',
    });
    expect(result.success).toBe(false);
  });
});

describe('RecipeUpdateSchema', () => {
  test('accepts a partial update (single field)', () => {
    const result = RecipeUpdateSchema.safeParse({ title: 'New Title' });
    expect(result.success).toBe(true);
  });

  test('accepts an empty object (no-op update)', () => {
    const result = RecipeUpdateSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  test('validates tags rules when tags field is present', () => {
    const result = RecipeUpdateSchema.safeParse({
      tags: ['aa', 'bb', 'cc', 'dd', 'ee', 'ff'],
    });
    expect(result.success).toBe(false);
  });

  test('validates total time rule when prepMin is provided without cookMin', () => {
    const result = RecipeUpdateSchema.safeParse({ prepMin: 0 });
    expect(result.success).toBe(false);
  });

  test('passes total time validation when only difficulty is updated', () => {
    const result = RecipeUpdateSchema.safeParse({ difficulty: 'medium' });
    expect(result.success).toBe(true);
  });
});

describe('RecipeModel', () => {
  test('can create and retrieve a recipe document', async () => {
    const created = await RecipeModel.create(validRecipe);
    expect(created._id).toBeDefined();
    expect(created.title).toBe('Classic Spaghetti');

    const found = await RecipeModel.findById(created._id).lean();
    expect(found).not.toBeNull();
    expect(found?.title).toBe('Classic Spaghetti');
  });
});