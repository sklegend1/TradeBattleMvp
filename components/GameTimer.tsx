'use client';

export function GameTimer({ remainingTime }: { remainingTime: number }) {
  const minutes = Math.floor(remainingTime / 1000 / 60);
  const seconds = Math.floor((remainingTime / 1000) % 60);

  const isWarning = remainingTime < 30000; // Less than 30 seconds
  const isEnded = remainingTime <= 0;

  return (
    <div
      className={`text-center ${
        isEnded
          ? 'text-red-400'
          : isWarning
          ? 'text-yellow-400 animate-pulse'
          : 'text-slate-300'
      }`}
    >
      <p className="text-sm font-medium">Time Remaining</p>
      <p className="text-3xl font-bold tabular-nums">
        {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
      </p>
      {isEnded && <p className="text-red-400 font-bold mt-1">Game Over!</p>}
    </div>
  );
}
