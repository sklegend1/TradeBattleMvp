'use client';

import { Position } from '@/lib/types';

export function PositionDisplay({
  position,
  currentPrice,
}: {
  position: Position | null;
  currentPrice: number | null;
}) {
  if (!position || currentPrice === null) {
    return (
      <div className="bg-slate-700/50 border border-slate-600 rounded-lg p-4 text-center">
        <p className="text-slate-400">No active position</p>
      </div>
    );
  }

  const SIZE = 1;
  const pnl =
    position.type === 'buy'
      ? (currentPrice - position.entryPrice) * SIZE
      : (position.entryPrice - currentPrice) * SIZE;

  const pnlPercent = ((pnl / position.entryPrice) * 100).toFixed(2);
  const isProfit = pnl >= 0;

  return (
    <div className="bg-gradient-to-r from-slate-700/50 to-slate-600/50 border border-slate-600 rounded-lg p-4 space-y-3">
      <div className="flex justify-between items-center">
        <span className="text-slate-300">Position Type:</span>
        <span
          className={`font-bold px-3 py-1 rounded ${
            position.type === 'buy'
              ? 'bg-green-900/30 text-green-400'
              : 'bg-red-900/30 text-red-400'
          }`}
        >
          {position.type.toUpperCase()}
        </span>
      </div>

      <div className="flex justify-between items-center">
        <span className="text-slate-300">Entry Price:</span>
        <span className="text-white font-mono">
          ${position.entryPrice.toFixed(2)}
        </span>
      </div>

      <div className="flex justify-between items-center">
        <span className="text-slate-300">Current Price:</span>
        <span className="text-white font-mono">
          ${currentPrice.toFixed(2)}
        </span>
      </div>

      <div className="border-t border-slate-600 pt-3 flex justify-between items-center">
        <span className="text-slate-300">Unrealized PnL:</span>
        <div className="flex flex-col items-end">
          <span
            className={`font-bold text-lg font-mono ${
              isProfit ? 'text-green-400' : 'text-red-400'
            }`}
          >
            {isProfit ? '+' : ''}${pnl.toFixed(2)}
          </span>
          <span className={`text-sm ${isProfit ? 'text-green-400' : 'text-red-400'}`}>
            {isProfit ? '+' : ''}{pnlPercent}%
          </span>
        </div>
      </div>
    </div>
  );
}
