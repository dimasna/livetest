import { type NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { TagModel } from '@/lib/tag-model';
import { TagCreateSchema } from '@/lib/schemas/tag';

export async function GET() {
  try {
    await connectDB();
    const tags = await TagModel.find().sort({ name: 1 }).lean();
    return NextResponse.json(tags);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body: unknown = await request.json();
    const result = TagCreateSchema.safeParse(body);

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

    const existing = await TagModel.findOne({ name: data.name }).lean();
    if (existing) {
      return NextResponse.json(
        { error: 'Tag already exists', fieldErrors: { name: ['A tag with this name already exists'] } },
        { status: 400 },
      );
    }

    const tag = await TagModel.create(data);
    return NextResponse.json(tag, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}