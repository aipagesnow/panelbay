/** Whole-bag Postcrete figures for the holes stated on the tally. */

export const SLACK_MM = 20;
export const MIN_WIDTH_MM = 300;
export const MAX_WIDTH_MM = 3000;
export const MAX_LENGTH_MM = 500_000;
export const MIN_GATE_MM = 600;

export type WallEnds = 0 | 1 | 2;
export type PostSize = "75" | "100";
export type Focus = "all" | "panels" | "posts" | "bags" | "boards";

export interface PostSpec {
  id: PostSize;
  label: string;
  hole: string;
  /** Bags of 20 kg per post, in tenths, so 15 is 1½ and 20 is 2. */
  tenthsEach: number;
}

export const POST_SPECS: Record<PostSize, PostSpec> = {
  "75": {
    id: "75",
    label: "75 × 75 mm",
    hole: "250 × 600 mm",
    tenthsEach: 15,
  },
  "100": {
    id: "100",
    label: "100 × 100 mm",
    hole: "300 × 600 mm",
    tenthsEach: 20,
  },
};

export interface RunInput {
  lengthMm: number;
  widthMm: number;
  gateMm: number;
  wall: WallEnds;
  post: PostSize;
}

export interface Tally {
  lengthMm: number;
  widthMm: number;
  gateMm: number;
  wall: WallEnds;
  post: PostSpec;
  panelRunMm: number;
  fullPanels: number;
  cutMm: number;
  panels: number;
  bays: number;
  posts: number;
  /** Whole 20 kg bags to buy. */
  bags: number;
  /** Unrounded bag count in tenths. 15 is 1½ bags. */
  bagTenths: number;
  boards: number;
}

export interface Row {
  key: Exclude<Focus, "all">;
  href: string;
  label: string;
  flag: string;
  value: string;
  unit: string;
  why: string;
}

export type Assessed =
  | { ok: false; idle: boolean; message: string }
  | { ok: true; tally: Tally };

export interface RawRun {
  length: string;
  width: string;
  gateOn: boolean;
  gate: string;
  wall: string;
  post: string;
}

export function parseMetres(raw: string): number | null {
  const trimmed = raw.trim().replace(/,/g, ".");
  if (!/^\d+(\.\d*)?$/.test(trimmed)) return null;
  const n = Number(trimmed.endsWith(".") ? trimmed.slice(0, -1) : trimmed);
  if (!Number.isFinite(n)) return null;
  return Math.round(n * 1000);
}

export function formatMetres(mm: number): string {
  const sign = mm < 0 ? "-" : "";
  const abs = Math.abs(mm);
  const whole = Math.floor(abs / 1000);
  const hundredths = Math.round((abs % 1000) / 10);
  if (hundredths <= 0) return `${sign}${whole}`;
  if (hundredths % 10 === 0) return `${sign}${whole}.${hundredths / 10}`;
  return `${sign}${whole}.${String(hundredths).padStart(2, "0")}`;
}

export function formatLength(mm: number): string {
  if (mm > 0 && mm < 100) return `${mm} mm`;
  return `${formatMetres(mm)} m`;
}

export function formatBagTenths(tenths: number): string {
  const whole = Math.floor(tenths / 10);
  const frac = tenths % 10;
  if (frac === 0) return String(whole);
  if (frac === 5) return whole === 0 ? "½" : `${whole}½`;
  return (tenths / 10).toFixed(1);
}

export function splitPanels(lengthMm: number, widthMm: number): { full: number; cutMm: number } {
  if (lengthMm <= SLACK_MM) return { full: 0, cutMm: 0 };
  const full = Math.floor(lengthMm / widthMm);
  const rem = lengthMm - full * widthMm;
  if (rem <= SLACK_MM) return { full, cutMm: 0 };
  if (widthMm - rem <= SLACK_MM) return { full: full + 1, cutMm: 0 };
  return { full, cutMm: rem };
}

export function countRun(input: RunInput): Tally {
  const spec = POST_SPECS[input.post];
  const panelRunMm = Math.max(0, input.lengthMm - input.gateMm);
  const { full, cutMm } = splitPanels(panelRunMm, input.widthMm);
  const panels = full + (cutMm > 0 ? 1 : 0);
  const bays = panels + (input.gateMm > 0 ? 1 : 0);
  const posts = Math.max(0, bays + 1 - input.wall);
  const bagTenths = posts * spec.tenthsEach;
  const bags = Math.ceil(bagTenths / 10);
  return {
    lengthMm: input.lengthMm,
    widthMm: input.widthMm,
    gateMm: input.gateMm,
    wall: input.wall,
    post: spec,
    panelRunMm,
    fullPanels: full,
    cutMm,
    panels,
    bays,
    posts,
    bags,
    bagTenths,
    boards: panels,
  };
}

export function assess(raw: RawRun): Assessed {
  if (raw.length.trim() === "") {
    return { ok: false, idle: true, message: "Type the run in metres." };
  }
  const length = parseMetres(raw.length);
  if (length === null) {
    return { ok: false, idle: false, message: "The run needs to be a number of metres." };
  }
  if (length <= 0) {
    return { ok: false, idle: false, message: "The run needs to be longer than zero." };
  }
  if (length > MAX_LENGTH_MM) {
    return { ok: false, idle: false, message: "This tally covers one run, up to 500 m." };
  }

  const width = parseMetres(raw.width.trim() === "" ? "1.83" : raw.width);
  if (width === null) {
    return { ok: false, idle: false, message: "Panel width needs to be a number of metres." };
  }
  if (width < MIN_WIDTH_MM || width > MAX_WIDTH_MM) {
    return { ok: false, idle: false, message: "Use a panel width from 0.3 m to 3 m." };
  }

  let gateMm = 0;
  if (raw.gateOn) {
    const gate = parseMetres(raw.gate);
    if (gate === null) {
      return { ok: false, idle: false, message: "The gate width needs to be a number of metres." };
    }
    if (gate < MIN_GATE_MM) {
      return { ok: false, idle: false, message: "Use a gate of at least 0.6 m." };
    }
    if (gate > length) {
      return { ok: false, idle: false, message: "The gate is wider than the run." };
    }
    gateMm = gate;
  }

  if (gateMm === 0 && length <= SLACK_MM) {
    return {
      ok: false,
      idle: false,
      message: "That run is shorter than the joint allowance. Measure it again.",
    };
  }

  const wall: WallEnds = raw.wall === "1" ? 1 : raw.wall === "2" ? 2 : 0;
  const post: PostSize = raw.post === "75" ? "75" : "100";
  return { ok: true, tally: countRun({ lengthMm: length, widthMm: width, gateMm, wall, post }) };
}

function gateClause(t: Tally): string {
  if (t.gateMm <= 0) return "";
  return ` The ${formatLength(t.gateMm)} gate is taken out of the run.`;
}

function panelWhy(t: Tally): { flag: string; why: string } {
  const width = formatLength(t.widthMm);
  const gate = gateClause(t);
  if (t.panels === 0) return { flag: "", why: "No panels. The run is the gate." };
  if (t.cutMm > 0 && t.fullPanels === 0) {
    return { flag: "1 cut", why: `1 panel, cut to ${formatLength(t.cutMm)}.${gate}` };
  }
  if (t.cutMm > 0) {
    return {
      flag: "1 cut",
      why: `${t.fullPanels} at ${width}, and 1 cut to ${formatLength(t.cutMm)}.${gate}`,
    };
  }
  const noun = t.fullPanels === 1 ? "panel" : "panels";
  return { flag: "", why: `${t.fullPanels} ${noun} at ${width}. Nothing to cut.${gate}` };
}

function postWhy(t: Tally): string {
  if (t.posts === 0 && t.panels === 0) return "No posts. The gate hangs on the walls.";
  if (t.posts === 0) return "No posts. The panels fix to the walls at both ends.";

  let line: string;
  if (t.wall === 0 && t.bays === 1) line = "A post at each end of the bay.";
  else if (t.wall === 0) line = "A post at each end, and a post between the bays.";
  else if (t.wall === 1 && t.bays === 1) line = "One end fixes to the wall. The open end gets a post.";
  else if (t.wall === 1) {
    line = "One end fixes to the wall. The open end gets a post, and a post sits between the bays.";
  } else if (t.posts === 1) line = "Both ends fix to the walls. One post sits between the bays.";
  else line = "Both ends fix to the walls. Posts sit between the bays.";

  const gate =
    t.gateMm > 0 ? " The gate is a bay in this count, not an extra pair of posts." : "";
  return `${line} ${t.post.label}.${gate}`;
}

function bagWhy(t: Tally): string {
  if (t.posts === 0) return "No bags. This run has no posts.";
  const rate = t.post.tenthsEach === 15 ? "1½" : formatBagTenths(t.post.tenthsEach);
  const base = `${rate} bags of 20 kg for each ${t.post.label} post, in a ${t.post.hole} hole.`;
  if (t.post.id === "75") {
    const exact = formatBagTenths(t.bagTenths);
    if (t.bags * 10 !== t.bagTenths) {
      return `${base} That is ${exact} bags on the Postcrete table, rounded up to ${t.bags}.`;
    }
    return `${base} That is ${exact} bags on the Postcrete table.`;
  }
  return base;
}

function boardWhy(t: Tally): { flag: string; why: string } {
  const gate = t.gateMm > 0 ? " None under the gate." : "";
  if (t.boards === 0) return { flag: "", why: "No gravel boards. Nothing sits under the gate." };
  const width = formatLength(t.widthMm);
  if (t.cutMm > 0 && t.fullPanels === 0) {
    return { flag: "1 cut", why: `1 board, cut to ${formatLength(t.cutMm)}.${gate}` };
  }
  if (t.cutMm > 0) {
    return {
      flag: "1 cut",
      why: `${t.fullPanels} at ${width}, and 1 cut to ${formatLength(t.cutMm)}.${gate}`,
    };
  }
  const noun = t.boards === 1 ? "board" : "boards";
  return { flag: "", why: `${t.boards} ${noun} at ${width}. Nothing to cut.${gate}` };
}

export function tallyRows(t: Tally): Row[] {
  const panels = panelWhy(t);
  const boards = boardWhy(t);
  return [
    {
      key: "panels",
      href: "/",
      label: "Panels",
      flag: panels.flag,
      value: String(t.panels),
      unit: "",
      why: panels.why,
    },
    {
      key: "posts",
      href: "/posts/",
      label: "Posts",
      flag: "",
      value: String(t.posts),
      unit: "",
      why: postWhy(t),
    },
    {
      key: "bags",
      href: "/postcrete/",
      label: "Postcrete",
      flag: "",
      value: String(t.bags),
      unit: "20 kg bags",
      why: bagWhy(t),
    },
    {
      key: "boards",
      href: "/gravel-boards/",
      label: "Gravel boards",
      flag: boards.flag,
      value: String(t.boards),
      unit: "",
      why: boards.why,
    },
  ];
}
