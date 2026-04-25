// Production: CoinGecko and Coinbase are geo-unrestricted and free
const COINGECKO_URL = 'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd';
const COINBASE_URL = 'https://api.coinbase.com/v2/prices/BTC-USD/spot';

// Local dev: Binance via proxy (Binance blocks US IPs, proxy required locally)
//const BINANCE_PROXY_URL = 'http://127.0.0.1:10808/https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT';

async function fetchWithTimeout(url: string, timeoutMs = 5000): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { signal: controller.signal });
    return response;
  } finally {
    clearTimeout(timeout);
  }
}

async function fetchFromCoinGecko(): Promise<number> {
  const response = await fetchWithTimeout(COINGECKO_URL);
  if (!response.ok) throw new Error(`CoinGecko error: ${response.status}`);
  const data = (await response.json()) as { bitcoin: { usd: number } };
  const price = data?.bitcoin?.usd;
  if (!price || isNaN(price)) throw new Error('Invalid CoinGecko response');
  return price;
}

async function fetchFromCoinbase(): Promise<number> {
  const response = await fetchWithTimeout(COINBASE_URL);
  if (!response.ok) throw new Error(`Coinbase error: ${response.status}`);
  const data = (await response.json()) as { data: { amount: string } };
  const price = parseFloat(data?.data?.amount);
  if (isNaN(price)) throw new Error('Invalid Coinbase response');
  return price;
}

// async function fetchFromBinanceProxy(): Promise<number> {
//   const response = await fetchWithTimeout(BINANCE_PROXY_URL);
//   if (!response.ok) throw new Error(`Binance proxy error: ${response.status}`);
//   const data = (await response.json()) as { price: string };
//   const price = parseFloat(data.price);
//   if (isNaN(price)) throw new Error('Invalid Binance response');
//   return price;
// }

/**
 * Fetch current BTC/USD price.
 * - Local dev: Binance via local proxy → CoinGecko fallback → Coinbase fallback
 * - Production: CoinGecko → Coinbase fallback
 */
export async function getBTCPrice(): Promise<number> {
  const sources: Array<() => Promise<number>> =
    process.env.NODE_ENV === 'development'
      ? [ fetchFromCoinGecko, fetchFromCoinbase]
      : [fetchFromCoinGecko, fetchFromCoinbase];

  for (const source of sources) {
    try {
      return await source();
    } catch (err) {
      console.warn('Price source failed, trying next:', (err as Error).message);
    }
  }

  console.error('All price sources failed, returning fallback');
  return 0;
}
