'use client';

import { useEffect, useRef, useState } from 'react';
import { GameState } from '@/lib/types';

export function useGameState(roomId: string, enabled: boolean = true) {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const lastJson = useRef<string>('');
  // Only surface an error after this many consecutive failures
  const failCount = useRef(0);
  const ERROR_THRESHOLD = 5;

  useEffect(() => {
    if (!enabled || !roomId) {
      return;
    }

    setLoading(true);
    setError(null);
    lastJson.current = '';
    failCount.current = 0;

    const fetchGameState = async () => {
      try {
        const response = await fetch(
          `/api/state?roomId=${encodeURIComponent(roomId)}`
        );

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        const newJson = JSON.stringify(data.gameState);

        failCount.current = 0;
        if (newJson !== lastJson.current) {
          lastJson.current = newJson;
          setGameState(data.gameState);
        }
        setError(null);
        setLoading(false);
      } catch (err) {
        failCount.current += 1;
        // Only show the error UI after ERROR_THRESHOLD consecutive failures.
        // This silently absorbs transient 404s that happen when Lambda
        // instances haven't shared state yet (no Redis configured).
        if (failCount.current >= ERROR_THRESHOLD) {
          setGameState((prev) => {
            if (prev === null) {
              setError(
                err instanceof Error ? err.message : 'Failed to fetch game state'
              );
              setLoading(false);
            }
            return prev;
          });
        }
        // Otherwise keep loading silently
      }
    };

    fetchGameState();
    const interval = setInterval(fetchGameState, 1000);
    return () => clearInterval(interval);
  }, [roomId, enabled]);

  return { gameState, loading, error };
}
