export type FenceType = "lap" | "closeboard" | "composite";
export interface Range { low: number; high: number }

/** Supplied and fitted, per metre, 1.8 m high. See the sources on /fence-cost/. */
export const FITTED: Record<FenceType, Range> = {
  lap: { low: 60, high: 100 },
  closeboard: { low: 90, high: 130 },
  composite: { low: 130, high: 200 },
};
export const REMOVAL: Range = { low: 10, high: 25 };
export const GATE: Range = { low: 150, high: 450 };

export interface CostInput { length: number; type: FenceType; removal: boolean; gates: number }
export type CostResult =
  | { ok: true; fence: Range; removal: Range; gates: Range; total: Range }
  | { ok: false; message: string };

const r = (n: number) => Math.round(n / 10) * 10;
const times = (a: Range, n: number): Range => ({ low: r(a.low * n), high: r(a.high * n) });

export function estimate(input: CostInput): CostResult {
  const { length, type, removal, gates } = input;
  if (!Number.isFinite(length) || length <= 0) return { ok: false, message: "Enter the run length in metres." };
  if (length > 500) return { ok: false, message: "That is a very long run. Ask for quotes instead." };
  if (!Number.isInteger(gates) || gates < 0 || gates > 10) return { ok: false, message: "Enter a number of gates from 0 to 10." };
  const fence = times(FITTED[type], length);
  const rem = removal ? times(REMOVAL, length) : { low: 0, high: 0 };
  const g = times(GATE, gates);
  return { ok: true, fence, removal: rem, gates: g, total: { low: fence.low + rem.low + g.low, high: fence.high + rem.high + g.high } };
}

export const gbp = (n: number) => `£${n.toLocaleString("en-GB")}`;
