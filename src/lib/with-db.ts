import { type NextRequest, NextResponse } from 'next/server';

type Handler = (request: NextRequest, context: { params: Promise<Record<string, string>> }) => Promise<NextResponse>;

export function withDB(handler: Handler): Handler {
  return async (request, context) => {
    try {
      const { connectDB } = await import('@/lib/db');
      await connectDB();
      return await handler(request, context);
    } catch (err) {
      console.error('[API Error]', err);
      const message = err instanceof Error && err.message.includes('duplicate key')
        ? 'A record with this name already exists'
        : 'Internal server error';
      return NextResponse.json({ error: message }, { status: 500 });
    }
  };
}