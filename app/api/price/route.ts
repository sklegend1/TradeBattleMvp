import { NextRequest, NextResponse } from 'next/server';
import { getBTCPrice } from '@/lib/priceService';

export async function GET(request: NextRequest) {
  try {
    const price = await getBTCPrice();
    return NextResponse.json({ success: true, price }, { status: 200 });
  } catch (error) {
    console.error('Error in GET /api/price:', error);
    return NextResponse.json(
      { error: 'Failed to fetch price' },
      { status: 500 }
    );
  }
}
