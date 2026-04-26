import { NextRequest, NextResponse } from 'next/server';
import { getOrCreateGame } from '@/lib/gameStore';

export async function GET(request: NextRequest) {
  try {
    const roomId = request.nextUrl.searchParams.get('roomId');

    if (!roomId) {
      return NextResponse.json(
        { error: 'roomId is required' },
        { status: 400 }
      );
    }

    const game = await getOrCreateGame(roomId);

    return NextResponse.json({ success: true, game }, { status: 200 });
  } catch (error) {
    console.error('Error in GET /api/game:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
