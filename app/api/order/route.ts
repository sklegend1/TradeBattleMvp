import { NextRequest, NextResponse } from 'next/server';
import { updatePlayerPosition, getGame } from '@/lib/gameStore';
import { getBTCPrice } from '@/lib/priceService';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { roomId, player, type } = body;

    if (!roomId || !player || !type) {
      return NextResponse.json(
        { error: 'roomId, player, and type are required' },
        { status: 400 }
      );
    }

    if (type !== 'buy' && type !== 'sell') {
      return NextResponse.json(
        { error: 'type must be "buy" or "sell"' },
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

    if (playerObj.position) {
      return NextResponse.json(
        { error: 'Player already has an open position' },
        { status: 400 }
      );
    }

    // Fetch current BTC price
    const currentPrice = await getBTCPrice();

    // Create position
    const position = {
      type: type as 'buy' | 'sell',
      entryPrice: currentPrice,
      openTime: Date.now(),
    };

    const result = await updatePlayerPosition(roomId, player as '1' | '2', position);

    if (!result.success) {
      return NextResponse.json(
        { error: result.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: true, game: result.game, currentPrice },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error in POST /api/order:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
