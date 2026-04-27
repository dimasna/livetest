import { type NextRequest, NextResponse } from 'next/server';
import { RecipeModel } from '@/lib/recipe-model';
import { RecipeUpdateSchema } from '@/lib/schemas/recipe';
import { zodErrorsToFieldErrors } from '@/lib/api-utils';
import { withDB } from '@/lib/with-db';
import mongoose from 'mongoose';

export const GET = withDB(async (request: NextRequest, { params }) => {
  const id = (await params).id!;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return NextResponse.json({ error: 'Invalid recipe ID' }, { status: 400 });
  }

  const recipe = await RecipeModel.findById(id).lean();
  if (!recipe) {
    return NextResponse.json({ error: 'Recipe not found' }, { status: 404 });
  }
  return NextResponse.json(recipe);
});

export const PUT = withDB(async (request: NextRequest, { params }) => {
  const id = (await params).id!;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return NextResponse.json({ error: 'Invalid recipe ID' }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const result = RecipeUpdateSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      { error: 'Validation failed', fieldErrors: zodErrorsToFieldErrors(result.error.issues) },
      { status: 400 },
    );
  }

  const data = result.data;

  if (data.title) {
    const existing = await RecipeModel.findOne({
      title: {
        $regex: `^${data.title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`,
        $options: 'i',
      },
      _id: { $ne: id },
    }).lean();
    if (existing) {
      return NextResponse.json(
        { error: 'Title must be unique', fieldErrors: { title: ['A recipe with this title already exists'] } },
        { status: 400 },
      );
    }
  }

  const updated = await RecipeModel.findByIdAndUpdate(id, data, {
    new: true,
    runValidators: true,
  }).lean();

  if (!updated) {
    return NextResponse.json({ error: 'Recipe not found' }, { status: 404 });
  }

  return NextResponse.json(updated);
});

export const DELETE = withDB(async (_request: NextRequest, { params }) => {
  const id = (await params).id!;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return NextResponse.json({ error: 'Invalid recipe ID' }, { status: 400 });
  }

  const deleted = await RecipeModel.findByIdAndDelete(id).lean();
  if (!deleted) {
    return NextResponse.json({ error: 'Recipe not found' }, { status: 404 });
  }

  return NextResponse.json({ success: true });
});