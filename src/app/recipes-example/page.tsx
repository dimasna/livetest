'use client';

import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import { recipeKeys } from '@/lib/recipe-keys';
import type { TRecipeDocument } from '@/lib/schemas/recipe';

async function fetchExampleRecipes(): Promise<TRecipeDocument[]> {
  const res = await fetch('/api/recipes/example');
  if (!res.ok) throw new Error('Failed to fetch recipes');
  return res.json() as Promise<TRecipeDocument[]>;
}

async function createExampleRecipe(data: {
  title: string;
  servings: number;
}): Promise<TRecipeDocument> {
  const res = await fetch('/api/recipes/example', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      title: data.title,
      description: 'Added via quick-add form.',
      servings: data.servings,
      prepMin: 10,
      cookMin: 10,
      difficulty: 'easy',
      tags: [],
      ingredients: [{ name: 'placeholder', qty: 1, unit: 'g' }],
      steps: ['Prepare as needed.'],
    }),
  });
  if (!res.ok) throw new Error('Failed to create recipe');
  return res.json() as Promise<TRecipeDocument>;
}

export default function RecipesExamplePage() {
  const [title, setTitle] = useState('');
  const [servings, setServings] = useState(4);

  const {
    data: recipes,
    isLoading,
    error,
  } = useQuery({
    queryKey: recipeKeys.list({}),
    queryFn: fetchExampleRecipes,
  });

  const createMutation = useMutation({
    mutationFn: createExampleRecipe,
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    createMutation.mutate({ title, servings });
    setTitle('');
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h4" sx={{ mb: 1 }}>
        Example: Recipe List + Quick Add
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        This page demonstrates the conventions used in this scaffold. Review the source (
        <code>src/app/recipes-example/page.tsx</code>,{' '}
        <code>src/lib/recipe-keys.ts</code>) before building your own implementation.
      </Typography>

      <Box
        component="form"
        onSubmit={handleSubmit}
        data-testid="quick-add-form"
        sx={{ display: 'flex', gap: 2, mb: 4, flexWrap: 'wrap' }}
      >
        <TextField
          label="Recipe title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          size="small"
          inputProps={{ 'data-testid': 'quick-add-title-input' }}
          sx={{ flex: 1, minWidth: 200 }}
        />
        <TextField
          label="Servings"
          type="number"
          value={servings}
          onChange={(e) => setServings(Number(e.target.value))}
          size="small"
          sx={{ width: 110 }}
        />
        <Button
          type="submit"
          variant="contained"
          data-testid="quick-add-submit"
        >
          Add
        </Button>
      </Box>

      {createMutation.isError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {createMutation.error instanceof Error
            ? createMutation.error.message
            : 'Something went wrong'}
        </Alert>
      )}

      {isLoading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress data-testid="loading-spinner" />
        </Box>
      )}

      {error && (
        <Alert severity="error">{error instanceof Error ? error.message : 'Load failed'}</Alert>
      )}

      {recipes && (
        <Stack spacing={2} data-testid="recipe-list">
          {recipes.map((recipe) => (
            <Card key={String(recipe._id)} data-testid="recipe-card">
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                  <Typography variant="h6" sx={{ flex: 1 }}>
                    {recipe.title}
                  </Typography>
                  <Chip
                    label={recipe.difficulty}
                    size="small"
                    color={
                      recipe.difficulty === 'easy'
                        ? 'success'
                        : recipe.difficulty === 'medium'
                          ? 'warning'
                          : 'error'
                    }
                  />
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                  {recipe.prepMin + recipe.cookMin} min · {recipe.servings} servings
                </Typography>
                {recipe.tags.length > 0 && (
                  <Box sx={{ mt: 1, display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                    {recipe.tags.map((tag) => (
                      <Chip key={tag} label={tag} size="small" variant="outlined" />
                    ))}
                  </Box>
                )}
              </CardContent>
            </Card>
          ))}
        </Stack>
      )}
    </Container>
  );
}
