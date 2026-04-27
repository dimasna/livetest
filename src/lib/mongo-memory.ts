import { MongoMemoryServer } from 'mongodb-memory-server';

// HMR-safe: keep server across hot-module-reloads
declare global {
  // eslint-disable-next-line no-var
  var __mongoMemoryServer__: MongoMemoryServer | undefined;
}

export async function startMemoryMongo(): Promise<string> {
  if (global.__mongoMemoryServer__) {
    return global.__mongoMemoryServer__.getUri();
  }
  const server = await MongoMemoryServer.create();
  global.__mongoMemoryServer__ = server;
  return server.getUri();
}

export async function stopMemoryMongo(): Promise<void> {
  if (global.__mongoMemoryServer__) {
    await global.__mongoMemoryServer__.stop();
    global.__mongoMemoryServer__ = undefined;
  }
}
