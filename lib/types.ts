export type Position = {
  type: 'buy' | 'sell';
  entryPrice: number;
  openTime: number;
};

export type Player = {
  id: string;
  balance: number;
  position: Position | null;
};

export type Game = {
  id: string;
  players: {
    '1': Player | null;
    '2': Player | null;
  };
  startTime: number | null;
  duration: number; // in milliseconds
  status: 'waiting' | 'running' | 'finished';
  createdAt: number;
};

export type GameState = {
  id: string;
  players: {
    '1': Player | null;
    '2': Player | null;
  };
  status: 'waiting' | 'running' | 'finished';
  startTime: number | null;
  duration: number;
  remainingTime: number;
};
