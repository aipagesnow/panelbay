import { describe, expect, it } from "vitest";
import { countCloseboard, railsFor } from "./closeboard-calc";

describe("closeboard tally", () => {
  it("counts a 9 m run of 125 mm boards at 1.8 m", () => {
    const r = countCloseboard({ length: 9, height: 1.8, board: 125, bay: 3 });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.tally).toMatchObject({ bays: 3, posts: 4, railsPerBay: 3, rails: 9, boards: 90, nails: 270, gravelBoards: 3, bags: 8 });
  });
  it("rounds part bays and boards up", () => {
    const r = countCloseboard({ length: 10, height: 1.2, board: 100, bay: 3 });
    if (!r.ok) throw new Error();
    expect(r.tally.bays).toBe(4);
    expect(r.tally.posts).toBe(5);
    expect(r.tally.boards).toBe(134);
    expect(r.tally.rails).toBe(8);
  });
  it("picks rails by height", () => {
    expect(railsFor(0.9)).toBe(2);
    expect(railsFor(1.8)).toBe(3);
    expect(railsFor(2.1)).toBe(4);
  });
  it("refuses bays over 3 m and empty runs", () => {
    expect(countCloseboard({ length: 9, height: 1.8, board: 125, bay: 3.5 }).ok).toBe(false);
    expect(countCloseboard({ length: 0, height: 1.8, board: 125, bay: 3 }).ok).toBe(false);
  });
});
