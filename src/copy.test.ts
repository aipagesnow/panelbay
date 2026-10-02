import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const root = fileURLToPath(new URL("..", import.meta.url)).replace(/\/$/, "");

function htmlFiles(dir: string): string[] {
  const found: string[] = [];
  for (const name of readdirSync(dir)) {
    if (name === "node_modules" || name === "dist") continue;
    const path = join(dir, name);
    if (statSync(path).isDirectory()) found.push(...htmlFiles(path));
    else if (name.endsWith(".html")) found.push(path);
  }
  return found;
}

const pages = htmlFiles(root);
const publicCopy = pages.map((path) => readFileSync(path, "utf8")).join("\n");

describe("public pages", () => {
  it("include the five pages", () => {
    const names = pages.map((path) => path.slice(root.length));
    expect(names).toContain("/index.html");
    expect(names).toContain("/posts/index.html");
    expect(names).toContain("/postcrete/index.html");
    expect(names).toContain("/gravel-boards/index.html");
    expect(names).toContain("/height/index.html");
  });

  it("stay in this brand's voice", () => {
    const banned = [
      /TODO/,
      /FIXME/,
      /TBD/,
      /lorem ipsum/i,
      /Aivora/i,
      /amazon/i,
      /Wickes/i,
      /B&Q/i,
      /coming soon/i,
      /permitted development/i,
      /one metre/i,
      /two metres/i,
      /1 metre/i,
      /2 metres/i,
      /you can put up/i,
      /you will not need/i,
    ];
    for (const pattern of banned) {
      expect(publicCopy, pattern.source).not.toMatch(pattern);
    }
  });

  it("point the height note at the council and the Planning Portal", () => {
    const height = readFileSync(join(root, "height/index.html"), "utf8");
    expect(height).toContain("https://www.planningportal.co.uk/permission/common-projects/fences-gates-and-garden-walls");
    expect(height).toContain("https://www.planningportal.co.uk/find-your-local-planning-authority");
    expect(height).toContain("not planning advice");
    expect(height).not.toContain("<!--form-->");
  });
});
