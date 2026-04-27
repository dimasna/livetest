'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import { recipeKeys } from '@/lib/recipe-keys';
import { fetchRecipe, updateRecipe } from '@/lib/api';
import RecipeForm from '@/components/RecipeForm';
import type { TCreateRecipeInput } from '@/lib/schemas/recipe';

export default function EditRecipePage() {
  const params = useParams();
  const rawId = params.id;
  const id = Array.isArray(rawId) ? rawId[0] : rawId;
  const router = useRouter();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: recipeKeys.detail(id ?? ''),
    queryFn: () => fetchRecipe(id!),
    enabled: !!id,
  });

  async function handleSubmit(data: TCreateRecipeInput) {
    const result = await updateRecipe(id!, data);
    if (!result.ok) {
      return { fieldErrors: result.fieldErrors };
    }
    queryClient.invalidateQueries({ queryKey: recipeKeys.lists() });
    queryClient.invalidateQueries({ queryKey: recipeKeys.detail(id!) });
    queryClient.invalidateQueries({ queryKey: recipeKeys.tags() });
    router.push(`/recipes/${id}`);
  }

  if (!id) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Alert severity="error">Recipe ID is missing</Alert>
      </Container>
    );
  }

  if (query.isLoading) {
    return (
      <Container maxWidth="md" sx={{ py: 4, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  if (query.isError) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Alert severity="error">
          {query.error instanceof Error ? query.error.message : 'Failed to load recipe'}
        </Alert>
      </Container>
    );
  }

  if (!query.data) return null;

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h4" sx={{ mb: 3 }}>
        Edit Recipe
      </Typography>
      <RecipeForm initialData={query.data} onSubmit={handleSubmit} submitLabel="Save Changes" />
    </Container>
  );
}