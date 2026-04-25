'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();
  const [roomId, setRoomId] = useState('');
  const [selectedPlayer, setSelectedPlayer] = useState<'1' | '2'>('1');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleJoinGame = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (!roomId.trim()) {
        throw new Error('Please enter a room ID');
      }

      // Validate room ID
      if (!/^[a-zA-Z0-9-]{3,20}$/.test(roomId)) {
        throw new Error(
          'Room ID must be 3-20 characters, alphanumeric with hyphens only'
        );
      }

      // Redirect to game page
      router.push(`/game/${roomId}?player=${selectedPlayer}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-slate-700/50 backdrop-blur-sm border border-slate-600 rounded-lg shadow-2xl p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-white mb-2">
              🚀 Trade Battle
            </h1>
            <p className='text-base text-slate-400'>Just a MVP By S.Kheirkhah</p>
            <p className="text-slate-300">
              2-Player Crypto Trading Game
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleJoinGame} className="space-y-6">
            {/* Room ID Input */}
            <div>
              <label htmlFor="roomId" className="block text-sm font-medium text-slate-200 mb-2">
                Room ID
              </label>
              <input
                id="roomId"
                type="text"
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
                placeholder="e.g., room-battle-1"
                className="w-full px-4 py-2 bg-slate-800 border border-slate-500 text-white rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 placeholder-slate-400"
                disabled={loading}
              />
              <p className="text-xs text-slate-400 mt-1">
                3-20 characters, alphanumeric with hyphens
              </p>
            </div>

            {/* Player Selection */}
            <div>
              <label className="block text-sm font-medium text-slate-200 mb-3">
                Select Your Player
              </label>
              <div className="flex gap-4">
                {(['1', '2'] as const).map((player) => (
                  <button
                    key={player}
                    type="button"
                    onClick={() => setSelectedPlayer(player)}
                    className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all ${
                      selectedPlayer === player
                        ? 'bg-blue-600 text-white shadow-lg'
                        : 'bg-slate-600 text-slate-200 hover:bg-slate-500'
                    }`}
                    disabled={loading}
                  >
                    Player {player}
                  </button>
                ))}
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-900/30 border border-red-700 rounded-lg p-3 text-red-200 text-sm">
                {error}
              </div>
            )}

            {/* Join Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:from-slate-600 disabled:to-slate-600 text-white font-bold py-3 rounded-lg transition-all shadow-lg"
            >
              {loading ? 'Joining...' : 'Join Game'}
            </button>
          </form>

          {/* Info */}
          <div className="mt-8 pt-6 border-t border-slate-600">
            <p className="text-xs text-slate-400 text-center">
              💡 Share the room ID with your friend to trade together.<br />
              Game starts automatically when both players join.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
