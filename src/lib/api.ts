import type { TRecipeDocument } from './schemas/recipe';
import type { TTagDocument } from './schemas/tag';

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public fieldErrors?: Record<string, string[]>,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export async function fetchRecipes(filters: {
  search?: string;
  tags?: string[];
  difficulty?: string;
  page?: number;
  limit?: number;
}): Promise<{ recipes: TRecipeDocument[]; total: number; page: number; totalPages: number }> {
  const params = new URLSearchParams();
  if (filters.search) params.set('search', filters.search);
  if (filters.tags?.length) params.set('tags', filters.tags.join(','));
  if (filters.difficulty) params.set('difficulty', filters.difficulty);
  if (filters.page) params.set('page', String(filters.page));
  if (filters.limit) params.set('limit', String(filters.limit));

  const res = await fetch(`/api/recipes?${params.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch recipes');
  return res.json();
}

export async function fetchRecipe(id: string): Promise<TRecipeDocument> {
  const res = await fetch(`/api/recipes/${id}`);
  if (!res.ok) throw new Error('Failed to fetch recipe');
  return res.json();
}

export async function createRecipe(
  data: unknown,
): Promise<{ recipe: TRecipeDocument; fieldErrors?: Record<string, string[]> }> {
  const res = await fetch('/api/recipes', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(data),
  });
  const json = await res.json();
  if (!res.ok) {
    if (res.status === 400 && json.fieldErrors) {
      return { recipe: json.recipe, fieldErrors: json.fieldErrors };
    }
    throw new Error(json.error ?? 'Failed to create recipe');
  }
  return { recipe: json };
}

export async function updateRecipe(
  id: string,
  data: unknown,
): Promise<{ recipe: TRecipeDocument; fieldErrors?: Record<string, string[]> }> {
  const res = await fetch(`/api/recipes/${id}`, {
    method: 'PUT',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(data),
  });
  const json = await res.json();
  if (!res.ok) {
    if (res.status === 400 && json.fieldErrors) {
      return { recipe: json.recipe, fieldErrors: json.fieldErrors };
    }
    throw new Error(json.error ?? 'Failed to update recipe');
  }
  return { recipe: json };
}

export async function deleteRecipe(id: string): Promise<void> {
  const res = await fetch(`/api/recipes/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete recipe');
}

export async function fetchTags(): Promise<TTagDocument[]> {
  const res = await fetch('/api/tags');
  if (!res.ok) throw new Error('Failed to fetch tags');
  return res.json();
}

export async function createTag(
  data: { name: string },
): Promise<{ tag?: TTagDocument; fieldErrors?: Record<string, string[]>; error?: string }> {
  const res = await fetch('/api/tags', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(data),
  });
  const json = await res.json();
  if (!res.ok) {
    return { fieldErrors: json.fieldErrors, error: json.error };
  }
  return { tag: json };
}

export async function deleteTag(id: string): Promise<void> {
  const res = await fetch(`/api/tags/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete tag');
}