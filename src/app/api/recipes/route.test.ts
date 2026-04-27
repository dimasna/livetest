import { describe, test, expect, beforeAll } from 'vitest';
import { NextRequest } from 'next/server';
import mongoose from 'mongoose';
import { RecipeModel } from '@/lib/recipe-model';
import { RecipeDocumentSchema } from '@/lib/schemas/recipe';

beforeAll(() => {
  global.__mongoose__ = { conn: mongoose, promise: Promise.resolve(mongoose) } as typeof global.__mongoose__;
});

const validRecipe = {
  title: 'Test Recipe',
  description: 'A simple test recipe.',
  servings: 4,
  prepMin: 10,
  cookMin: 20,
  difficulty: 'easy' as const,
  tags: ['quick'],
  ingredients: [{ name: 'Salt', qty: 5, unit: 'g' }],
  steps: ['Mix everything together well'],
};

const emptyContext = { params: Promise.resolve({}) };

function makeGetRequest(url: string) {
  return new NextRequest(new URL(url, 'http://localhost:3000'));
}

function makePostRequest(url: string, body: unknown) {
  return new NextRequest(new URL(url, 'http://localhost:3000'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('POST /api/recipes', () => {
  test('creates a recipe and returns valid TRecipeDocument shape', async () => {
    const { POST } = await import('@/app/api/recipes/route');
    const request = makePostRequest('/api/recipes', validRecipe);
    const response = await POST(request, emptyContext);
    expect(response.status).toBe(201);

    const json = await response.json();
    const result = RecipeDocumentSchema.safeParse(json);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(typeof result.data._id).toBe('string');
      expect(typeof result.data.createdAt).toBe('string');
      expect(typeof result.data.updatedAt).toBe('string');
      expect(result.data.title).toBe('Test Recipe');
      expect(result.data.tags).toEqual(['quick']);
    }
  });

  test('rejects invalid input with field errors', async () => {
    const { POST } = await import('@/app/api/recipes/route');
    const request = makePostRequest('/api/recipes', { title: '' });
    const response = await POST(request, emptyContext);
    expect(response.status).toBe(400);

    const json = await response.json();
    expect(json.fieldErrors).toBeDefined();
    expect(json.error).toBe('Validation failed');
  });

  test('rejects duplicate title case-insensitively', async () => {
    const { POST } = await import('@/app/api/recipes/route');
    const request1 = makePostRequest('/api/recipes', validRecipe);
    await POST(request1, emptyContext);

    const request2 = makePostRequest('/api/recipes', { ...validRecipe, title: 'test recipe' });
    const response = await POST(request2, emptyContext);
    expect(response.status).toBe(400);

    const json = await response.json();
    expect(json.fieldErrors.title).toBeDefined();
    expect(json.fieldErrors.title[0]).toContain('already exists');
  });

  test('strips extra fields not in schema', async () => {
    const { POST } = await import('@/app/api/recipes/route');
    const request = makePostRequest('/api/recipes', {
      ...validRecipe,
      extraField: 'should be stripped',
      malicious: true,
    });
    const response = await POST(request, emptyContext);
    expect(response.status).toBe(201);

    const json = await response.json();
    expect(json.extraField).toBeUndefined();
    expect(json.malicious).toBeUndefined();
  });
});

describe('GET /api/recipes', () => {
  test('returns paginated structure with valid recipe shapes', async () => {
    const { POST, GET } = await import('@/app/api/recipes/route');

    const createRequest = makePostRequest('/api/recipes', { ...validRecipe, title: 'Pagination Test' });
    await POST(createRequest, emptyContext);

    const listRequest = makeGetRequest('/api/recipes');
    const response = await GET(listRequest, emptyContext);
    expect(response.status).toBe(200);

    const json = await response.json();
    expect(json).toHaveProperty('recipes');
    expect(json).toHaveProperty('total');
    expect(json).toHaveProperty('page');
    expect(json).toHaveProperty('totalPages');
    expect(Array.isArray(json.recipes)).toBe(true);

    if (json.recipes.length > 0) {
      const recipeResult = RecipeDocumentSchema.safeParse(json.recipes[0]);
      expect(recipeResult.success).toBe(true);
    }
  });

  test('searches recipes by keyword', async () => {
    const { GET } = await import('@/app/api/recipes/route');
    const request = makeGetRequest('/api/recipes?search=test');
    const response = await GET(request, emptyContext);
    expect(response.status).toBe(200);
  });
});

describe('GET /api/recipes/tags', () => {
  test('returns sorted tag array', async () => {
    const { POST } = await import('@/app/api/recipes/route');
    const recipe = {
      ...validRecipe,
      title: 'Tags Test ' + Date.now(),
      tags: ['zebra', 'alpha', 'medium-rare'],
    };
    const createRequest = makePostRequest('/api/recipes', recipe);
    await POST(createRequest, emptyContext);

    const { GET } = await import('@/app/api/recipes/tags/route');
    const request = makeGetRequest('/api/recipes/tags');
    const response = await GET(request, emptyContext);
    expect(response.status).toBe(200);

    const tags: string[] = await response.json();
    expect(Array.isArray(tags)).toBe(true);
    if (tags.length >= 2) {
      for (let i = 1; i < tags.length; i++) {
        expect(tags[i]! >= (tags[i - 1] ?? '')).toBe(true);
      }
    }
  });
});

describe('Serialization — Lean doc to TRecipeDocument', () => {
  test('_id is string in API response, not ObjectId', async () => {
    const created = await RecipeModel.create({ ...validRecipe, title: 'Serialization Test ' + Date.now() });
    const { GET } = await import('@/app/api/recipes/[id]/route');
    const request = makeGetRequest(`/api/recipes/${created._id}`);
    const response = await GET(request, { params: Promise.resolve({ id: created._id.toString() }) });
    const json = await response.json();

    expect(typeof json._id).toBe('string');
    expect(json._id).toBe(created._id.toString());
    const result = RecipeDocumentSchema.safeParse(json);
    expect(result.success).toBe(true);
  });

  test('timestamps are ISO strings in API response', async () => {
    const created = await RecipeModel.create({ ...validRecipe, title: 'Timestamp Test ' + Date.now() });
    const { GET } = await import('@/app/api/recipes/[id]/route');
    const request = makeGetRequest(`/api/recipes/${created._id}`);
    const response = await GET(request, { params: Promise.resolve({ id: created._id.toString() }) });
    const json = await response.json();

    expect(typeof json.createdAt).toBe('string');
    expect(typeof json.updatedAt).toBe('string');
    expect(json.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(json.updatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });
});