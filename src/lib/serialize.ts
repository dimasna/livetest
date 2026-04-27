import { RecipeDocumentSchema, type TRecipeDocument } from './schemas/recipe';

export function serializeRecipeDoc(doc: unknown): TRecipeDocument {
  const serialized = JSON.parse(JSON.stringify(doc));
  return RecipeDocumentSchema.parse(serialized);
}

export function serializeRecipeDocs(docs: unknown[]): TRecipeDocument[] {
  return docs.map(serializeRecipeDoc);
}