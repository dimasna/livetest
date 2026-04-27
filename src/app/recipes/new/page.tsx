'use client';

import { useRouter } from 'next/navigation';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import { useQueryClient } from '@tanstack/react-query';
import { recipeKeys } from '@/lib/recipe-keys';
import { createRecipe } from '@/lib/api';
import RecipeForm from '@/components/RecipeForm';
import type { TCreateRecipeInput } from '@/lib/schemas/recipe';

export default function NewRecipePage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  async function handleSubmit(data: TCreateRecipeInput) {
    const result = await createRecipe(data);
    if (!result.ok) {
      return { fieldErrors: result.fieldErrors };
    }
    queryClient.invalidateQueries({ queryKey: recipeKeys.lists() });
    queryClient.invalidateQueries({ queryKey: recipeKeys.tags() });
    router.push(`/recipes/${result.recipe._id}`);
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h4" sx={{ mb: 3 }}>
        New Recipe
      </Typography>
      <RecipeForm onSubmit={handleSubmit} submitLabel="Create Recipe" />
    </Container>
  );
}