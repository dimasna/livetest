import { type NextRequest, NextResponse } from 'next/server';
import { RecipeModel } from '@/lib/recipe-model';
import { RecipeSchema } from '@/lib/schemas/recipe';
import { zodErrorsToFieldErrors } from '@/lib/api-utils';
import { withDB } from '@/lib/with-db';
import { serializeRecipeDoc, serializeRecipeDocs } from '@/lib/serialize';

export const GET = withDB(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get('search') ?? '';
  const tagsParam = searchParams.get('tags') ?? '';
  const difficulty = searchParams.get('difficulty') ?? '';
  const page = Math.max(1, Number(searchParams.get('page') ?? '1'));
  const limit = Math.min(Math.max(1, Number(searchParams.get('limit') ?? '12')), 50);

  if (search.length > 100) {
    return NextResponse.json({ error: 'Search query too long' }, { status: 400 });
  }

  const filter: Record<string, unknown> = {};

  if (search) {
    const regex = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    filter.$or = [
      { title: regex },
      { description: regex },
      { 'ingredients.name': regex },
      { steps: regex },
      { tags: regex },
    ];
  }

  if (tagsParam) {
    const tags = tagsParam.split(',').filter(Boolean);
    if (tags.length > 0) {
      filter.tags = { $all: tags };
    }
  }

  if (difficulty) {
    filter.difficulty = difficulty;
  }

  const total = await RecipeModel.countDocuments(filter);
  const recipes = await RecipeModel.find(filter)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .lean();

  return NextResponse.json({
    recipes: serializeRecipeDocs(recipes),
    total,
    page,
    totalPages: Math.ceil(total / limit),
  });
});

export const POST = withDB(async (request: NextRequest) => {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const result = RecipeSchema.safeParse(body);

  if (!result.success) {
    return NextResponse.json(
      { error: 'Validation failed', fieldErrors: zodErrorsToFieldErrors(result.error.issues) },
      { status: 400 },
    );
  }

  const data = result.data;

  const existing = await RecipeModel.findOne({
    title: { $regex: `^${data.title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, $options: 'i' },
  }).lean();
  if (existing) {
    return NextResponse.json(
      { error: 'Title must be unique', fieldErrors: { title: ['A recipe with this title already exists'] } },
      { status: 400 },
    );
  }

  const recipe = await RecipeModel.create(data);
  return NextResponse.json(serializeRecipeDoc(recipe.toObject()), { status: 201 });
});