'use client';

import { useState, useRef, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardActionArea from '@mui/material/CardActionArea';
import Chip from '@mui/material/Chip';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import Pagination from '@mui/material/Pagination';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import OutlinedInput from '@mui/material/OutlinedInput';
import Checkbox from '@mui/material/Checkbox';
import ListItemText from '@mui/material/ListItemText';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import Link from 'next/link';
import { recipeKeys } from '@/lib/recipe-keys';
import { fetchRecipes, fetchTags } from '@/lib/api';
import type { TRecipeDocument } from '@/lib/schemas/recipe';

const DIFFICULTIES = ['easy', 'medium', 'hard'] as const;

export default function RecipesPage() {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [difficulty, setDifficulty] = useState('');
  const [page, setPage] = useState(1);
  const limit = 12;
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSearchChange = useCallback((value: string) => {
    setSearch(value);
    setPage(1);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setDebouncedSearch(value), 300);
  }, []);

  const tagsQuery = useQuery({
    queryKey: recipeKeys.tags(),
    queryFn: fetchTags,
  });

  const query = useQuery({
    queryKey: recipeKeys.list({
      search: debouncedSearch || undefined,
      tags: selectedTags.length > 0 ? selectedTags : undefined,
      difficulty: difficulty || undefined,
      page: String(page),
    }),
    queryFn: () =>
      fetchRecipes({
        search: debouncedSearch || undefined,
        tags: selectedTags.length > 0 ? selectedTags : undefined,
        difficulty: difficulty || undefined,
        page,
        limit,
      }),
  });

  const recipes: TRecipeDocument[] = query.data?.recipes ?? [];
  const totalPages = query.data?.totalPages ?? 1;
  const availableTags: string[] = (tagsQuery.data ?? []).map((t) => t.name);

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4">Recipes</Typography>
        <Button component={Link} href="/recipes/new" variant="contained" startIcon={<AddIcon />}>
          New Recipe
        </Button>
      </Box>

      <Stack direction="row" spacing={2} sx={{ mb: 3, flexWrap: 'wrap' }}>
        <TextField
          label="Search recipes"
          value={search}
          onChange={(e) => handleSearchChange(e.target.value)}
          size="small"
          inputProps={{ 'data-testid': 'recipe-search-input' }}
          sx={{ flex: 1, minWidth: 200 }}
          slotProps={{
            input: {
              startAdornment: <SearchIcon color="action" sx={{ mr: 1 }} />,
            },
          }}
        />
        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel>Difficulty</InputLabel>
          <Select
            value={difficulty}
            onChange={(e) => {
              setDifficulty(e.target.value);
              setPage(1);
            }}
            label="Difficulty"
            data-testid="difficulty-filter"
          >
            <MenuItem value="">All</MenuItem>
            {DIFFICULTIES.map((d) => (
              <MenuItem key={d} value={d}>
                {d.charAt(0).toUpperCase() + d.slice(1)}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 200 }}>
          <InputLabel>Tags</InputLabel>
          <Select
            multiple
            value={selectedTags}
            onChange={(e) => {
              setSelectedTags(e.target.value as string[]);
              setPage(1);
            }}
            input={<OutlinedInput label="Tags" />}
            renderValue={(selected) => (selected as string[]).join(', ')}
            data-testid="tags-filter"
          >
            {availableTags.map((tag) => (
              <MenuItem key={tag} value={tag}>
                <Checkbox checked={selectedTags.includes(tag)} />
                <ListItemText primary={tag} />
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Stack>

      {query.isError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {query.error instanceof Error ? query.error.message : 'Failed to load recipes'}
        </Alert>
      )}

      {query.isLoading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress data-testid="loading-spinner" />
        </Box>
      )}

      {recipes.length === 0 && !query.isLoading && (
        <Typography color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
          No recipes found.
        </Typography>
      )}

      <Stack spacing={2} data-testid="recipe-list">
        {recipes.map((recipe: TRecipeDocument) => (
          <Card key={String(recipe._id)} data-testid="recipe-card">
            <CardActionArea component={Link} href={`/recipes/${recipe._id}`}>
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
                {(recipe.tags?.length ?? 0) > 0 && (
                  <Box sx={{ mt: 1, display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                    {(recipe.tags ?? []).map((tag: string) => (
                      <Chip key={tag} label={tag} size="small" variant="outlined" />
                    ))}
                  </Box>
                )}
              </CardContent>
            </CardActionArea>
          </Card>
        ))}
      </Stack>

      {totalPages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
          <Pagination
            count={totalPages}
            page={page}
            onChange={(_: React.ChangeEvent<unknown>, p: number) => setPage(p)}
            color="primary"
            data-testid="recipe-pagination"
          />
        </Box>
      )}
    </Container>
  );
}