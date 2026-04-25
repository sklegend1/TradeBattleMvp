'use client';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { useEffect, useState, use } from 'react';
import { useSearchParams } from 'next/navigation';
import { useGameState } from '@/lib/useGameState';
import { GameTimer } from '@/components/GameTimer';
import { PositionDisplay } from '@/components/PositionDisplay';
import { PriceChart } from '@/components/PriceChart';

export default function GamePage({
  params,
}: {
  params: Promise<{
    roomId: string;
  }>;
}) {
  const resolvedParams = use(params);
  const searchParams = useSearchParams();
  const playerNumber = (searchParams.get('player') || '1') as '1' | '2';
  const roomId = resolvedParams.roomId;

  const { gameState, loading, error } = useGameState(roomId, true);
  const [currentPrice, setCurrentPrice] = useState<number | null>(null);
  const [priceLoadingError, setPriceLoadingError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<'success' | 'error' | null>(null);

  // Fetch initial join
  useEffect(() => {
    const joinGame = async () => {
      try {
        const response = await fetch('/api/join', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            roomId,
            player: playerNumber,
          }),
        });

        if (!response.ok) {
          const data = await response.json();
          setActionMessage(data.error || 'Failed to join game');
          setMessageType('error');
        }
      } catch (err) {
        setActionMessage(
          err instanceof Error ? err.message : 'Failed to join game'
        );
        setMessageType('error');
      }
    };

    joinGame();
  }, [roomId, playerNumber]);

  // Fetch current price separately
  useEffect(() => {
    const fetchPrice = async () => {
      try {
        const response = await fetch('/api/price');
        if (!response.ok) {
          throw new Error('Failed to fetch price');
        }
        const data = await response.json();
        setCurrentPrice(data.price);
        setPriceLoadingError(null);
      } catch (err) {
        setPriceLoadingError('Unable to fetch BTC price');
        console.error('Price fetch error:', err);
      }
    };

    // Fetch immediately
    fetchPrice();

    // Poll every second
    const interval = setInterval(fetchPrice, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleBuy = async () => {
    setActionLoading(true);
    try {
      const response = await fetch('/api/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId,
          player: playerNumber,
          type: 'buy',
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to place buy order');
      }

      setActionMessage('Buy position opened! 🎯');
      setMessageType('success');
      setTimeout(() => setActionMessage(null), 3000);
    } catch (err) {
      setActionMessage(err instanceof Error ? err.message : 'Failed to buy');
      setMessageType('error');
      setTimeout(() => setActionMessage(null), 3000);
    } finally {
      setActionLoading(false);
    }
  };

  const handleSell = async () => {
    setActionLoading(true);
    try {
      const response = await fetch('/api/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId,
          player: playerNumber,
          type: 'sell',
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to place sell order');
      }

      setActionMessage('Sell position opened! 🎯');
      setMessageType('success');
      setTimeout(() => setActionMessage(null), 3000);
    } catch (err) {
      setActionMessage(err instanceof Error ? err.message : 'Failed to sell');
      setMessageType('error');
      setTimeout(() => setActionMessage(null), 3000);
    } finally {
      setActionLoading(false);
    }
  };

  const handleClose = async () => {
    setActionLoading(true);
    try {
      const response = await fetch('/api/close', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId,
          player: playerNumber,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to close position');
      }

      const data = await response.json();
      const pnl = data.pnl;
      setActionMessage(
        pnl >= 0
          ? `Position closed! Profit: $${pnl.toFixed(2)} 📈`
          : `Position closed! Loss: $${pnl.toFixed(2)} 📉`
      );
      setMessageType('success');
      setTimeout(() => setActionMessage(null), 3000);
    } catch (err) {
      setActionMessage(err instanceof Error ? err.message : 'Failed to close');
      setMessageType('error');
      setTimeout(() => setActionMessage(null), 3000);
    } finally {
      setActionLoading(false);
    }
  };

  const player = gameState?.players[playerNumber];
  const opponent = gameState?.players[playerNumber === '1' ? '2' : '1'];
  const isGameOver = gameState?.status === 'finished';
  const winner =
    isGameOver && gameState?.players['1'] && gameState?.players['2']
      ? gameState.players['1'].balance > gameState.players['2'].balance
        ? '1'
        : '2'
      : null;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border b-blue-500 border-t-blue-500 mx-auto mb-4"></div>
          <p className="text-slate-300">Loading game...</p>
        </div>
      </div>
    );
  }

  if (error || !gameState) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center p-4">
        <div className="bg-red-900/30 border border-red-700 rounded-lg p-6 max-w-md text-center">
          <p className="text-red-200">Error loading game</p>
          <p className="text-red-300 text-sm mt-2">{error || 'Unknown error'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-white mb-1">Trade Battle</h1>
          <p className="text-slate-400">Room: {roomId} | Playing as Player {playerNumber}</p>
        </div>

        {/* Game Over Modal */}
        {isGameOver && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-8 max-w-md text-center">
              <h2 className="text-3xl font-bold text-yellow-400 mb-4">🏆 Game Over!</h2>
              <p className="text-xl text-white mb-2">
                {winner === playerNumber
                  ? `You Win! 🎉`
                  : `Player ${winner} Wins! 🥇`}
              </p>
              <div className="bg-slate-700/50 rounded-lg p-4 my-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-300">Your Balance:</span>
                  <span className="text-white font-bold">${player?.balance.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-300">Opponent Balance:</span>
                  <span className="text-white font-bold">${opponent?.balance.toFixed(2)}</span>
                </div>
              </div>
              <a
                href="/"
                className="inline-block w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg mt-4"
              >
                Play Again
              </a>
            </div>
          </div>
        )}

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Left Column: Your Stats */}
          <div className="bg-slate-700/50 border border-slate-600 rounded-lg p-6">
            <h2 className="text-xl font-bold text-white mb-4">Your Stats</h2>
            <div className="space-y-4">
              <div>
                <p className="text-slate-400 text-sm">Balance</p>
                <p className="text-3xl font-bold text-green-400">
                  ${player?.balance.toFixed(2)}
                </p>
              </div>
              <div className="border-t border-slate-600 pt-4">
                <p className="text-slate-400 text-sm mb-2">Position</p>
                {player?.position ? (
                  <div className="bg-slate-600/50 rounded p-2">
                    <p className="text-white font-mono text-sm">
                      Type: {player.position.type.toUpperCase()}
                    </p>
                    <p className="text-slate-300 font-mono text-sm">
                      Entry: ${player.position.entryPrice.toFixed(2)}
                    </p>
                  </div>
                ) : (
                  <p className="text-slate-400 text-sm">No active position</p>
                )}
              </div>
            </div>
          </div>

          {/* Middle Column: Price & Timer */}
          <div className="bg-slate-700/50 border border-slate-600 rounded-lg p-6">
            <div className="text-center space-y-4">
              <div>
                <p className="text-slate-400 text-sm mb-1">BTC Price</p>
                <p
                  className={`text-4xl font-bold text-white font-mono ${
                    priceLoadingError ? 'text-red-400' : ''
                  }`}
                >
                  {currentPrice ? `$${currentPrice.toFixed(2)}` : '...'}
                </p>
                {priceLoadingError && (
                  <p className="text-red-400 text-xs mt-1">{priceLoadingError}</p>
                )}
              </div>
              <div className="border-t border-slate-600 pt-4">
                <GameTimer remainingTime={gameState.remainingTime} />
              </div>
            </div>
          </div>

          {/* Right Column: Opponent Stats */}
          <div className="bg-slate-700/50 border border-slate-600 rounded-lg p-6">
            <h2 className="text-xl font-bold text-white mb-4">Opponent</h2>
            <div className="space-y-4">
              <div>
                <p className="text-slate-400 text-sm">Balance</p>
                <p className="text-3xl font-bold text-blue-400">
                  ${opponent?.balance.toFixed(2) || '-'}
                </p>
              </div>
              <div className="border-t border-slate-600 pt-4">
                <p className="text-slate-400 text-sm mb-2">Position</p>
                {opponent?.position ? (
                  <div className="bg-slate-600/50 rounded p-2">
                    <p className="text-white font-mono text-sm">
                      Type: {opponent.position.type.toUpperCase()}
                    </p>
                    <p className="text-slate-300 font-mono text-sm">
                      Entry: ${opponent.position.entryPrice.toFixed(2)}
                    </p>
                  </div>
                ) : (
                  <p className="text-slate-400 text-sm">No active position</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Position Display */}
        <div className="mb-6">
          <h2 className="text-xl font-bold text-white mb-3">Your Position</h2>
          <PositionDisplay
            position={player?.position || null}
            currentPrice={currentPrice}
          />
        </div>

        {/* Chart */}
        {currentPrice && (
          <div className="mb-6">
            <h2 className="text-xl font-bold text-white mb-3">BTC Price Chart</h2>
            <PriceChart price={currentPrice} timestamp={Date.now()} />
          </div>
        )}

        {/* Action Buttons */}
        <div className="bg-slate-700/50 border border-slate-600 rounded-lg p-6">
          <div className="flex flex-col sm:flex-row gap-4 mb-4">
            <button
              onClick={handleBuy}
              disabled={actionLoading || isGameOver || player?.position !== null}
              className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg transition-all"
            >
              {actionLoading ? 'Processing...' : 'Buy'}
            </button>
            <button
              onClick={handleSell}
              disabled={actionLoading || isGameOver || player?.position !== null}
              className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg transition-all"
            >
              {actionLoading ? 'Processing...' : 'Sell'}
            </button>
            <button
              onClick={handleClose}
              disabled={actionLoading || isGameOver || player?.position === null}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg transition-all"
            >
              {actionLoading ? 'Processing...' : 'Close Position'}
            </button>
          </div>

          {/* Action Message */}
          {actionMessage && (
            <div
              className={`text-center py-2 px-4 rounded-lg ${
                messageType === 'success'
                  ? 'bg-green-900/30 text-green-200'
                  : 'bg-red-900/30 text-red-200'
              }`}
            >
              {actionMessage}
            </div>
          )}
        </div>

        {/* Game Status */}
        {gameState.status === 'waiting' && (
          <div className="mt-6 bg-yellow-900/30 border border-yellow-700 rounded-lg p-4 text-center text-yellow-200">
            ⏳ Waiting for other player to join...
          </div>
        )}
      </div>
    </div>
  );
}
