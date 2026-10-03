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
  it("include the tally pages, privacy and contact", () => {
    const names = pages.map((path) => path.slice(root.length));
    expect(names).toContain("/index.html");
    expect(names).toContain("/posts/index.html");
    expect(names).toContain("/postcrete/index.html");
    expect(names).toContain("/gravel-boards/index.html");
    expect(names).toContain("/height/index.html");
    expect(names).toContain("/privacy/index.html");
    expect(names).toContain("/contact/index.html");
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
    expect(height).not.toContain('name="robots"');
  });

  it("keeps the preview host noindex off the pages, and noindex the three material pages", () => {
    const vercel = JSON.parse(readFileSync(join(root, "vercel.json"), "utf8")) as {
      headers: { source: string; has: { type: string; value: string }[]; headers: { key: string; value: string }[] }[];
    };
    const hosts = vercel.headers.flatMap((rule) => rule.has.map((item) => item.value));
    expect(hosts).toContain("panelbay.vercel.app");
    expect(hosts.every((host) => host === "panelbay.vercel.app")).toBe(true);
    for (const rule of vercel.headers) {
      expect(rule.headers).toContainEqual({ key: "X-Robots-Tag", value: "noindex, follow" });
    }
    expect(publicCopy).not.toMatch(/rel=["']canonical["']/);
    expect(publicCopy).not.toMatch(/panelbay\.co\.uk/);
    expect(publicCopy).not.toMatch(/@/);

    for (const path of ["posts/index.html", "postcrete/index.html", "gravel-boards/index.html"]) {
      expect(readFileSync(join(root, path), "utf8")).toContain('name="robots" content="noindex, follow"');
    }
    for (const path of ["index.html", "height/index.html", "privacy/index.html", "contact/index.html"]) {
      expect(readFileSync(join(root, path), "utf8")).not.toContain('name="robots"');
    }
  });

  it("names the publisher and keeps privacy and contact short", () => {
    for (const path of pages.filter((file) => !file.includes("/partials/"))) {
      const html = readFileSync(path, "utf8");
      expect(html).toContain("Published by Panel Bay.");
      expect(html).toContain('href="/contact/"');
    }
    const privacy = readFileSync(join(root, "privacy/index.html"), "utf8");
    expect(privacy).toContain("The tally runs in the browser.");
    expect(privacy).toContain("There are no accounts.");
    expect(privacy).toContain("no ads and no analytics");
    expect(privacy).toContain("updated before either is added");
    const contact = readFileSync(join(root, "contact/index.html"), "utf8");
    expect(contact).toContain("no inbox on this preview");
    expect(contact).toContain("does not take accounts");
    const posts = readFileSync(join(root, "posts/index.html"), "utf8");
    expect(posts).toContain("1.8 m high");
    expect(posts).not.toContain("1.8 m panel");
    const postcrete = readFileSync(join(root, "postcrete/index.html"), "utf8");
    expect(postcrete).toContain("Heidelberg PostFix");
    expect(postcrete).toContain("June 2025");
    expect(postcrete.split("75 × 75")[1]).toContain("rough allowance");
    expect(postcrete.split("75 × 75")[1]).not.toContain("Heidelberg");
    const home = readFileSync(join(root, "index.html"), "utf8");
    expect(home).toContain("taken up in the joints");
    expect(home).toContain("short of another full panel");
  });
});
