import { type NextRequest, NextResponse } from 'next/server';
import { TagModel } from '@/lib/tag-model';
import { TagUpdateSchema } from '@/lib/schemas/tag';
import { zodErrorsToFieldErrors } from '@/lib/api-utils';
import { withDB } from '@/lib/with-db';
import mongoose from 'mongoose';

export const PUT = withDB(async (request: NextRequest, { params }) => {
  const id = (await params).id!;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return NextResponse.json({ error: 'Invalid tag ID' }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const result = TagUpdateSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      { error: 'Validation failed', fieldErrors: zodErrorsToFieldErrors(result.error.issues) },
      { status: 400 },
    );
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
});

export const DELETE = withDB(async (_request: NextRequest, { params }) => {
  const id = (await params).id!;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return NextResponse.json({ error: 'Invalid tag ID' }, { status: 400 });
  }

  const deleted = await TagModel.findByIdAndDelete(id).lean();
  if (!deleted) {
    return NextResponse.json({ error: 'Tag not found' }, { status: 404 });
  }

  return NextResponse.json({ success: true });
});