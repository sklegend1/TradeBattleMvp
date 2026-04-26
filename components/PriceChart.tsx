'use client';

import { useEffect, useRef } from 'react';
import {
  createChart,
  CandlestickSeries,
  ColorType,
  UTCTimestamp,
  ISeriesApi,
  IPriceLine,
  LineStyle,
} from 'lightweight-charts';

interface Candle {
  time: UTCTimestamp;
  open: number;
  high: number;
  low: number;
  close: number;
}

// Aggregate 1-second ticks into N-second candles
const CANDLE_SECONDS = 5;

function candleTime(ts: number): UTCTimestamp {
  const sec = Math.floor(ts / 1000);
  return (Math.floor(sec / CANDLE_SECONDS) * CANDLE_SECONDS) as UTCTimestamp;
}

interface PriceChartProps {
  price: number;
  timestamp: number;
  entryPrice?: number | null;
  positionType?: 'buy' | 'sell' | null;
}

export function PriceChart({ price, timestamp, entryPrice, positionType }: PriceChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<ReturnType<typeof createChart> | null>(null);
  const seriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const candlesRef = useRef<Map<UTCTimestamp, Candle>>(new Map());
  const priceLineRef = useRef<IPriceLine | null>(null);

  // ── Init chart once ──────────────────────────────────────────
  useEffect(() => {
    if (!containerRef.current) return;

    const chart = createChart(containerRef.current, {
      layout: {
        textColor: '#9ca3af',
        background: { type: ColorType.Solid, color: '#1e293b' },
      },
      width: containerRef.current.clientWidth,
      height: 300,
      timeScale: { timeVisible: true, secondsVisible: true },
      grid: {
        vertLines: { color: 'rgba(255,255,255,0.05)' },
        horzLines: { color: 'rgba(255,255,255,0.05)' },
      },
    });

    const series = chart.addSeries(CandlestickSeries, {
      upColor: '#22c55e',
      downColor: '#ef4444',
      borderUpColor: '#22c55e',
      borderDownColor: '#ef4444',
      wickUpColor: '#22c55e',
      wickDownColor: '#ef4444',
    });

    // Seed with the very first candle
    const t = candleTime(timestamp);
    const seed: Candle = { time: t, open: price, high: price, low: price, close: price };
    candlesRef.current.set(t, seed);
    series.setData([seed]);
    chart.timeScale().fitContent();

    chartRef.current = chart;
    seriesRef.current = series;

    const handleResize = () => {
      if (containerRef.current && chartRef.current) {
        chartRef.current.applyOptions({ width: containerRef.current.clientWidth });
      }
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chartRef.current?.remove();
      chartRef.current = null;
      seriesRef.current = null;
      priceLineRef.current = null;
    };
  }, []);

  // ── Update candles on every price tick ──────────────────────
  useEffect(() => {
    const series = seriesRef.current;
    if (!series || price === 0) return;

    const t = candleTime(timestamp);
    const existing = candlesRef.current.get(t);

    if (existing) {
      // Update current candle's high / low / close
      existing.high = Math.max(existing.high, price);
      existing.low = Math.min(existing.low, price);
      existing.close = price;
      series.update(existing);
    } else {
      // New candle — open equals previous close
      const prev = [...candlesRef.current.values()].at(-1);
      const newCandle: Candle = {
        time: t,
        open: prev?.close ?? price,
        high: price,
        low: price,
        close: price,
      };
      candlesRef.current.set(t, newCandle);

      // Keep at most 60 candles (5 min at 5 sec/candle)
      if (candlesRef.current.size > 60) {
        const firstKey = candlesRef.current.keys().next().value as UTCTimestamp;
        candlesRef.current.delete(firstKey);
      }

      series.setData([...candlesRef.current.values()]);
      chartRef.current?.timeScale().fitContent();
    }
  }, [price, timestamp]);

  // ── Entry price line ─────────────────────────────────────────
  useEffect(() => {
    const series = seriesRef.current;
    if (!series) return;

    // Remove existing line
    if (priceLineRef.current) {
      series.removePriceLine(priceLineRef.current);
      priceLineRef.current = null;
    }

    if (entryPrice && entryPrice > 0) {
      const color = positionType === 'sell' ? '#ef4444' : '#22c55e';
      priceLineRef.current = series.createPriceLine({
        price: entryPrice,
        color,
        lineWidth: 1,
        lineStyle: LineStyle.Dashed,
        axisLabelVisible: true,
        title: positionType === 'sell' ? 'SHORT' : 'LONG',
      });
    }
  }, [entryPrice, positionType]);

  return (
    <div
      ref={containerRef}
      className="w-full bg-slate-800 rounded-lg overflow-hidden border border-slate-700"
    />
  );
}
