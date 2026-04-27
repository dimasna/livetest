# Recipe Manager — Candidate Brief

## Time Budget

You have **2 hours**.

Suggested split:

- ~15 min — read this brief and explore the scaffold
- ~90 min — implement the feature
- ~15 min — complete `REFLECTION.md`

---

## Overview

Build a **Recipe Manager** application. Users should be able to browse, search, filter, create, edit, and delete recipes.

---

## Setup

Prerequisites: Node 20+, pnpm 9+

```bash
pnpm install   # first run downloads mongodb-memory-server (~150 MB), requires internet
pnpm dev       # starts Next.js with embedded MongoDB at http://localhost:3000
```

If you get into a bad state: `pnpm reset` restores the database to its original 100-recipe state.

---

## Scaffold

The following is already wired up for you:

- **Next.js 15** (App Router) — `src/app/`
- **MUI v6** — theme, providers, CssBaseline
- **React Query v5** — QueryClientProvider configured
- **mongoose + mongodb-memory-server** — embedded DB, starts with `pnpm dev`
- **zod** — schema definitions in `src/lib/schemas/recipe.ts`
- **vitest** — configured with in-memory MongoDB for tests

**Look at the example before you start.** An example of how this scaffold is meant to be used (list + quick-add form) lives at `/recipes-example`. Read the source code before building your own feature:

- `src/app/recipes-example/page.tsx` — example page
- `src/app/api/recipes/example/route.ts` — example API route
- `src/lib/` — utilities and conventions

Follow the patterns you see there in your own implementation.

---

## Recipe Schema

Each recipe has:

| Field         | Type                           | Notes                                                          |
| ------------- | ------------------------------ | -------------------------------------------------------------- |
| `title`       | `string`                       |                                                                |
| `description` | `string`                       |                                                                |
| `servings`    | `number` (integer)             |                                                                |
| `prepMin`     | `number` (minutes)             |                                                                |
| `cookMin`     | `number` (minutes)             |                                                                |
| `difficulty`  | `"easy" \| "medium" \| "hard"` |                                                                |
| `tags`        | `string[]`                     |                                                                |
| `ingredients` | `{ name, qty, unit }[]`        | `unit` is a field for the measurement unit (e.g., g, ml, cups) |
| `steps`       | `string[]`                     | ordered                                                        |

---

## What to Build

### 1. Recipe List

- Display recipes in a paginated or scrollable list
- Include title, difficulty, tags, and total time (prep + cook)
- Search recipes by keyword. Search should work across recipe content.
- Filter recipes by tags (multi-select) and by difficulty

### 2. Recipe Detail

- Show all recipe fields when a recipe is selected or navigated to

### 3. Create / Edit Recipe

- Form to create a new recipe (all schema fields)
- Form to edit an existing recipe
- Both forms must enforce the business rules below

### 4. Delete Recipe

- Allow the user to delete a recipe
- Include a confirmation step before deletion

---

## Business Rules

These rules MUST be enforced on **both** client (zod validation) and server (validate at the API boundary):

1. **Title must be unique** — case-insensitive and after trimming whitespace
2. **Total time must be valid** — `prepMin + cookMin` must be greater than 0 and at most 1440 minutes (24 hours)
3. **Ingredients** — no duplicate ingredient names (case-insensitive); minimum 1 ingredient, maximum 50
4. **Tags** — maximum 5 tags; each tag must be 2–20 characters matching `^[a-z0-9-]+$`
5. **Steps** — each step must be 5–500 characters; maximum 30 steps

---

## Testing

Write vitest tests for:

- Your zod validation logic (business rules above)
- At least one component or integration test

You don't need 100% coverage. Show that you understand which parts are critical to test.

---

## What We Expect

- Working feature that covers the requirements above
- Code that follows the patterns shown in `/recipes-example`
- Business rules enforced on both client and server
- Tests for the important parts
- A completed `REFLECTION.md` (required — see template)

You may use any AI tool or agent. You **must** disclose AI usage in `REFLECTION.md`.

---

## Constraints

Please do **not** modify the following without documenting your reason in `REFLECTION.md`:

- `tsconfig.json` compiler flags
- `eslint` configuration
- `next.config.ts` settings

Adding new `npm` packages is fine — document why in `REFLECTION.md`.

---

## Delivery

Open a pull request from your fork (or push your changes to a new branch) with your implementation. Ensure `pnpm install && pnpm dev` works from a fresh clone of your submission.
