/**
 * File-based persistent store for game state.
 *
 * Writes a single JSON file so state survives Lambda warm-instance restarts.
 * In-memory cache is kept for fast reads between writes.
 *
 * Location:
 *   - Vercel / production  → /tmp/tradebattle.json  (writable on all serverless runtimes)
 *   - Local development    → .tradebattle.json at project root (gitignored)
 */

import fs from 'fs';
import path from 'path';
import { Game } from './types';

const DB_PATH =
  process.env.DB_PATH ||
  (process.env.VERCEL
    ? '/tmp/tradebattle.json'
    : path.join(process.cwd(), '.tradebattle.json'));

// In-process cache — avoids re-reading the file on every call within the same instance
let _cache: Record<string, Game> | null = null;

function load(): Record<string, Game> {
  if (_cache !== null) return _cache;
  try {
    if (fs.existsSync(DB_PATH)) {
      const raw = fs.readFileSync(DB_PATH, 'utf8');
      _cache = JSON.parse(raw) as Record<string, Game>;
      return _cache;
    }
  } catch {
    // Corrupted file — start fresh
  }
  _cache = {};
  return _cache;
}

function persist(games: Record<string, Game>): void {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(games), 'utf8');
  } catch (err) {
    console.error('[fileStore] Failed to persist state:', err);
  }
}

export function getAllGames(): Record<string, Game> {
  return load();
}

export function readGame(id: string): Game | null {
  return load()[id] ?? null;
}

export function writeGame(game: Game): void {
  const games = load();
  games[game.id] = game;
  persist(games);
}

export function deleteGame(id: string): void {
  const games = load();
  delete games[id];
  persist(games);
}

export function deleteAllGames(): void {
  _cache = {};
  persist({});
}
