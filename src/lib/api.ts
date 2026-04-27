import { RecipeDocumentSchema, type TRecipeDocument, type TCreateRecipeInput, type TUpdateRecipeInput } from './schemas/recipe';

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

interface PaginatedRecipes {
  recipes: TRecipeDocument[];
  total: number;
  page: number;
  totalPages: number;
}

function validateRecipe(data: unknown): TRecipeDocument {
  return RecipeDocumentSchema.parse(data);
}

export async function fetchRecipes(filters: {
  search?: string;
  tags?: string[];
  difficulty?: string;
  page?: number;
  limit?: number;
}): Promise<PaginatedRecipes> {
  const params = new URLSearchParams();
  if (filters.search) params.set('search', filters.search);
  if (filters.tags?.length) params.set('tags', filters.tags.join(','));
  if (filters.difficulty) params.set('difficulty', filters.difficulty);
  if (filters.page) params.set('page', String(filters.page));
  if (filters.limit) params.set('limit', String(filters.limit));

  const res = await fetch(`/api/recipes?${params.toString()}`);
  if (!res.ok) throw new ApiError(res.status, 'Failed to fetch recipes');
  const json = await res.json();
  return {
    ...json,
    recipes: json.recipes.map(validateRecipe),
  };
}

export async function fetchRecipe(id: string): Promise<TRecipeDocument> {
  const res = await fetch(`/api/recipes/${id}`);
  if (!res.ok) throw new ApiError(res.status, res.status === 404 ? 'Recipe not found' : 'Failed to fetch recipe');
  return validateRecipe(await res.json());
}

export type CreateRecipeResult =
  | { ok: true; recipe: TRecipeDocument }
  | { ok: false; fieldErrors: Record<string, string[]> };

export async function createRecipe(data: TCreateRecipeInput): Promise<CreateRecipeResult> {
  const res = await fetch('/api/recipes', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(data),
  });
  const json = await res.json();
  if (!res.ok) {
    if (res.status === 400 && json.fieldErrors) {
      return { ok: false, fieldErrors: json.fieldErrors };
    }
    throw new ApiError(res.status, json.error ?? 'Failed to create recipe');
  }
  return { ok: true, recipe: validateRecipe(json) };
}

export type UpdateRecipeResult =
  | { ok: true; recipe: TRecipeDocument }
  | { ok: false; fieldErrors: Record<string, string[]> };

export async function updateRecipe(id: string, data: TUpdateRecipeInput): Promise<UpdateRecipeResult> {
  const res = await fetch(`/api/recipes/${id}`, {
    method: 'PUT',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(data),
  });
  const json = await res.json();
  if (!res.ok) {
    if (res.status === 400 && json.fieldErrors) {
      return { ok: false, fieldErrors: json.fieldErrors };
    }
    throw new ApiError(res.status, json.error ?? 'Failed to update recipe');
  }
  return { ok: true, recipe: validateRecipe(json) };
}

export async function deleteRecipe(id: string): Promise<void> {
  const res = await fetch(`/api/recipes/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new ApiError(res.status, 'Failed to delete recipe');
}

export async function fetchTags(): Promise<string[]> {
  const res = await fetch('/api/recipes/tags');
  if (!res.ok) throw new ApiError(res.status, 'Failed to fetch tags');
  return res.json();
}