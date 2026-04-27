'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import IconButton from '@mui/material/IconButton';
import Alert from '@mui/material/Alert';
import Divider from '@mui/material/Divider';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import Autocomplete from '@mui/material/Autocomplete';
import { RecipeSchema, type TCreateRecipeInput, type TRecipeDocument } from '@/lib/schemas/recipe';
import { zodErrorsToFieldErrors } from '@/lib/api-utils';
import Chip from '@mui/material/Chip';
import { recipeKeys } from '@/lib/recipe-keys';
import { fetchTags } from '@/lib/api';

type FormState = TCreateRecipeInput;

interface RecipeFormProps {
  initialData?: TRecipeDocument;
  onSubmit: (data: FormState) => Promise<{ fieldErrors?: Record<string, string[]> } | void>;
  submitLabel: string;
}

function emptyIngredient() {
  return { name: '', qty: 0, unit: '' };
}

function formToSchema(form: FormState): FormState {
  return {
    ...form,
    title: form.title.trim(),
    ingredients: form.ingredients.map((ing) => ({
      ...ing,
      name: ing.name.trim(),
      unit: ing.unit.trim(),
    })),
    steps: form.steps.filter((s) => s.trim().length > 0),
  };
}

export default function RecipeForm({ initialData, onSubmit, submitLabel }: RecipeFormProps) {
  const [form, setForm] = useState<FormState>(
    initialData
      ? {
          title: initialData.title,
          description: initialData.description,
          servings: initialData.servings,
          prepMin: initialData.prepMin,
          cookMin: initialData.cookMin,
          difficulty: initialData.difficulty,
          tags: initialData.tags,
          ingredients: initialData.ingredients,
          steps: initialData.steps,
        }
      : {
          title: '',
          description: '',
          servings: 4,
          prepMin: 10,
          cookMin: 15,
          difficulty: 'easy' as const,
          tags: [],
          ingredients: [emptyIngredient()],
          steps: [''],
        },
  );

  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState('');

  const tagsQuery = useQuery({
    queryKey: recipeKeys.tags(),
    queryFn: fetchTags,
  });
  const availableTags: string[] = tagsQuery.data ?? [];

  function handleAddIngredient() {
    setForm((prev) => ({ ...prev, ingredients: [...prev.ingredients, emptyIngredient()] }));
  }

  function handleRemoveIngredient(index: number) {
    setForm((prev) => ({
      ...prev,
      ingredients: prev.ingredients.filter((_, i) => i !== index),
    }));
  }

  function handleIngredientChange(index: number, field: 'name' | 'qty' | 'unit', value: string) {
    setForm((prev) => {
      const ingredients = [...prev.ingredients];
      ingredients[index] = {
        ...ingredients[index],
        [field]: field === 'qty' ? Number(value) || 0 : value,
      } as { name: string; qty: number; unit: string };
      return { ...prev, ingredients };
    });
  }

  function handleAddStep() {
    setForm((prev) => ({ ...prev, steps: [...prev.steps, ''] }));
  }

  function handleRemoveStep(index: number) {
    setForm((prev) => ({
      ...prev,
      steps: prev.steps.filter((_, i) => i !== index),
    }));
  }

  function handleStepChange(index: number, value: string) {
    setForm((prev) => {
      const steps = [...prev.steps];
      steps[index] = value;
      return { ...prev, steps };
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFieldErrors({});
    setServerError('');

    const prepared = formToSchema(form);
    if (prepared.steps.length === 0) {
      setFieldErrors({ steps: ['At least 1 step is required'] });
      return;
    }
    const finalData = { ...prepared, steps: prepared.steps };

    const result = RecipeSchema.safeParse(finalData);
    if (!result.success) {
      setFieldErrors(zodErrorsToFieldErrors(result.error.issues));
      return;
    }

    setSubmitting(true);
    try {
      const response = await onSubmit(result.data);
      if (response?.fieldErrors) {
        setFieldErrors(response.fieldErrors);
      }
    } catch (err) {
      setServerError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  }

  function getFieldError(path: string): string | undefined {
    const errs = fieldErrors[path];
    return errs ? errs.join(', ') : undefined;
  }

  return (
    <Box component="form" onSubmit={handleSubmit} data-testid="recipe-form">
      {serverError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {serverError}
        </Alert>
      )}

      <Stack spacing={2.5}>
        <TextField
          label="Title"
          value={form.title}
          onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
          error={!!getFieldError('title')}
          helperText={getFieldError('title')}
          required
          data-testid="recipe-title-input"
        />

        <TextField
          label="Description"
          value={form.description}
          onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
          error={!!getFieldError('description')}
          helperText={getFieldError('description')}
          multiline
          rows={3}
          required
          data-testid="recipe-description-input"
        />

        <Stack direction="row" spacing={2} flexWrap="wrap">
          <TextField
            label="Servings"
            type="number"
            value={form.servings}
            onChange={(e) => setForm((prev) => ({ ...prev, servings: Number(e.target.value) || 1 }))}
            sx={{ minWidth: 100 }}
            error={!!getFieldError('servings')}
            helperText={getFieldError('servings')}
            required
            data-testid="recipe-servings-input"
          />
          <TextField
            label="Prep time (min)"
            type="number"
            value={form.prepMin}
            onChange={(e) => setForm((prev) => ({ ...prev, prepMin: Number(e.target.value) || 0 }))}
            sx={{ minWidth: 130 }}
            error={!!getFieldError('prepMin')}
            helperText={getFieldError('prepMin')}
            required
            data-testid="recipe-prepmin-input"
          />
          <TextField
            label="Cook time (min)"
            type="number"
            value={form.cookMin}
            onChange={(e) => setForm((prev) => ({ ...prev, cookMin: Number(e.target.value) || 0 }))}
            sx={{ minWidth: 130 }}
            error={!!getFieldError('cookMin')}
            helperText={getFieldError('cookMin')}
            required
            data-testid="recipe-cookmin-input"
          />
        </Stack>
        {getFieldError('prepMin') && (
          <Typography variant="caption" color="error">
            {getFieldError('prepMin')}
          </Typography>
        )}

        <FormControl sx={{ minWidth: 160 }}>
          <InputLabel>Difficulty</InputLabel>
          <Select
            value={form.difficulty}
            onChange={(e) => setForm((prev) => ({ ...prev, difficulty: e.target.value as 'easy' | 'medium' | 'hard' }))}
            label="Difficulty"
            data-testid="recipe-difficulty-input"
          >
            <MenuItem value="easy">Easy</MenuItem>
            <MenuItem value="medium">Medium</MenuItem>
            <MenuItem value="hard">Hard</MenuItem>
          </Select>
        </FormControl>

        <Divider />
        <Typography variant="h6">Tags</Typography>
        <Autocomplete
          multiple
          freeSolo
          options={availableTags}
          value={form.tags}
          data-testid="recipe-tags-input"
          onChange={(_, newValue) => {
            const tags = newValue.slice(0, 5).map((t) => t.toLowerCase().trim()).filter((t) => /^[a-z0-9-]{2,20}$/.test(t));
            const unique = [...new Set(tags)];
            setForm((prev) => ({ ...prev, tags: unique }));
          }}
          renderTags={(value, getTagProps) =>
            value.map((tag, index) => {
              const { key, ...rest } = getTagProps({ index });
              return <Chip key={key} label={tag} size="small" {...rest} />;
            })
          }
          renderInput={(params) => (
            <TextField
              {...params}
              label="Tags (max 5)"
              placeholder="Type to search or add a tag"
              error={!!getFieldError('tags')}
              helperText={getFieldError('tags') || '2–20 chars, lowercase letters, numbers, hyphens'}
            />
          )}
          disabled={form.tags.length >= 5}
        />
        {getFieldError('tags') && (
          <Typography variant="caption" color="error">
            {getFieldError('tags')}
          </Typography>
        )}

        <Divider />
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6">Ingredients</Typography>
          <Button size="small" startIcon={<AddIcon />} onClick={handleAddIngredient} data-testid="add-ingredient-btn">
            Add Ingredient
          </Button>
        </Box>
        {getFieldError('ingredients') && (
          <Typography variant="caption" color="error">
            {getFieldError('ingredients')}
          </Typography>
        )}
        {form.ingredients.map((ing, i) => (
          <Stack key={i} direction="row" spacing={1} alignItems="flex-start" sx={{ flexWrap: 'wrap' }}>
            <TextField
              label="Name"
              value={ing.name}
              onChange={(e) => handleIngredientChange(i, 'name', e.target.value)}
              size="small"
              sx={{ flex: 2, minWidth: 120 }}
              error={!!getFieldError(`ingredients.${i}.name`)}
              helperText={getFieldError(`ingredients.${i}.name`)}
              data-testid={`ingredient-name-${i}`}
            />
            <TextField
              label="Qty"
              type="number"
              value={ing.qty}
              onChange={(e) => handleIngredientChange(i, 'qty', e.target.value)}
              size="small"
              sx={{ width: 90 }}
              error={!!getFieldError(`ingredients.${i}.qty`)}
              helperText={getFieldError(`ingredients.${i}.qty`)}
              data-testid={`ingredient-qty-${i}`}
            />
            <TextField
              label="Unit"
              value={ing.unit}
              onChange={(e) => handleIngredientChange(i, 'unit', e.target.value)}
              size="small"
              sx={{ width: 100 }}
              error={!!getFieldError(`ingredients.${i}.unit`)}
              helperText={getFieldError(`ingredients.${i}.unit`)}
              data-testid={`ingredient-unit-${i}`}
            />
            {form.ingredients.length > 1 && (
              <IconButton onClick={() => handleRemoveIngredient(i)} color="error" data-testid={`remove-ingredient-${i}`}>
                <DeleteIcon fontSize="small" />
              </IconButton>
            )}
          </Stack>
        ))}

        <Divider />
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6">Steps</Typography>
          <Button size="small" startIcon={<AddIcon />} onClick={handleAddStep} data-testid="add-step-btn">
            Add Step
          </Button>
        </Box>
        {getFieldError('steps') && (
          <Typography variant="caption" color="error">
            {getFieldError('steps')}
          </Typography>
        )}
        {form.steps.map((step, i) => (
          <Stack key={i} direction="row" spacing={1} alignItems="flex-start">
            <Typography variant="body2" sx={{ pt: 1.5, minWidth: 24 }}>
              {i + 1}.
            </Typography>
            <TextField
              fullWidth
              multiline
              value={step}
              onChange={(e) => handleStepChange(i, e.target.value)}
              placeholder={`Step ${i + 1}`}
              size="small"
              error={!!getFieldError(`steps.${i}`)}
              helperText={getFieldError(`steps.${i}`)}
              data-testid={`step-input-${i}`}
            />
            {form.steps.length > 1 && (
              <IconButton onClick={() => handleRemoveStep(i)} color="error" data-testid={`remove-step-${i}`}>
                <DeleteIcon fontSize="small" />
              </IconButton>
            )}
          </Stack>
        ))}

        <Button type="submit" variant="contained" size="large" disabled={submitting} data-testid="recipe-submit-btn">
          {submitting ? 'Saving...' : submitLabel}
        </Button>
      </Stack>
    </Box>
  );
}