export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { connectDB } = await import('./lib/db');
    const { RecipeModel } = await import('./lib/recipe-model');
    const { TagModel } = await import('./lib/tag-model');
    const { seed } = await import('../scripts/seed');
    try {
      await connectDB();
      // Ensure indexes are created (including unique index on tag name)
      await TagModel.createIndexes();
      const count = await RecipeModel.countDocuments();
      if (count === 0) {
        console.log('[db] No recipes found — seeding...');
        await seed();
        console.log('[db] Seeded successfully');
      } else {
        console.log(`[db] Connected (${count} recipes ready)`);
      }
    } catch (err) {
      console.error('[db] Startup error:', err);
    }
  }
}
