import { NextRequest, NextResponse } from 'next/server';
import { getGameState } from '@/lib/gameStore';

const WAITING_STATE = (roomId: string) => ({
  id: roomId,
  players: { '1': null, '2': null },
  status: 'waiting' as const,
  startTime: null,
  duration: 5 * 60 * 1000,
  remainingTime: 5 * 60 * 1000,
});

export async function GET(request: NextRequest) {
  try {
    const roomId = request.nextUrl.searchParams.get('roomId');

    if (!roomId) {
      return NextResponse.json(
        { error: 'roomId is required' },
        { status: 400 }
      );
    }

    const gameState = await getGameState(roomId);

    // Never return 404 — if the game record is absent on this Lambda instance
    // (happens when Redis is not configured and the join hit a different instance),
    // return a synthetic "waiting" state so the client keeps polling gracefully.
    return NextResponse.json(
      { success: true, gameState: gameState ?? WAITING_STATE(roomId) },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error in GET /api/state:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
