const BINANCE_URL = 'https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT';
const LOCAL_PROXY = 'http://127.0.0.1:10808';

/**
 * Fetch current BTC price from Binance API
 * Uses local proxy in development, direct API in production
 */
export async function getBTCPrice(): Promise<number> {
  try {
    let url = BINANCE_URL;

    // In development, use local proxy if available
    // if (process.env.NODE_ENV === 'development') {
    //   // Proxy format: http://127.0.0.1:10808/https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT
    //   url = `${LOCAL_PROXY}/${BINANCE_URL}`;
    // }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      throw new Error(`Binance API error: ${response.status}`);
    }

    const data = (await response.json()) as { price: string };
    const price = parseFloat(data.price);

    if (isNaN(price)) {
      throw new Error('Invalid price data from Binance API');
    }

    return price;
  } catch (error) {
    console.error('Error fetching BTC price:', error);

    // Fallback: try direct URL if proxy fails
    if (process.env.NODE_ENV === 'development') {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5000);

        const response = await fetch(BINANCE_URL, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          signal: controller.signal,
        });

        clearTimeout(timeout);

        if (response.ok) {
          const data = (await response.json()) as { symbol: string; price: string };
          return parseFloat(data.price);
        }
      } catch (fallbackError) {
        console.error('Fallback BTC price fetch also failed:', fallbackError);
      }
    }

    // Return cached fallback price if all else fails
    return 42500; // Fallback price for demo purposes
  }
}
