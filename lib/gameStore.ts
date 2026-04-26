import { Game, Player } from './types';
import { readGame, writeGame, deleteGame, deleteAllGames } from './redisStore';

const DEFAULT_DURATION = 5 * 60 * 1000;
const INITIAL_BALANCE = 1000;
const CLEANUP_TIMEOUT = 1 * 60 * 60 * 1000;

export async function getOrCreateGame(roomId: string): Promise<Game> {
  let game = await readGame(roomId);

  if (!game) {
    game = {
      id: roomId,
      players: { '1': null, '2': null },
      startTime: null,
      duration: DEFAULT_DURATION,
      status: 'waiting',
      createdAt: Date.now(),
    };
    await writeGame(game);
    return game;
  }

  if (game.status === 'finished' && Date.now() - game.createdAt > CLEANUP_TIMEOUT) {
    await deleteGame(roomId);
    return getOrCreateGame(roomId);
  }

  return game;
}

export async function getGame(roomId: string): Promise<Game | null> {
  return readGame(roomId);
}

export async function joinGame(
  roomId: string,
  playerNumber: '1' | '2'
): Promise<{ success: boolean; message: string; game?: Game }> {
  const game = await getOrCreateGame(roomId);

  if (game.players[playerNumber]) {
    return { success: false, message: `Player ${playerNumber} already joined this room` };
  }

  const newPlayer: Player = {
    id: `${roomId}-player-${playerNumber}`,
    balance: INITIAL_BALANCE,
    position: null,
  };

  game.players[playerNumber] = newPlayer;

  if (game.players['1'] && game.players['2'] && game.status === 'waiting') {
    game.status = 'running';
    game.startTime = Date.now();
  }

  await writeGame(game);
  return { success: true, message: `Player ${playerNumber} joined successfully`, game };
}

export async function updatePlayerPosition(
  roomId: string,
  playerNumber: '1' | '2',
  position: Player['position']
): Promise<{ success: boolean; game?: Game; message?: string }> {
  const game = await getGame(roomId);
  if (!game) return { success: false, message: 'Game not found' };

  const player = game.players[playerNumber];
  if (!player) return { success: false, message: 'Player not found' };

  player.position = position;
  await writeGame(game);
  return { success: true, game };
}

export async function updatePlayerBalance(
  roomId: string,
  playerNumber: '1' | '2',
  newBalance: number
): Promise<{ success: boolean; game?: Game; message?: string }> {
  const game = await getGame(roomId);
  if (!game) return { success: false, message: 'Game not found' };

  const player = game.players[playerNumber];
  if (!player) return { success: false, message: 'Player not found' };

  player.balance = newBalance;
  await writeGame(game);
  return { success: true, game };
}

export async function getGameState(roomId: string) {
  const game = await getGame(roomId);
  if (!game) return null;

  let remainingTime = game.duration;
  if (game.status === 'running' && game.startTime) {
    remainingTime = Math.max(0, game.duration - (Date.now() - game.startTime));

    if (remainingTime === 0) {
      game.status = 'finished';
      await writeGame(game);
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

export async function closePosition(
  roomId: string,
  playerNumber: '1' | '2',
  currentPrice: number
): Promise<{ success: boolean; pnl?: number; game?: Game; message?: string }> {
  const game = await getGame(roomId);
  if (!game) return { success: false, message: 'Game not found' };

  const player = game.players[playerNumber];
  if (!player) return { success: false, message: 'Player not found' };
  if (!player.position) return { success: false, message: 'No active position' };

  const { type, entryPrice } = player.position;
  const pnl =
    type === 'buy'
      ? (currentPrice - entryPrice) * 1
      : (entryPrice - currentPrice) * 1;

  player.balance += pnl;
  player.position = null;
  await writeGame(game);

  return { success: true, pnl, game };
}

export async function resetGames(): Promise<void> {
  await deleteAllGames();
}
