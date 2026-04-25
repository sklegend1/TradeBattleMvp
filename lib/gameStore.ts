import { Game, Player } from './types';

// Global in-memory store for games
const games: Record<string, Game> = {};

const DEFAULT_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds
const INITIAL_BALANCE = 1000;
const CLEANUP_TIMEOUT = 1 * 60 * 60 * 1000; // 1 hour

/**
 * Get or create a game room
 */
export function getOrCreateGame(roomId: string): Game {
  if (!games[roomId]) {
    games[roomId] = {
      id: roomId,
      players: {
        '1': null,
        '2': null,
      },
      startTime: null,
      duration: DEFAULT_DURATION,
      status: 'waiting',
      createdAt: Date.now(),
    };
  }

  // Check if game is expired and needs cleanup
  if (
    games[roomId].status === 'finished' &&
    Date.now() - games[roomId].createdAt > CLEANUP_TIMEOUT
  ) {
    delete games[roomId];
    return getOrCreateGame(roomId); // Recreate
  }

  return games[roomId];
}

/**
 * Get an existing game
 */
export function getGame(roomId: string): Game | null {
  return games[roomId] || null;
}

/**
 * Join a game as a specific player
 */
export function joinGame(
  roomId: string,
  playerNumber: '1' | '2'
): { success: boolean; message: string; game?: Game } {
  const game = getOrCreateGame(roomId);

  if (game.players[playerNumber]) {
    return {
      success: false,
      message: `Player ${playerNumber} already joined this room`,
    };
  }

  // Create player
  const newPlayer: Player = {
    id: `${roomId}-player-${playerNumber}`,
    balance: INITIAL_BALANCE,
    position: null,
  };

  game.players[playerNumber] = newPlayer;

  // Auto-start game if both players joined
  if (game.players['1'] && game.players['2'] && game.status === 'waiting') {
    game.status = 'running';
    game.startTime = Date.now();
  }

  return {
    success: true,
    message: `Player ${playerNumber} joined successfully`,
    game,
  };
}

/**
 * Update a player's position
 */
export function updatePlayerPosition(
  roomId: string,
  playerNumber: '1' | '2',
  position: any
): { success: boolean; game?: Game; message?: string } {
  const game = getGame(roomId);
  if (!game) {
    return { success: false, message: 'Game not found' };
  }

  const player = game.players[playerNumber];
  if (!player) {
    return { success: false, message: 'Player not found' };
  }

  player.position = position;
  return { success: true, game };
}

/**
 * Update a player's balance
 */
export function updatePlayerBalance(
  roomId: string,
  playerNumber: '1' | '2',
  newBalance: number
): { success: boolean; game?: Game; message?: string } {
  const game = getGame(roomId);
  if (!game) {
    return { success: false, message: 'Game not found' };
  }

  const player = game.players[playerNumber];
  if (!player) {
    return { success: false, message: 'Player not found' };
  }

  player.balance = newBalance;
  return { success: true, game };
}

/**
 * Get game state with computed remaining time
 */
export function getGameState(roomId: string) {
  const game = getGame(roomId);
  if (!game) {
    return null;
  }

  let remainingTime = game.duration;
  if (game.status === 'running' && game.startTime) {
    remainingTime = Math.max(0, game.duration - (Date.now() - game.startTime));

    // Auto-finish game if time is up
    if (remainingTime === 0 && game.status === 'running') {
      game.status = 'finished';
    }
  }

  return {
    id: game.id,
    players: game.players,
    status: game.status,
    startTime: game.startTime,
    duration: game.duration,
    remainingTime,
  };
}

/**
 * Close player position and calculate PnL
 */
export function closePosition(
  roomId: string,
  playerNumber: '1' | '2',
  currentPrice: number
): { success: boolean; pnl?: number; game?: Game; message?: string } {
  const game = getGame(roomId);
  if (!game) {
    return { success: false, message: 'Game not found' };
  }

  const player = game.players[playerNumber];
  if (!player) {
    return { success: false, message: 'Player not found' };
  }

  if (!player.position) {
    return { success: false, message: 'No active position' };
  }

  const { type, entryPrice } = player.position;
  const SIZE = 1; // Standard position size

  let pnl = 0;
  if (type === 'buy') {
    pnl = (currentPrice - entryPrice) * SIZE;
  } else {
    pnl = (entryPrice - currentPrice) * SIZE;
  }

  player.balance += pnl;
  player.position = null;

  return { success: true, pnl, game };
}

/**
 * Reset all games (for testing)
 */
export function resetGames(): void {
  Object.keys(games).forEach((key) => {
    delete games[key];
  });
}
