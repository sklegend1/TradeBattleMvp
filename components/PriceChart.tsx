'use client';

import { useEffect, useRef } from 'react';
import { createChart } from 'lightweight-charts';

export function PriceChart({ price, timestamp }: { price: number; timestamp: number }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<any>(null);
  const seriesRef = useRef<any>(null);
  const dataRef = useRef<any[]>([]);

  useEffect(() => {
    if (!containerRef.current) return;

    try {
      // Initialize chart
      const chart = createChart(containerRef.current, {
        layout: {
          textColor: '#9ca3af',
          background: { color: '#1e293b' },
        },
        width: containerRef.current.clientWidth,
        height: 300,
        timeScale: {
          timeVisible: true,
          secondsVisible: true,
        },
      });

      // Try multiple methods - addSeries is the generic method
      const series = (chart as any).addSeries?.({
        lineColor: '#3b82f6',
        topColor: '#3b82f6',
        bottomColor: 'rgba(59, 130, 246, 0.1)',
      }) || (chart as any).addArea?.() || (chart as any).addLine?.();

      if (!series) {
        console.error('Could not create series');
        chart.remove();
        return;
      }

      const initialData = {
        time: Math.floor(timestamp / 1000),
        value: price,
      };

      series.setData([initialData]);
      chart.timeScale().fitContent();

      chartRef.current = chart;
      seriesRef.current = series;
      dataRef.current = [initialData];

      const handleResize = () => {
        if (containerRef.current && chartRef.current) {
          chartRef.current.applyOptions({
            width: containerRef.current.clientWidth,
          });
        }
      };

      window.addEventListener('resize', handleResize);

      return () => {
        window.removeEventListener('resize', handleResize);
        if (chartRef.current) {
          chartRef.current.remove();
        }
      };
    } catch (err) {
      console.error('Error initializing chart:', err);
    }
  }, []);

  // Update price data
  useEffect(() => {
    if (!seriesRef.current || !dataRef.current || !chartRef.current) return;

    try {
      const timeInSeconds = Math.floor(timestamp / 1000);

      // Only add new data if it's from a new second
      const lastData = dataRef.current[dataRef.current.length - 1];
      if (lastData.time !== timeInSeconds) {
        const newData = {
          time: timeInSeconds,
          value: price,
        };

        dataRef.current.push(newData);

        // Keep only last 300 data points (5 minutes of data at 1/sec)
        if (dataRef.current.length > 300) {
          dataRef.current = dataRef.current.slice(-300);
        }

        seriesRef.current.setData(dataRef.current);
        chartRef.current.timeScale().fitContent();
      }
    } catch (err) {
      console.error('Error updating chart:', err);
    }
  }, [price, timestamp]);

  return (
    <div
      ref={containerRef}
      className="w-full bg-slate-800 rounded-lg overflow-hidden border border-slate-700"
    />
  );
}
