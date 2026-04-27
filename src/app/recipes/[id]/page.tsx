'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Divider from '@mui/material/Divider';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import Link from 'next/link';
import { useState } from 'react';
import { recipeKeys } from '@/lib/recipe-keys';
import { fetchRecipe, deleteRecipe } from '@/lib/api';

export default function RecipeDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  const queryClient = useQueryClient();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const query = useQuery({
    queryKey: recipeKeys.detail(id),
    queryFn: () => fetchRecipe(id),
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteRecipe(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: recipeKeys.lists() });
      router.push('/recipes');
    },
  });

  if (query.isLoading) {
    return (
      <Container maxWidth="md" sx={{ py: 4, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress data-testid="loading-spinner" />
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

  const recipe = query.data;
  if (!recipe) return null;

  const totalTime = recipe.prepMin + recipe.cookMin;

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Button component={Link} href="/recipes" startIcon={<ArrowBackIcon />} sx={{ mb: 2 }}>
        Back to Recipes
      </Button>

      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2, flexWrap: 'wrap', gap: 1 }}>
        <Box>
          <Typography variant="h4" sx={{ mb: 0.5 }}>
            {recipe.title}
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
            <Chip
              label={recipe.difficulty}
              color={
                recipe.difficulty === 'easy'
                  ? 'success'
                  : recipe.difficulty === 'medium'
                    ? 'warning'
                    : 'error'
              }
              size="small"
            />
            <Typography variant="body2" color="text.secondary">
              {totalTime} min total · {recipe.servings} servings
            </Typography>
          </Box>
        </Box>
        <Stack direction="row" spacing={1}>
          <Button
            component={Link}
            href={`/recipes/${id}/edit`}
            variant="outlined"
            startIcon={<EditIcon />}
          >
            Edit
          </Button>
          <Button
            variant="outlined"
            color="error"
            startIcon={<DeleteIcon />}
            onClick={() => setDeleteDialogOpen(true)}
            data-testid="delete-recipe-btn"
          >
            Delete
          </Button>
        </Stack>
      </Box>

      <Typography variant="body1" sx={{ mb: 3 }}>
        {recipe.description}
      </Typography>

      {(recipe.tags?.length ?? 0) > 0 && (
        <Box sx={{ mb: 3, display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
          {(recipe.tags ?? []).map((tag: string) => (
            <Chip key={tag} label={tag} size="small" variant="outlined" />
          ))}
        </Box>
      )}

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 1 }}>Time</Typography>
          <Box sx={{ display: 'flex', gap: 4 }}>
            <Box>
              <Typography variant="body2" color="text.secondary">Prep</Typography>
              <Typography variant="body1">{recipe.prepMin} min</Typography>
            </Box>
            <Box>
              <Typography variant="body2" color="text.secondary">Cook</Typography>
              <Typography variant="body1">{recipe.cookMin} min</Typography>
            </Box>
            <Box>
              <Typography variant="body2" color="text.secondary">Total</Typography>
              <Typography variant="body1" fontWeight="bold">{totalTime} min</Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 1 }}>Ingredients</Typography>
          <Stack spacing={0.5}>
            {recipe.ingredients?.map((ing: { name: string; qty: number; unit: string }, i: number) => (
              <Box key={i} sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2">{ing.name}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {ing.qty} {ing.unit}
                </Typography>
              </Box>
            ))}
          </Stack>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 1 }}>Steps</Typography>
          <Stack spacing={1.5}>
            {recipe.steps?.map((step: string, i: number) => (
              <Box key={i} sx={{ display: 'flex', gap: 1 }}>
                <Typography variant="body2" fontWeight="bold" sx={{ minWidth: 24 }}>
                  {i + 1}.
                </Typography>
                <Typography variant="body2">{step}</Typography>
              </Box>
            ))}
          </Stack>
        </CardContent>
      </Card>

      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete Recipe</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete &ldquo;{recipe.title}&rdquo;? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={() => deleteMutation.mutate()}
            color="error"
            variant="contained"
            disabled={deleteMutation.isPending}
            data-testid="confirm-delete-btn"
          >
            {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}