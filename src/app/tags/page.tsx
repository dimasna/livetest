'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import IconButton from '@mui/material/IconButton';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import Chip from '@mui/material/Chip';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import Link from 'next/link';
import { fetchTags, createTag, deleteTag } from '@/lib/api';
import { recipeKeys } from '@/lib/recipe-keys';
import type { TTagDocument } from '@/lib/schemas/tag';

export default function TagsPage() {
  const queryClient = useQueryClient();
  const [newTag, setNewTag] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [serverError, setServerError] = useState('');
  const [deleteDialogId, setDeleteDialogId] = useState<string | null>(null);

  const tagsQuery = useQuery({
    queryKey: recipeKeys.tags(),
    queryFn: fetchTags,
  });

  const createMutation = useMutation({
    mutationFn: createTag,
    onSuccess: (result) => {
      if (result.fieldErrors) {
        setFieldErrors(result.fieldErrors);
        return;
      }
      setNewTag('');
      setFieldErrors({});
      queryClient.invalidateQueries({ queryKey: recipeKeys.tags() });
    },
    onError: (err: Error) => setServerError(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteTag,
    onSuccess: () => {
      setDeleteDialogId(null);
      queryClient.invalidateQueries({ queryKey: recipeKeys.tags() });
    },
  });

  const tags: TTagDocument[] = tagsQuery.data ?? [];

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setFieldErrors({});
    setServerError('');
    createMutation.mutate({ name: newTag.trim().toLowerCase() });
  }

  return (
    <Container maxWidth="sm" sx={{ py: 4 }}>
      <Button component={Link} href="/recipes" startIcon={<ArrowBackIcon />} sx={{ mb: 2 }}>
        Back to Recipes
      </Button>

      <Typography variant="h4" sx={{ mb: 3 }}>
        Manage Tags
      </Typography>

      <Box component="form" onSubmit={handleCreate} sx={{ display: 'flex', gap: 1, mb: 3 }}>
        <TextField
          label="New tag"
          value={newTag}
          onChange={(e) => setNewTag(e.target.value.toLowerCase())}
          size="small"
          error={!!fieldErrors.name}
          helperText={fieldErrors.name?.join(', ') || '2–20 chars, lowercase alphanumeric or hyphens'}
          sx={{ flex: 1 }}
          data-testid="new-tag-input"
        />
        <Button
          type="submit"
          variant="contained"
          disabled={!newTag.trim() || createMutation.isPending}
          startIcon={<AddIcon />}
          data-testid="create-tag-btn"
        >
          Add
        </Button>
      </Box>

      {serverError && <Alert severity="error" sx={{ mb: 2 }}>{serverError}</Alert>}

      {tagsQuery.isLoading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      )}

      {tags.length === 0 && !tagsQuery.isLoading && (
        <Typography color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
          No tags yet. Create one above.
        </Typography>
      )}

      <Stack spacing={1}>
        {tags.map((tag) => (
          <Card key={String(tag._id)} variant="outlined" data-testid="tag-card">
            <CardContent sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', py: 1, '&:last-child': { pb: 1 } }}>
              <Chip label={tag.name} />
              <IconButton
                color="error"
                size="small"
                onClick={() => setDeleteDialogId(String(tag._id))}
                data-testid={`delete-tag-btn-${tag.name}`}
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            </CardContent>
          </Card>
        ))}
      </Stack>

      <Dialog open={deleteDialogId !== null} onClose={() => setDeleteDialogId(null)}>
        <DialogTitle>Delete Tag</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this tag? Recipes using this tag will still keep it.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogId(null)}>Cancel</Button>
          <Button
            onClick={() => deleteDialogId && deleteMutation.mutate(deleteDialogId)}
            color="error"
            variant="contained"
            disabled={deleteMutation.isPending}
            data-testid="confirm-delete-tag-btn"
          >
            {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}