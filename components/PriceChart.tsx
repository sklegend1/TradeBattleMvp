'use client';

import { useEffect, useRef } from 'react';
import { createChart, AreaSeries, ColorType, UTCTimestamp, ISeriesApi } from 'lightweight-charts';

export function PriceChart({ price, timestamp }: { price: number; timestamp: number }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<ReturnType<typeof createChart> | null>(null);
  const seriesRef = useRef<ISeriesApi<'Area'> | null>(null);
  const dataRef = useRef<{ time: UTCTimestamp; value: number }[]>([]);

  useEffect(() => {
    if (!containerRef.current) return;

    const chart = createChart(containerRef.current, {
      layout: {
        textColor: '#9ca3af',
        background: { type: ColorType.Solid, color: '#1e293b' },
      },
      width: containerRef.current.clientWidth,
      height: 300,
      timeScale: {
        timeVisible: true,
        secondsVisible: true,
      },
      grid: {
        vertLines: { color: 'rgba(255,255,255,0.05)' },
        horzLines: { color: 'rgba(255,255,255,0.05)' },
      },
    });

    const series = chart.addSeries(AreaSeries, {
      lineColor: '#3b82f6',
      topColor: 'rgba(59,130,246,0.4)',
      bottomColor: 'rgba(59,130,246,0.0)',
      lineWidth: 2,
    });

    const initialData = { time: Math.floor(timestamp / 1000) as UTCTimestamp, value: price };
    series.setData([initialData]);
    chart.timeScale().fitContent();

    chartRef.current = chart;
    seriesRef.current = series;
    dataRef.current = [initialData];

    const handleResize = () => {
      if (containerRef.current && chartRef.current) {
        chartRef.current.applyOptions({ width: containerRef.current.clientWidth });
      }
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chartRef.current?.remove();
    };
  }, []);

  // Update price data on every new second
  useEffect(() => {
    if (!seriesRef.current || !dataRef.current.length) return;

    const timeInSeconds = Math.floor(timestamp / 1000) as UTCTimestamp;
    const last = dataRef.current[dataRef.current.length - 1];

    if (last.time === timeInSeconds) return; // same second, skip

    const newPoint = { time: timeInSeconds, value: price };
    dataRef.current.push(newPoint);

    // Keep at most 300 points (5 min at 1/sec)
    if (dataRef.current.length > 300) {
      dataRef.current = dataRef.current.slice(-300);
    }

    seriesRef.current.setData(dataRef.current);
    chartRef.current?.timeScale().fitContent();
  }, [price, timestamp]);

  return (
    <div
      ref={containerRef}
      className="w-full bg-slate-800 rounded-lg overflow-hidden border border-slate-700"
    />
  );
}
