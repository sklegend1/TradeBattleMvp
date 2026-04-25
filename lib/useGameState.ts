'use client';

import { useEffect, useState } from 'react';
import { GameState } from '@/lib/types';

export function useGameState(roomId: string, enabled: boolean = true) {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled || !roomId) {
      return;
    }

    const fetchGameState = async () => {
      try {
        const response = await fetch(
          `/api/state?roomId=${encodeURIComponent(roomId)}`
        );

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        setGameState(data.gameState);
        setError(null);
        setLoading(false);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Failed to fetch game state'
        );
        setLoading(false);
      }
    };

    // Fetch immediately
    fetchGameState();

    // Poll every second
    const interval = setInterval(fetchGameState, 1000);

    return () => clearInterval(interval);
  }, [roomId, enabled]);

  return { gameState, loading, error };
}
