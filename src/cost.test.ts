import { describe, expect, it } from "vitest";
import { estimate } from "./cost-calc";

describe("fence cost", () => {
  it("prices 15 m of closeboard with removal and a gate", () => {
    const e = estimate({ length: 15, type: "closeboard", removal: true, gates: 1 });
    if (!e.ok) throw new Error();
    expect(e.fence).toEqual({ low: 1350, high: 1950 });
    expect(e.removal).toEqual({ low: 150, high: 380 });
    expect(e.total).toEqual({ low: 1650, high: 2780 });
  });
  it("rejects an empty run", () => {
    expect(estimate({ length: NaN, type: "lap", removal: false, gates: 0 }).ok).toBe(false);
  });
});
