import { NextResponse } from 'next/server';
import { RecipeModel } from '@/lib/recipe-model';
import { withDB } from '@/lib/with-db';

export const GET = withDB(async () => {
  const tags = await RecipeModel.distinct('tags');
  return NextResponse.json(tags.sort());
});