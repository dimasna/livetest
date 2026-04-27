#!/usr/bin/env node
// Pre-download mongodb-memory-server binary so first `pnpm dev` doesn't download it
// Safe to fail (offline / CI environments)
async function preDownloadMongoBinary() {
  try {
    const { MongoMemoryServer } = await import('mongodb-memory-server');
    console.log('📦 Pre-downloading mongodb-memory-server binary...');
    const server = await MongoMemoryServer.create();
    await server.stop({ doCleanup: true });
    console.log('✅ mongodb-memory-server binary ready.');
  } catch (err) {
    console.warn('⚠️  Could not pre-download mongodb-memory-server binary (offline?). It will download on first `pnpm dev`.');
    // Always exit 0 - never block install
  }
}

preDownloadMongoBinary();
