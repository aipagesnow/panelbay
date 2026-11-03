import { describe, expect, it } from "vitest";
import { assess } from "./tally";
import { listText, shoppingList } from "./list";

describe("shopping list", () => {
  it("lists a 10 m run", () => {
    const r = assess({ length: "10", width: "1.83", wall: "0", post: "100", gateOn: false, gate: "0.9" });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    const lines = shoppingList(r.tally);
    expect(lines[0]).toContain("6 fence panels");
    expect(lines[1]).toContain("7 posts");
    expect(lines[2]).toContain("14 bags");
    expect(lines[3]).toContain("6 gravel boards");
    expect(listText(r.tally)).toContain("Panel Bay shopping list");
  });
});
