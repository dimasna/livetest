import { describe, test, expect } from 'vitest';
import { serializeRecipeDoc, serializeRecipeDocs } from './serialize';
import { RecipeDocumentSchema } from './schemas/recipe';
import mongoose from 'mongoose';

const validDoc = {
  _id: new mongoose.Types.ObjectId(),
  title: 'Test Recipe',
  description: 'A test recipe',
  servings: 4,
  prepMin: 10,
  cookMin: 20,
  difficulty: 'easy' as const,
  tags: ['quick'],
  ingredients: [{ name: 'Salt', qty: 5, unit: 'g' }],
  steps: ['Mix everything together well'],
  createdAt: new Date('2024-01-01T00:00:00.000Z'),
  updatedAt: new Date('2024-01-02T00:00:00.000Z'),
};

describe('serializeRecipeDoc', () => {
  test('converts ObjectId _id to string', () => {
    const result = serializeRecipeDoc(validDoc);
    expect(typeof result._id).toBe('string');
    expect(result._id).toBe(validDoc._id.toString());
  });

  test('converts Date timestamps to ISO strings', () => {
    const result = serializeRecipeDoc(validDoc);
    expect(typeof result.createdAt).toBe('string');
    expect(typeof result.updatedAt).toBe('string');
    expect(result.createdAt).toBe('2024-01-01T00:00:00.000Z');
    expect(result.updatedAt).toBe('2024-01-02T00:00:00.000Z');
  });

  test('validates against RecipeDocumentSchema', () => {
    const result = serializeRecipeDoc(validDoc);
    const schemaResult = RecipeDocumentSchema.safeParse(result);
    expect(schemaResult.success).toBe(true);
  });

  test('throws if document shape is invalid', () => {
    const invalidDoc = { _id: 'abc', title: 123 };
    expect(() => serializeRecipeDoc(invalidDoc)).toThrow();
  });

  test('preserves arrays (tags, ingredients, steps)', () => {
    const result = serializeRecipeDoc(validDoc);
    expect(result.tags).toEqual(['quick']);
    expect(result.ingredients).toEqual([{ name: 'Salt', qty: 5, unit: 'g' }]);
    expect(result.steps).toEqual(['Mix everything together well']);
  });
});

describe('serializeRecipeDocs', () => {
  test('maps over array of documents', () => {
    const docs = [validDoc, { ...validDoc, _id: new mongoose.Types.ObjectId(), title: 'Another Recipe' }];
    const results = serializeRecipeDocs(docs);
    expect(results).toHaveLength(2);
    expect(typeof results[0]!._id).toBe('string');
    expect(typeof results[1]!._id).toBe('string');
  });

  test('returns empty array for empty input', () => {
    expect(serializeRecipeDocs([])).toEqual([]);
  });
});