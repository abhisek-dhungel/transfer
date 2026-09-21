// lib/rate-limit.ts
// IP-based rate limiter.
// In production, set UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN for Upstash Redis.
// Without those vars, falls back to a simple in-memory map (dev only – resets on restart).

import type { NextRequest } from 'next/server';

type RLRecord = { count: number; reset: number };
const store = new Map<string, RLRecord>();

const MAX = Number(process.env.RATE_LIMIT_MAX || 5);
const WINDOW = Number(process.env.RATE_LIMIT_WINDOW || 3600); // seconds

interface RLResult {
  success: boolean;
  remaining: number;
}

export async function checkRateLimit(ip: string): Promise<RLResult> {
  // ---------- Upstash Redis (production) ----------
  if (
    process.env.UPSTASH_REDIS_REST_URL &&
    process.env.UPSTASH_REDIS_REST_TOKEN
  ) {
    const key = `rl:${ip}`;
    const url = `${process.env.UPSTASH_REDIS_REST_URL}/pipeline`;
    const pipeline = [
      ['INCR', key],
      ['EXPIRE', key, String(WINDOW)],
    ];
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.UPSTASH_REDIS_REST_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(pipeline),
    });
    const json = await res.json();
    const count: number = (json[0]?.result as number) ?? 1;
    return { success: count <= MAX, remaining: Math.max(0, MAX - count) };
  }

  // ---------- In-memory fallback (dev) ----------
  const now = Math.floor(Date.now() / 1000);
  const rec = store.get(ip) ?? { count: 0, reset: now + WINDOW };
  if (now > rec.reset) {
    rec.count = 0;
    rec.reset = now + WINDOW;
  }
  rec.count++;
  store.set(ip, rec);
  return { success: rec.count <= MAX, remaining: Math.max(0, MAX - rec.count) };
}

export function getIP(request: Request | NextRequest): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown'
  );
}
