import { NextRequest, NextResponse } from 'next/server';
import { closePosition, getGame } from '@/lib/gameStore';
import { getBTCPrice } from '@/lib/priceService';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { roomId, player } = body;

    if (!roomId || !player) {
      return NextResponse.json(
        { error: 'roomId and player are required' },
        { status: 400 }
      );
    }

    const game = await getGame(roomId);
    if (!game) {
      return NextResponse.json(
        { error: 'Game not found' },
        { status: 404 }
      );
    }

    const playerObj = game.players[player as '1' | '2'];
    if (!playerObj) {
      return NextResponse.json(
        { error: 'Player not found' },
        { status: 404 }
      );
    }

    if (!playerObj.position) {
      return NextResponse.json(
        { error: 'No active position to close' },
        { status: 400 }
      );
    }

    // Fetch current BTC price
    const currentPrice = await getBTCPrice();

    // Close position and calculate PnL
    const result = await closePosition(roomId, player as '1' | '2', currentPrice);

    if (!result.success) {
      return NextResponse.json(
        { error: result.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        pnl: result.pnl,
        currentPrice,
        game: result.game,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error in POST /api/close:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
