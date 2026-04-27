import { type NextRequest, NextResponse } from 'next/server';
import { TagModel } from '@/lib/tag-model';
import { TagCreateSchema } from '@/lib/schemas/tag';
import { zodErrorsToFieldErrors } from '@/lib/api-utils';
import { withDB } from '@/lib/with-db';

export const GET = withDB(async () => {
  const tags = await TagModel.find().sort({ name: 1 }).lean();
  return NextResponse.json(tags);
});

export const POST = withDB(async (request: NextRequest) => {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const result = TagCreateSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      { error: 'Validation failed', fieldErrors: zodErrorsToFieldErrors(result.error.issues) },
      { status: 400 },
    );
  }

  const data = result.data;

  const existing = await TagModel.findOne({ name: data.name }).lean();
  if (existing) {
    return NextResponse.json(
      { error: 'Tag already exists', fieldErrors: { name: ['A tag with this name already exists'] } },
      { status: 400 },
    );
  }

  const tag = await TagModel.create(data);
  return NextResponse.json(tag, { status: 201 });
});