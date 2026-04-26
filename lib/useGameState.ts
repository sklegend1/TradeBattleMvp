'use client';

import { useEffect, useRef, useState } from 'react';
import { GameState } from '@/lib/types';

export function useGameState(roomId: string, enabled: boolean = true) {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Cache serialized state so we only trigger re-renders when data actually changes
  const lastJson = useRef<string>('');

  useEffect(() => {
    if (!enabled || !roomId) {
      return;
    }

    // Reset on first enable
    setLoading(true);
    setError(null);
    lastJson.current = '';

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

        // Only re-render when state actually changed
        if (newJson !== lastJson.current) {
          lastJson.current = newJson;
          setGameState(data.gameState);
        }
        setError(null);
        setLoading(false);
      } catch (err) {
        // Preserve last known state on transient network errors
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
    };

    fetchGameState();
    const interval = setInterval(fetchGameState, 1000);
    return () => clearInterval(interval);
  }, [roomId, enabled]);

  return { gameState, loading, error };
}
