import { NextRequest, NextResponse } from 'next/server';
import { getGameState } from '@/lib/gameStore';

export async function GET(request: NextRequest) {
  try {
    const roomId = request.nextUrl.searchParams.get('roomId');

    if (!roomId) {
      return NextResponse.json(
        { error: 'roomId is required' },
        { status: 400 }
      );
    }

    const gameState = getGameState(roomId);

    if (!gameState) {
      return NextResponse.json(
        { error: 'Game not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, gameState }, { status: 200 });
  } catch (error) {
    console.error('Error in GET /api/state:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
