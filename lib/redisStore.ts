/**
 * Shared game state storage.
 *
 * Production (Vercel): Upstash Redis via REST — shared across all Lambda instances.
 *   Set env vars: UPSTASH_REDIS_REST_URL  UPSTASH_REDIS_REST_TOKEN
 *   Free tier at https://upstash.com
 *
 * Local dev (no env vars): falls back to a module-level in-memory Map.
 */

import { Redis } from '@upstash/redis';
import { Game } from './types';

const KEY_PREFIX = 'tradebattle:game:';
const TTL_SECONDS = 2 * 60 * 60; // 2 hours

// ── In-memory fallback (used when Upstash env vars are absent) ──
const memStore = new Map<string, Game>();

// ── Redis client (lazy singleton) ───────────────────────────────
let _redis: Redis | null = null;
function getRedis(): Redis | null {
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    if (process.env.NODE_ENV === 'production') {
      console.warn(
        '[redisStore] UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN not set. ' +
        'Falling back to in-memory store — state will NOT be shared across Lambda instances. ' +
        'Set env vars in Vercel dashboard: https://upstash.com'
      );
    }
    return null;
  }
  if (!_redis) {
    _redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
  }
  return _redis;
}

// ── Public API ──────────────────────────────────────────────────
export async function readGame(id: string): Promise<Game | null> {
  const redis = getRedis();
  if (!redis) return memStore.get(id) ?? null;

  const data = await redis.get<Game>(`${KEY_PREFIX}${id}`);
  return data ?? null;
}

export async function writeGame(game: Game): Promise<void> {
  const redis = getRedis();
  if (!redis) {
    memStore.set(game.id, game);
    return;
  }
  await redis.set(`${KEY_PREFIX}${game.id}`, game, { ex: TTL_SECONDS });
}

export async function deleteGame(id: string): Promise<void> {
  const redis = getRedis();
  if (!redis) {
    memStore.delete(id);
    return;
  }
  await redis.del(`${KEY_PREFIX}${id}`);
}

export async function deleteAllGames(): Promise<void> {
  const redis = getRedis();
  if (!redis) {
    memStore.clear();
    return;
  }
  // Scan and delete all game keys (only used in tests / reset)
  let cursor: string | number = 0;
  do {
    const scanResult: [string | number, string[]] = await redis.scan(cursor, {
      match: `${KEY_PREFIX}*`,
      count: 100,
    });
    const [newCursor, keys] = scanResult;
    cursor = newCursor;
    if (keys.length > 0) await redis.del(...keys);
  } while (cursor !== 0);
}
