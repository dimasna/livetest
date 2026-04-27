import { type NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { TagModel } from '@/lib/tag-model';
import { TagUpdateSchema } from '@/lib/schemas/tag';
import mongoose from 'mongoose';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await connectDB();
    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid tag ID' }, { status: 400 });
    }

    const body: unknown = await request.json();
    const result = TagUpdateSchema.safeParse(body);

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

    const existing = await TagModel.findOne({
      name: data.name,
      _id: { $ne: id },
    }).lean();
    if (existing) {
      return NextResponse.json(
        { error: 'Tag already exists', fieldErrors: { name: ['A tag with this name already exists'] } },
        { status: 400 },
      );
    }

    const updated = await TagModel.findByIdAndUpdate(id, data, { new: true, runValidators: true }).lean();
    if (!updated) {
      return NextResponse.json({ error: 'Tag not found' }, { status: 404 });
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
      return NextResponse.json({ error: 'Invalid tag ID' }, { status: 400 });
    }

    const deleted = await TagModel.findByIdAndDelete(id).lean();
    if (!deleted) {
      return NextResponse.json({ error: 'Tag not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}