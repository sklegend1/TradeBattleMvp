'use client';

import { memo, useEffect, useRef } from 'react';
import {
  createChart,
  CandlestickSeries,
  ColorType,
  UTCTimestamp,
  ISeriesApi,
  IPriceLine,
  LineStyle,
} from 'lightweight-charts';
import type { Candle } from '@/app/api/candles/route';

const LIVE_CANDLE_SECONDS = 5;

function liveTime(tsMs: number): UTCTimestamp {
  const sec = Math.floor(tsMs / 1000);
  return (Math.floor(sec / LIVE_CANDLE_SECONDS) * LIVE_CANDLE_SECONDS) as UTCTimestamp;
}

interface PriceChartProps {
  price: number;
  entryPrice?: number | null;
  positionType?: 'buy' | 'sell' | null;
}

export const PriceChart = memo(function PriceChart({ price, entryPrice, positionType }: PriceChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<ReturnType<typeof createChart> | null>(null);
  const seriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const allCandlesRef = useRef<Map<UTCTimestamp, Candle>>(new Map());
  const priceLineRef = useRef<IPriceLine | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const chart = createChart(containerRef.current, {
      layout: {
        textColor: '#9ca3af',
        background: { type: ColorType.Solid, color: '#1e293b' },
      },
      width: containerRef.current.clientWidth,
      height: 300,
      timeScale: { timeVisible: true, secondsVisible: false },
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

    chartRef.current = chart;
    seriesRef.current = series;

    fetch('/api/candles')
      .then((r) => r.json())
      .then(({ candles }: { candles: Candle[] }) => {
        if (!candles.length || !seriesRef.current) return;
        const map = new Map<UTCTimestamp, Candle>();
        for (const c of candles) {
          map.set(c.time as UTCTimestamp, c);
        }
        allCandlesRef.current = map;
        seriesRef.current.setData(candles.map((c) => ({ ...c, time: c.time as UTCTimestamp })));
        chartRef.current?.timeScale().fitContent();
      })
      .catch(() => {});

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

  useEffect(() => {
    const series = seriesRef.current;
    if (!series || price === 0) return;

    const t = liveTime(Date.now());
    const existing = allCandlesRef.current.get(t);

    if (existing) {
      existing.high = Math.max(existing.high, price);
      existing.low = Math.min(existing.low, price);
      existing.close = price;
      series.update({ ...existing, time: t });
    } else {
      const prev = [...allCandlesRef.current.values()].at(-1);
      const newCandle: Candle = {
        time: t as number,
        open: prev?.close ?? price,
        high: price,
        low: price,
        close: price,
      };
      allCandlesRef.current.set(t, newCandle);
      series.update({ ...newCandle, time: t });
    }
  }, [price]);

  useEffect(() => {
    const series = seriesRef.current;
    if (!series) return;

    if (priceLineRef.current) {
      series.removePriceLine(priceLineRef.current);
      priceLineRef.current = null;
    }

    if (entryPrice && entryPrice > 0) {
      priceLineRef.current = series.createPriceLine({
        price: entryPrice,
        color: positionType === 'sell' ? '#ef4444' : '#22c55e',
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
});
