async function reset() {
  const baseUrl = process.env.RESET_BASE_URL ?? 'http://localhost:3000';
  console.log('🔄 Calling reset API...');

  const res = await fetch(`${baseUrl}/api/admin/reset`, {
    method: 'POST',
    headers: { 'x-reset-secret': 'interview-reset' },
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Reset failed: ${res.status} ${body}`);
  }

  const data = (await res.json()) as { count: number };
  console.log(`✅ Reset complete — ${data.count} recipes ready.`);
  process.exit(0);
}

reset().catch((err) => {
  console.error('Reset failed (is pnpm dev running?):', err);
  process.exit(1);
});
