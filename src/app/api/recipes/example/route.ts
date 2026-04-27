import { type NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { RecipeModel } from '@/lib/recipe-model';

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const limit = Math.min(Number(searchParams.get('limit') ?? '20'), 100);

    const recipes = await RecipeModel.find().limit(limit).lean();
    return NextResponse.json(recipes);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body: unknown = await request.json();

    // Artificial delay — demonstrates async behaviour in the example form.
    await new Promise<void>((resolve) => setTimeout(resolve, 200));

    const recipe = await RecipeModel.create(body);

    return NextResponse.json(recipe, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
