import { describe, test, expect, beforeAll } from 'vitest';
import { NextRequest } from 'next/server';
import mongoose from 'mongoose';
import { RecipeDocumentSchema } from '@/lib/schemas/recipe';
import { RecipeModel } from '@/lib/recipe-model';

beforeAll(() => {
  global.__mongoose__ = { conn: mongoose, promise: Promise.resolve(mongoose) } as typeof global.__mongoose__;
});

const validRecipe = {
  title: 'Detail Test Recipe',
  description: 'A recipe for detail route testing.',
  servings: 4,
  prepMin: 10,
  cookMin: 20,
  difficulty: 'easy' as const,
  tags: ['quick'],
  ingredients: [{ name: 'Salt', qty: 5, unit: 'g' }],
  steps: ['Mix everything together well'],
};

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

function makePutRequest(url: string, body: unknown) {
  return new NextRequest(new URL(url, 'http://localhost:3000'), {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

function makeDeleteRequest(url: string) {
  return new NextRequest(new URL(url, 'http://localhost:3000'), { method: 'DELETE' });
}

async function createTestRecipe(overrides: Record<string, unknown> = {}) {
  const recipe = await RecipeModel.create({ ...validRecipe, ...overrides });
  return recipe;
}

describe('GET /api/recipes/[id]', () => {
  test('returns 400 for missing ID', async () => {
    const { GET } = await import('@/app/api/recipes/[id]/route');
    const request = makeGetRequest('/api/recipes/');
    const response = await GET(request, { params: Promise.resolve({}) });
    expect(response.status).toBe(400);

    const json = await response.json();
    expect(json.error).toContain('Missing');
  });

  test('returns 400 for invalid ObjectId', async () => {
    const { GET } = await import('@/app/api/recipes/[id]/route');
    const request = makeGetRequest('/api/recipes/invalid-id');
    const response = await GET(request, { params: Promise.resolve({ id: 'invalid-id' }) });
    expect(response.status).toBe(400);

    const json = await response.json();
    expect(json.error).toContain('Invalid');
  });

  test('returns 404 for non-existent recipe', async () => {
    const { GET } = await import('@/app/api/recipes/[id]/route');
    const fakeId = new mongoose.Types.ObjectId().toString();
    const request = makeGetRequest(`/api/recipes/${fakeId}`);
    const response = await GET(request, { params: Promise.resolve({ id: fakeId }) });
    expect(response.status).toBe(404);
  });

  test('returns recipe with valid TRecipeDocument shape', async () => {
    const recipe = await createTestRecipe({ title: 'Get By ID ' + Date.now() });
    const { GET } = await import('@/app/api/recipes/[id]/route');
    const request = makeGetRequest(`/api/recipes/${recipe._id}`);
    const response = await GET(request, { params: Promise.resolve({ id: recipe._id.toString() }) });
    expect(response.status).toBe(200);

    const json = await response.json();
    const result = RecipeDocumentSchema.safeParse(json);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data._id).toBe(recipe._id.toString());
      expect(result.data.title).toBe(recipe.title);
    }
  });
});

describe('PUT /api/recipes/[id]', () => {
  test('returns 400 for missing ID', async () => {
    const { PUT } = await import('@/app/api/recipes/[id]/route');
    const request = makePutRequest('/api/recipes/', { title: 'Updated' });
    const response = await PUT(request, { params: Promise.resolve({}) });
    expect(response.status).toBe(400);
  });

  test('updates a recipe and returns valid shape', async () => {
    const recipe = await createTestRecipe({ title: 'Update Test ' + Date.now() });
    const { PUT } = await import('@/app/api/recipes/[id]/route');
    const request = makePutRequest(`/api/recipes/${recipe._id}`, { title: 'Updated Title' });
    const response = await PUT(request, { params: Promise.resolve({ id: recipe._id.toString() }) });
    expect(response.status).toBe(200);

    const json = await response.json();
    expect(json.title).toBe('Updated Title');
    const result = RecipeDocumentSchema.safeParse(json);
    expect(result.success).toBe(true);
  });

  test('rejects duplicate title on update', async () => {
    const recipe1 = await createTestRecipe({ title: 'Unique Title One ' + Date.now() });
    const recipe2 = await createTestRecipe({ title: 'Unique Title Two ' + Date.now() });
    const { PUT } = await import('@/app/api/recipes/[id]/route');
    const request = makePutRequest(`/api/recipes/${recipe2._id}`, { title: recipe1.title });
    const response = await PUT(request, { params: Promise.resolve({ id: recipe2._id.toString() }) });
    expect(response.status).toBe(400);

    const json = await response.json();
    expect(json.fieldErrors?.title).toBeDefined();
  });
});

describe('DELETE /api/recipes/[id]', () => {
  test('returns 400 for missing ID', async () => {
    const { DELETE } = await import('@/app/api/recipes/[id]/route');
    const request = makeDeleteRequest('/api/recipes/');
    const response = await DELETE(request, { params: Promise.resolve({}) });
    expect(response.status).toBe(400);
  });

  test('deletes a recipe and returns success', async () => {
    const recipe = await createTestRecipe({ title: 'Delete Test ' + Date.now() });
    const { DELETE } = await import('@/app/api/recipes/[id]/route');
    const request = makeDeleteRequest(`/api/recipes/${recipe._id}`);
    const response = await DELETE(request, { params: Promise.resolve({ id: recipe._id.toString() }) });
    expect(response.status).toBe(200);

    const json = await response.json();
    expect(json.success).toBe(true);

    const found = await RecipeModel.findById(recipe._id);
    expect(found).toBeNull();
  });

  test('returns 404 for non-existent recipe', async () => {
    const { DELETE } = await import('@/app/api/recipes/[id]/route');
    const fakeId = new mongoose.Types.ObjectId().toString();
    const request = makeDeleteRequest(`/api/recipes/${fakeId}`);
    const response = await DELETE(request, { params: Promise.resolve({ id: fakeId }) });
    expect(response.status).toBe(404);
  });
});