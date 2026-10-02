import { describe, expect, it } from "vitest";
import { assess, formatLength, splitPanels, tallyRows } from "./tally";

function run(over: Partial<Parameters<typeof assess>[0]> = {}) {
  return assess({
    length: "10",
    width: "1.83",
    gateOn: false,
    gate: "0.9",
    wall: "0",
    post: "100",
    ...over,
  });
}

describe("splitPanels", () => {
  it("calls out a short last bay instead of hiding it in a round-up", () => {
    expect(splitPanels(10_000, 1830)).toEqual({ full: 5, cutMm: 850 });
  });

  it("leaves an exact run uncut", () => {
    expect(splitPanels(9150, 1830)).toEqual({ full: 5, cutMm: 0 });
  });

  it("absorbs a remainder of 20 mm into the joints", () => {
    expect(splitPanels(9170, 1830)).toEqual({ full: 5, cutMm: 0 });
  });

  it("calls out a remainder of 21 mm", () => {
    expect(splitPanels(9171, 1830)).toEqual({ full: 5, cutMm: 21 });
  });

  it("treats a near-full last bay as a whole panel", () => {
    expect(splitPanels(9150 + 1830 - 20, 1830)).toEqual({ full: 6, cutMm: 0 });
  });
});

describe("a 10 m run", () => {
  it("counts panels, posts, bags and boards for 100 mm posts", () => {
    const result = run();
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.tally.fullPanels).toBe(5);
    expect(result.tally.cutMm).toBe(850);
    expect(result.tally.panels).toBe(6);
    expect(result.tally.posts).toBe(7);
    expect(result.tally.bags).toBe(14);
    expect(result.tally.boards).toBe(6);
    const rows = tallyRows(result.tally);
    expect(rows.find((row) => row.key === "panels")?.flag).toBe("1 cut");
    expect(rows.find((row) => row.key === "panels")?.why).toContain("cut to 0.85 m");
    expect(rows.find((row) => row.key === "boards")?.why).toContain("cut to 0.85 m");
    expect(rows.find((row) => row.key === "bags")?.why).toContain("100 × 100 mm");
    expect(rows.find((row) => row.key === "bags")?.why).toContain("300 × 600 mm");
  });

  it("rounds 75 mm posts up from the 1½ bag table row", () => {
    const result = run({ post: "75" });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.tally.posts).toBe(7);
    expect(result.tally.bagTenths).toBe(105);
    expect(result.tally.bags).toBe(11);
    expect(tallyRows(result.tally).find((row) => row.key === "bags")?.why).toContain("rounded up to 11");
  });

  it("drops one post when one end is a wall", () => {
    const result = run({ wall: "1" });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.tally.posts).toBe(6);
    expect(result.tally.bags).toBe(12);
  });

  it("drops both end posts when both ends are walls", () => {
    const result = run({ wall: "2" });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.tally.posts).toBe(5);
    expect(result.tally.bags).toBe(10);
  });
});

describe("gate", () => {
  it("takes the leaf out of the panel run and still counts it as a bay", () => {
    const result = run({ gateOn: true, gate: "0.9" });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.tally.panelRunMm).toBe(9100);
    expect(result.tally.fullPanels).toBe(4);
    expect(result.tally.cutMm).toBe(1780);
    expect(result.tally.panels).toBe(5);
    expect(result.tally.bays).toBe(6);
    expect(result.tally.posts).toBe(7);
    expect(result.tally.boards).toBe(5);
    const rows = tallyRows(result.tally);
    expect(rows.find((row) => row.key === "panels")?.why).toContain("0.9 m gate");
    expect(rows.find((row) => row.key === "boards")?.why).toContain("None under the gate");
    expect(rows.find((row) => row.key === "posts")?.why).toContain("not an extra pair of posts");
  });

  it("hangs a gate on the walls when both ends are walls and there are no panels", () => {
    const result = run({ length: "0.9", gateOn: true, gate: "0.9", wall: "2" });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.tally.panels).toBe(0);
    expect(result.tally.posts).toBe(0);
    expect(result.tally.bags).toBe(0);
    expect(result.tally.boards).toBe(0);
    expect(tallyRows(result.tally).find((row) => row.key === "posts")?.why).toContain("hangs on the walls");
  });

  it("refuses a gate wider than the run", () => {
    const result = run({ gateOn: true, gate: "11" });
    expect(result).toEqual({ ok: false, idle: false, message: "The gate is wider than the run." });
  });
});

describe("edges", () => {
  it("waits for a length", () => {
    const result = run({ length: "" });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.idle).toBe(true);
  });

  it("accepts a comma decimal", () => {
    expect(formatLength(850)).toBe("0.85 m");
    const result = run({ length: "9,15" });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.tally.panels).toBe(5);
    expect(result.tally.cutMm).toBe(0);
    expect(result.tally.posts).toBe(6);
  });

  it("fixes one panel between two walls with no post", () => {
    const result = run({ length: "1.83", wall: "2" });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.tally.panels).toBe(1);
    expect(result.tally.posts).toBe(0);
    expect(result.tally.boards).toBe(1);
  });
});
