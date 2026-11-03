export type BoardWidth = 100 | 125;

export interface CloseboardInput {
  length: number;
  height: number;
  board: BoardWidth;
  bay: number;
}

export interface CloseboardTally {
  bays: number;
  bayLength: number;
  posts: number;
  railsPerBay: number;
  rails: number;
  boards: number;
  nails: number;
  gravelBoards: number;
  bags: number;
  cover: number;
}

export type CloseboardResult =
  | { ok: true; tally: CloseboardTally }
  | { ok: false; message: string };

export const MAX_BAY = 3;
const COVER: Record<BoardWidth, number> = { 100: 75, 125: 100 };

export function railsFor(height: number): number {
  if (height <= 1.2) return 2;
  if (height <= 1.95) return 3;
  return 4;
}

export function countCloseboard(input: CloseboardInput): CloseboardResult {
  const { length, height, board, bay } = input;
  if (!Number.isFinite(length) || length <= 0) return { ok: false, message: "Enter the run length in metres." };
  if (length > 200) return { ok: false, message: "That is longer than one run. Split it at the corners." };
  if (!Number.isFinite(height) || height < 0.6 || height > 2.4) return { ok: false, message: "Enter a fence height between 0.6 and 2.4 m." };
  if (!Number.isFinite(bay) || bay <= 0) return { ok: false, message: "Enter the post spacing in metres." };
  if (bay > MAX_BAY) return { ok: false, message: "Keep posts at 3 m centres or closer." };
  const bays = Math.ceil(length / bay - 1e-9);
  const railsPerBay = railsFor(height);
  const cover = COVER[board];
  const boards = Math.ceil((length * 1000) / cover - 1e-9);
  return {
    ok: true,
    tally: {
      bays,
      bayLength: length / bays,
      posts: bays + 1,
      railsPerBay,
      rails: bays * railsPerBay,
      boards,
      nails: boards * railsPerBay,
      gravelBoards: bays,
      bags: (bays + 1) * 2,
      cover,
    },
  };
}
