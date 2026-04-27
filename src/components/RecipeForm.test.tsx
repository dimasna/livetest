import { describe, test, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import RecipeForm from './RecipeForm';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

function Wrapper({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}

const validOnSubmit = async () => {};

describe('RecipeForm', () => {
  test('renders all required fields', () => {
    render(<RecipeForm onSubmit={validOnSubmit} submitLabel="Create" />, { wrapper: Wrapper });

    expect(screen.getByTestId('recipe-title-input')).toBeInTheDocument();
    expect(screen.getByTestId('recipe-description-input')).toBeInTheDocument();
    expect(screen.getByTestId('recipe-servings-input')).toBeInTheDocument();
    expect(screen.getByTestId('recipe-prepmin-input')).toBeInTheDocument();
    expect(screen.getByTestId('recipe-cookmin-input')).toBeInTheDocument();
    expect(screen.getByTestId('recipe-difficulty-input')).toBeInTheDocument();
    expect(screen.getByTestId('recipe-submit-btn')).toBeInTheDocument();
  });

  test('renders ingredient fields with add/remove', () => {
    render(<RecipeForm onSubmit={validOnSubmit} submitLabel="Create" />, { wrapper: Wrapper });

    expect(screen.getAllByTestId(/^ingredient-name-\d+$/)).toHaveLength(1);
    expect(screen.getByTestId('add-ingredient-btn')).toBeInTheDocument();
  });

  test('supports adding and removing ingredients', () => {
    render(<RecipeForm onSubmit={validOnSubmit} submitLabel="Create" />, { wrapper: Wrapper });

    fireEvent.click(screen.getByTestId('add-ingredient-btn'));
    expect(screen.getAllByTestId(/^ingredient-name-\d+$/)).toHaveLength(2);

    fireEvent.click(screen.getByTestId('remove-ingredient-1'));
    expect(screen.getAllByTestId(/^ingredient-name-\d+$/)).toHaveLength(1);
  });

  test('supports adding and removing steps', () => {
    render(<RecipeForm onSubmit={validOnSubmit} submitLabel="Create" />, { wrapper: Wrapper });

    expect(screen.getAllByTestId(/^step-input-\d+$/)).toHaveLength(1);

    fireEvent.click(screen.getByTestId('add-step-btn'));
    expect(screen.getAllByTestId(/^step-input-\d+$/)).toHaveLength(2);

    fireEvent.click(screen.getByTestId('remove-step-1'));
    expect(screen.getAllByTestId(/^step-input-\d+$/)).toHaveLength(1);
  });

  test('renders with initial data in edit mode', () => {
    const initialData = {
      _id: 'abc123',
      title: 'Test Recipe',
      description: 'A test',
      servings: 4,
      prepMin: 10,
      cookMin: 20,
      difficulty: 'easy' as const,
      tags: ['quick'],
      ingredients: [{ name: 'Salt', qty: 5, unit: 'g' }],
      steps: ['Cook it well'],
      createdAt: '2024-01-01',
      updatedAt: '2024-01-01',
    };

    render(<RecipeForm initialData={initialData} onSubmit={validOnSubmit} submitLabel="Save" />, { wrapper: Wrapper });

    expect(screen.getByTestId('recipe-title-input')).toBeInTheDocument();
    expect(screen.getByTestId('recipe-submit-btn')).toHaveTextContent('Save');
  });
});