import { type NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { RecipeModel } from '@/lib/recipe-model';
import { RecipeSchema } from '@/lib/schemas/recipe';

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') ?? '';
    const tagsParam = searchParams.get('tags') ?? '';
    const difficulty = searchParams.get('difficulty') ?? '';
    const page = Math.max(1, Number(searchParams.get('page') ?? '1'));
    const limit = Math.min(Number(searchParams.get('limit') ?? '12'), 100);

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
      recipes,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body: unknown = await request.json();
    const result = RecipeSchema.safeParse(body);

    if (!result.success) {
      const fieldErrors: Record<string, string[]> = {};
      for (const issue of result.error.issues) {
        const key = issue.path.join('.');
        const arr = fieldErrors[key] ?? [];
        arr.push(issue.message);
        fieldErrors[key] = arr;
      }
      return NextResponse.json({ error: 'Validation failed', fieldErrors }, { status: 400 });
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
    return NextResponse.json(recipe, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}