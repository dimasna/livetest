import { type NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { RecipeModel } from '@/lib/recipe-model';
import { RecipeUpdateSchema } from '@/lib/schemas/recipe';
import mongoose from 'mongoose';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await connectDB();
    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid recipe ID' }, { status: 400 });
    }

    const recipe = await RecipeModel.findById(id).lean();
    if (!recipe) {
      return NextResponse.json({ error: 'Recipe not found' }, { status: 404 });
    }

    return NextResponse.json(recipe);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await connectDB();
    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid recipe ID' }, { status: 400 });
    }

    const body: unknown = await request.json();
    const result = RecipeUpdateSchema.safeParse(body);

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
          {
            error: 'Title must be unique',
            fieldErrors: { title: ['A recipe with this title already exists'] },
          },
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
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await connectDB();
    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid recipe ID' }, { status: 400 });
    }

    const deleted = await RecipeModel.findByIdAndDelete(id).lean();
    if (!deleted) {
      return NextResponse.json({ error: 'Recipe not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}