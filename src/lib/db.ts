import mongoose from 'mongoose';
import { startMemoryMongo } from './mongo-memory';

type MongooseCache = {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
};

// HMR-safe global caching
declare global {
  // eslint-disable-next-line no-var
  var __mongoose__: MongooseCache | undefined;
}

const cached: MongooseCache = global.__mongoose__ ?? { conn: null, promise: null };
global.__mongoose__ = cached;

export async function connectDB(): Promise<typeof mongoose> {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    cached.promise = startMemoryMongo().then((uri) =>
      mongoose.connect(uri, {
        bufferCommands: false,
      })
    );
  }

  cached.conn = await cached.promise;
  return cached.conn;
}
