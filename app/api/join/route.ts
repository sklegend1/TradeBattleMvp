import { NextRequest, NextResponse } from 'next/server';
import { joinGame } from '@/lib/gameStore';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { roomId, player } = body;

    if (!roomId) {
      return NextResponse.json(
        { error: 'roomId is required' },
        { status: 400 }
      );
    }

    if (player !== '1' && player !== '2') {
      return NextResponse.json(
        { error: 'player must be "1" or "2"' },
        { status: 400 }
      );
    }

    const result = await joinGame(roomId, player);

    if (!result.success) {
      return NextResponse.json(
        { error: result.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: true, game: result.game },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error in POST /api/join:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
