import { NextResponse } from 'next/server';

// Kraken OHLC — no API key, no US geo-block
// interval=1 → 1-minute candles, limit last 120 candles (2 hours of context)
const KRAKEN_URL =
  'https://api.kraken.com/0/public/OHLC?pair=XBTUSD&interval=1';

interface KrakenOHLC {
  error: string[];
  result: {
    XXBTZUSD: [number, string, string, string, string, string, string, number][];
    last: number;
  };
}

export interface Candle {
  time: number;   // Unix seconds (open time)
  open: number;
  high: number;
  low: number;
  close: number;
}

export async function GET() {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const res = await fetch(KRAKEN_URL, { signal: controller.signal, cache: 'no-store' });
    clearTimeout(timeout);

    if (!res.ok) throw new Error(`Kraken HTTP ${res.status}`);

    const data = (await res.json()) as KrakenOHLC;

    if (data.error?.length) throw new Error(data.error.join(', '));

    // Kraken row: [time, open, high, low, close, vwap, volume, count]
    const rows = data.result?.XXBTZUSD ?? [];

    const candles: Candle[] = rows.slice(-120).map((row) => ({
      time: row[0],
      open: parseFloat(row[1]),
      high: parseFloat(row[2]),
      low: parseFloat(row[3]),
      close: parseFloat(row[4]),
    }));

    return NextResponse.json({ candles }, { status: 200 });
  } catch (err) {
    console.error('[/api/candles] Error fetching Kraken OHLC:', err);
    // Return empty candles — chart will build from live ticks instead
    return NextResponse.json({ candles: [] }, { status: 200 });
  }
}
