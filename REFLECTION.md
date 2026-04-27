# Reflection

> **Required.** Fill in all sections before submitting. A blank or incomplete REFLECTION.md will significantly affect your evaluation.

---

## 1. Architectural Decisions

Describe **3 architectural decisions** you made. For each, explain:

- What the decision was
- What alternatives you considered
- The trade-off you accepted
- What you would change with more time

**Decision 1: Client + server validation with shared Zod schemas**

_Context:_ The spec requires business rules enforced on both client and server. I needed to avoid duplicating validation logic.

_Options considered:_ (a) Server-only validation with error messages shown on the client, (b) Separate client/server validation rules, (c) Shared Zod schemas used on both sides.

_Decision and trade-offs:_ I chose (c) — shared Zod schemas (`RecipeSchema`, `RecipeUpdateSchema`) imported by both the API routes and `RecipeForm`. The schemas enforce all 5 business rules (unique title deferred to server DB query). The trade-off is that mongoose imports in `recipe.ts` would crash the browser bundle, so I split the file: `schemas/recipe.ts` (Zod only, client-safe) and `recipe-model.ts` (mongoose, server-only). This added a file but keeps the single source of truth for validation.

_With more time I'd:_ Extract the `TAG_REGEX` constant and shared refine/validation helpers into a separate `validation.ts` so the model file doesn't re-declare anything, and add a dedicated API integration test suite that exercises the full round-trip including server-side title uniqueness.

---

**Decision 2: No separate Tag entity — tags derived from recipe data**

_Context:_ I initially built a full CRUD `Tag` model with management page, API routes, and mongoose collection. The spec says recipes have `tags: string[]`.

_Options considered:_ (a) Separate `Tag` entity with management UI, (b) Derive available tags from `RecipeModel.distinct('tags')`, (c) Hardcoded tag list.

_Decision and trade-offs:_ I went with (a) first, then realized it created a sync problem: seeded recipes had tags not in the `Tag` collection, creating/deleting tags didn't affect recipe data, and there was no foreign key enforcement. I reverted to (b) — a simple `GET /api/recipes/tags` endpoint returning `distinct('tags')`. The trade-off is tags can't have metadata (color, icon), but for this app they're just plain label strings. This eliminated an entire entity, 4 API routes, a management page, and the sync problem.

_With more time I'd:_ If the product needed tag metadata (colors, categories), I'd reintroduce a `Tag` collection but with a migration script to sync existing recipe tags and a comment on the `Recipe` schema explaining the relationship.

---

**Decision 3: Discriminated union API return types instead of nullable fields**

_Context:_ The initial scaffold's example returned `{ error, fieldErrors? }` on errors. My `createRecipe`/`updateRecipe` originally returned `{ recipe?, fieldErrors? }` where `recipe` was `undefined` on validation errors but typed as required.

_Options considered:_ (a) Nullable return type `{ recipe?: TRecipeDocument, fieldErrors?: Record }`, (b) Throw custom `ApiError` on all failures, (c) Discriminated union `{ ok: true, recipe } | { ok: false, fieldErrors }`.

_Decision and trade-offs:_ I chose (c). The trade-off is slightly more verbose calling code (`result.ok` check), but it's type-safe — you can't access `result.recipe` without narrowing to the success branch. The old pattern let you write `result.recipe._id` without TypeScript warning even when `recipe` was `undefined`.

_With more time I'd:_ Add a `useFormMutation` hook that wraps `useMutation` + zod client-side validation + server error field mapping, so every form page doesn't repeat the same submission pattern.

---

## 2. Bugs Found in the Scaffold

- **File and line**: `src/lib/schemas/recipe.ts:44-46` (`RecipeSchema` — `tags` and `ingredients` validation)
  - **Description**: The original `RecipeSchema` declared `tags: z.array(z.string())` and `ingredients: z.array(IngredientSchema)` without enforcing any business rules (unique ingredients, tag format/length, step length limits, total time bounds). The comments explicitly stated "business rules are NOT enforced here; they are part of the interview challenge."
  - **Fix applied**: Added all 5 business rules as Zod `.refine()` and `.max()`/`.min()` validators. This was the expected challenge, not a bug per se.

- **File and line**: `src/lib/schemas/recipe.ts:15-16` (original `title` validation)
  - **Description**: `z.string().min(1)` validated before `.transform((s) => s.trim())`, so a title of `"   "` (whitespace-only) would pass the `.min(1)` check since it had length 3 before trimming.
  - **Fix applied**: Changed to `z.string().transform((s) => s.trim()).pipe(z.string().min(1))` so trim happens first, then the min check runs on the trimmed value.

- **File and line**: `src/lib/schemas/recipe.ts:74-76` (original `RecipeSchema.extend()` for document type)
  - **Description**: `RecipeSchema` was wrapped in `.refine()` (returns `ZodEffects`), which doesn't have `.extend()`. The original scaffold would have crash at runtime if `RecipeDocumentSchema.extend()` was called, though the scaffold's tests didn't catch this because they didn't exercise that code path.
  - **Fix applied**: Replaced with a standalone `z.object({...})` for `RecipeDocumentSchema` instead of extending from the effect-wrapped schema.

- **File and line**: `src/app/recipes-example/page.tsx:158` (implicit `any` on `.map((tag) =>`)
  - **Description**: TypeScript strict mode would flag `tag` as implicit `any` in the example page's tag rendering.
  - **Fix applied**: Did not fix — this is in the scaffold's example file which I was told not to modify.

---

## 3. AI Tool Usage

Disclose every AI tool you used. Be specific.

| Tool | Task(s) | Representative prompt | What you kept | What you changed or rejected |
| ---- | ------- | --------------------- | ------------- | ---------------------------- |
| OpenCode (glm-5.1) | Architecture planning, code generation, refactoring, test writing, reflection | "build feature approach for the project, the requirements in CANDIDATE.md" | Zod schema structure, API route patterns, component structure, test coverage, all refactoring decisions | Rejected initial hardcoded tag list — replaced with dynamic `distinct()` query; rejected separate Tag entity after realizing sync problems; changed MUI component approach for tags from Select to Autocomplete |
| OpenCode (glm-5.1) | Bug fixing | "Cannot read properties of undefined (reading 'Recipe')" browser error | Split recipe.ts into schemas-only and model-only files to prevent mongoose in client bundle | — |
| OpenCode (glm-5.1) | Best practices audit | "best practice for this project?" | Applied security (no error leaking), type safety (discriminated unions, proper mongoose types), UX (search resets page, cache invalidation), DRY (withDB, zodErrorsToFieldErrors) | — |
| OpenCode (glm-5.1) | Tag entity removal | "do you think tags need separated entity for the app case?" | Agreed with analysis that separate Tag entity was over-engineering, removed it | — |
| OpenCode (glm-5.1) | Tag input UX | "the tag input should free text and searchable to add if exist" | Replaced multi-select with MUI Autocomplete freeSolo | — |

---

## 4. What I'd Improve Given More Time

1. **API integration tests** — Write vitest tests that spin up the in-memory MongoDB and test the full request/response cycle for each API route (create with duplicate title returns 400, search with tags filter works, etc.). Currently only Zod schemas and component rendering are tested.

2. **Loading and error states polish** — Add skeleton loaders for recipe cards, optimistic updates for create/delete, toast notifications for success/error instead of inline alerts, and a proper 404 page for recipe detail when ID doesn't exist.

3. **Recipe form UX** — Add step reordering (drag-to-reorder), ingredient unit suggestions (common units dropdown), and a "preview" mode before submission. Also client-side debounced title uniqueness check via API while typing.

---

## 5. Ambiguities I Encountered and How I Resolved Them

- **What was unclear**: The spec says "search should work across recipe content" without specifying which fields.
  - **Decision I made**: Search across `title`, `description`, `ingredients.name`, `steps`, and `tags` using `$or` with regex.
  - **Reasoning**: These are the user-visible content fields. Excluding `servings`, `prepMin`, `cookMin`, and `difficulty` since those are filter candidates, not free-text searchable content.

- **What was unclear**: "Filter recipes by tags (multi-select)" — should selecting multiple tags mean AND (recipe must have all selected tags) or OR (recipe must have at least one)?
  - **Decision I made**: AND semantics using MongoDB `$all`.
  - **Reasoning**: AND is more useful for narrowing down results. If you select "vegan" + "quick", you want vegan recipes that are also quick, not all vegan or all quick recipes.

- **What was unclear**: The spec says "title must be unique, case-insensitive and after trimming whitespace" but doesn't specify whether the stored title should preserve original casing or be lowercased.
  - **Decision I made**: Store the title as-is (preserving casing) but check uniqueness case-insensitively and after trimming.
  - **Reasoning**: Users expect "Classic Spaghetti" and "classic spaghetti" to conflict, but they'd want the title displayed as they typed it. Added `unique: true` on the Mongoose schema as a safety net for race conditions.

- **What was unclear**: "At least one component or integration test" — scope was unclear for what counts as integration vs unit.
  - **Decision I made**: Wrote 36 comprehensive Zod schema unit tests covering all business rules, plus 5 component rendering tests for `RecipeForm` (field rendering, ingredient/step add/remove). Skipped full integration tests due to time.
  - **Reasoning**: Zod schemas are the most critical business logic to test since they're the single enforcement point for 4 of the 5 business rules.

---

## 6. Changes I Made to Scaffold Config

- **File changed**: `package.json`
  - **What changed**: Added `@mui/icons-material@6` and `@testing-library/user-event` as dependencies.
  - **Reason**: `@mui/icons-material` provides icons used in the UI (Add, Delete, Edit, ArrowBack, Search). `@testing-library/user-event` was added for component interaction tests, though ultimately replaced with `fireEvent` for MUI compatibility.

- **File changed**: `src/lib/schemas/recipe.ts`
  - **What changed**: Split into two files — `recipe.ts` (Zod schemas + types, client-safe) and `recipe-model.ts` (Mongoose model, server-only). Enhanced Zod schemas with all 5 business rules. Added `RecipeUpdateSchema` for partial updates. Changed `RecipeDocumentSchema` from `.extend()` on a `ZodEffects` to a standalone `z.object()`.
  - **Reason**: Original file imported mongoose on the client side, causing "Cannot read properties of undefined (reading 'Recipe')" runtime error. The `.extend()` on `ZodEffects` would also fail at runtime.

- **File changed**: `src/lib/query-keys.ts`
  - **What changed**: Added `page` to `recipeKeys.list()` filter params and added `recipeKeys.tags()`.
  - **Reason**: Pagination support and tag list cache key.