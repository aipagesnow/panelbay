import "./style.css";
import { countCloseboard, type BoardWidth } from "./closeboard-calc";

const form = document.querySelector<HTMLFormElement>("#cb");
const host = document.querySelector<HTMLElement>("#tally");

const num = (name: string) => {
  const el = form?.elements.namedItem(name) as HTMLInputElement | null;
  return el && el.value.trim() !== "" ? Number(el.value.replace(",", ".")) : NaN;
};

function row(label: string, value: string, why: string): HTMLElement {
  const a = document.createElement("article");
  a.className = "row";
  const l = document.createElement("span");
  l.className = "row-label";
  l.textContent = label;
  const f = document.createElement("div");
  f.className = "figure";
  const n = document.createElement("p");
  n.className = "num";
  n.textContent = value;
  f.append(n);
  const w = document.createElement("p");
  w.className = "why";
  w.textContent = why;
  a.append(l, f, w);
  return a;
}

function paint(): void {
  if (!form || !host) return;
  const board = Number((form.querySelector<HTMLInputElement>('input[name="board"]:checked')?.value ?? "125")) as BoardWidth;
  const lengthEmpty = Number.isNaN(num("length"));
  const r = countCloseboard({ length: num("length"), height: num("height"), board, bay: num("bay") });
  host.replaceChildren();
  if (!r.ok) {
    const p = document.createElement("p");
    p.className = lengthEmpty ? "idle" : "problem";
    p.textContent = r.message;
    host.append(p);
    return;
  }
  const t = r.tally;
  const bay = t.bayLength.toFixed(2);
  host.append(
    row("Boards", String(t.boards), `${board} mm boards cover ${t.cover} mm each once overlapped, rounded up.`),
    row("Posts", String(t.posts), `${t.bays} bays of ${bay} m need one post more than bays.`),
    row("Arris rails", String(t.rails), `${t.railsPerBay} rails a bay for this height.`),
    row("Nails", String(t.nails), `One 50 mm nail per board on each rail.`),
    row("Gravel boards", String(t.gravelBoards), "One a bay, cut to the bay length."),
    row("Postcrete bags", String(t.bags), "2 bags of 20 kg a post, for 100 mm posts in 300 × 600 mm holes."),
  );
}

form?.addEventListener("submit", (e) => e.preventDefault());
form?.addEventListener("input", paint);
form?.addEventListener("change", paint);
paint();
