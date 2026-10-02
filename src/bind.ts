import "./style.css";
import { assess, tallyRows, type Assessed, type Focus, type Row } from "./tally";

const STORAGE = "panelbay-run";
const LOCAL = new Set(["/", "/posts/", "/postcrete/", "/gravel-boards/", "/height/"]);

export function bind(focus: Focus | null): void {
  const form = document.querySelector<HTMLFormElement>("#run");
  if (!form) {
    syncLinks(recall());
    return;
  }

  restore(form);

  const gate = form.querySelector<HTMLInputElement>('input[name="gate"]');
  const gateWidth = form.querySelector<HTMLElement>(".gate-width");
  const syncGate = () => {
    if (gate && gateWidth) gateWidth.hidden = !gate.checked;
  };

  const paint = () => {
    syncGate();
    const query = writeQuery(form);
    remember(query);
    const next = query ? `${location.pathname}?${query}` : location.pathname;
    if (`${location.pathname}${location.search}` !== next) {
      history.replaceState(null, "", next);
    }
    syncLinks(query);
    const host = document.querySelector<HTMLElement>("#tally");
    if (host && focus) renderTally(host, assess(readRaw(form)), focus);
  };

  form.addEventListener("submit", (event) => event.preventDefault());
  form.addEventListener("input", paint);
  form.addEventListener("change", paint);
  paint();
}

function readRaw(form: HTMLFormElement) {
  const data = new FormData(form);
  return {
    length: String(data.get("length") ?? ""),
    width: String(data.get("width") ?? ""),
    gateOn: data.get("gate") === "on",
    gate: String(data.get("gateWidth") ?? ""),
    wall: String(data.get("wall") ?? "0"),
    post: String(data.get("post") ?? "100"),
  };
}

function writeQuery(form: HTMLFormElement): string {
  const raw = readRaw(form);
  const params = new URLSearchParams();
  const length = raw.length.trim();
  const width = raw.width.trim();
  if (length) params.set("length", length);
  if (width && width !== "1.83") params.set("width", width);
  if (raw.gateOn) params.set("gate", raw.gate.trim() || "0.9");
  if (raw.wall === "1" || raw.wall === "2") params.set("wall", raw.wall);
  if (raw.post === "75") params.set("post", "75");
  return params.toString();
}

function restore(form: HTMLFormElement): void {
  const params = new URLSearchParams(location.search);
  const stored = recall();
  const source = [...params.keys()].length > 0 ? params : new URLSearchParams(stored);

  const length = source.get("length");
  const width = source.get("width");
  const gate = source.get("gate");
  const wall = source.get("wall");
  const post = source.get("post");

  const lengthInput = form.querySelector<HTMLInputElement>("#length");
  const widthInput = form.querySelector<HTMLInputElement>("#width");
  const gateInput = form.querySelector<HTMLInputElement>("#gate");
  const gateWidthInput = form.querySelector<HTMLInputElement>("#gate-width");
  if (length !== null && lengthInput) lengthInput.value = length;
  if (width !== null && widthInput) widthInput.value = width;
  if (gate !== null && gateInput && gateWidthInput) {
    gateInput.checked = true;
    gateWidthInput.value = gate;
  }
  if (wall === "0" || wall === "1" || wall === "2") {
    const radio = form.querySelector<HTMLInputElement>(`input[name="wall"][value="${wall}"]`);
    if (radio) radio.checked = true;
  }
  if (post === "75" || post === "100") {
    const radio = form.querySelector<HTMLInputElement>(`input[name="post"][value="${post}"]`);
    if (radio) radio.checked = true;
  }
}

function remember(query: string): void {
  try {
    if (query) sessionStorage.setItem(STORAGE, query);
    else sessionStorage.removeItem(STORAGE);
  } catch {
    /* Storage can be blocked. The address bar still holds the run. */
  }
}

function recall(): string {
  try {
    return sessionStorage.getItem(STORAGE) ?? "";
  } catch {
    return "";
  }
}

function syncLinks(query: string): void {
  const search = query ? `?${query}` : "";
  document.querySelectorAll<HTMLAnchorElement>("a[href]").forEach((anchor) => {
    const raw = anchor.getAttribute("href");
    if (!raw || raw.startsWith("#")) return;
    let url: URL;
    try {
      url = new URL(raw, location.origin);
    } catch {
      return;
    }
    if (url.origin !== location.origin || !LOCAL.has(url.pathname)) return;
    const next = `${url.pathname}${search}`;
    if (anchor.getAttribute("href") !== next) anchor.setAttribute("href", next);
  });
}

function renderTally(host: HTMLElement, result: Assessed, focus: Focus): void {
  host.replaceChildren();
  if (!result.ok) {
    const note = document.createElement("p");
    note.className = result.idle ? "idle" : "problem";
    note.textContent = result.message;
    host.append(note);
    return;
  }

  const rows = tallyRows(result.tally);
  const ordered =
    focus === "all" ? rows : [rows.find((row) => row.key === focus)!, ...rows.filter((row) => row.key !== focus)];

  ordered.forEach((row, index) => {
    if (focus !== "all" && index === 1) {
      const rest = document.createElement("p");
      rest.className = "rest-title";
      rest.textContent = "Rest of this run";
      host.append(rest);
    }
    const mode = focus === "all" ? "even" : row.key === focus ? "focus" : "quiet";
    host.append(renderRow(row, mode));
  });
}

function renderRow(row: Row, mode: "even" | "focus" | "quiet"): HTMLElement {
  const article = document.createElement("article");
  article.className = mode === "even" ? "row" : `row is-${mode}`;

  const link = document.createElement("a");
  link.className = "row-label";
  link.href = row.href;
  link.append(document.createTextNode(row.label));
  if (row.flag) {
    const flag = document.createElement("span");
    flag.className = "flag";
    flag.textContent = row.flag;
    link.append(flag);
  }

  const figure = document.createElement("div");
  figure.className = "figure";
  const num = document.createElement("p");
  num.className = "num";
  num.textContent = row.value;
  figure.append(num);
  if (row.unit) {
    const unit = document.createElement("p");
    unit.className = "unit";
    unit.textContent = row.unit;
    figure.append(unit);
  }

  const why = document.createElement("p");
  why.className = "why";
  why.textContent = row.why;
  article.append(link, figure, why);
  return article;
}
