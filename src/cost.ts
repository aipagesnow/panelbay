import "./style.css";
import { estimate, gbp, type FenceType } from "./cost-calc";

const form = document.querySelector<HTMLFormElement>("#cost");
const host = document.querySelector<HTMLElement>("#tally");

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
  n.style.fontSize = "1.9rem";
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
  const val = (n: string) => (form.elements.namedItem(n) as HTMLInputElement | null)?.value.trim() ?? "";
  const lengthRaw = val("length");
  const type = (form.querySelector<HTMLInputElement>('input[name="type"]:checked')?.value ?? "lap") as FenceType;
  const removal = form.querySelector<HTMLInputElement>('input[name="removal"]')?.checked ?? false;
  const e = estimate({ length: lengthRaw ? Number(lengthRaw.replace(",", ".")) : NaN, type, removal, gates: Number(val("gates") || "0") });
  host.replaceChildren();
  if (!e.ok) {
    const p = document.createElement("p");
    p.className = lengthRaw ? "problem" : "idle";
    p.textContent = e.message;
    host.append(p);
    return;
  }
  const span = (x: { low: number; high: number }) => `${gbp(x.low)}–${gbp(x.high)}`;
  host.append(row("Total, fitted", span(e.total), "A budget range for planning, not a quote. Get at least three quotes."));
  host.append(row("Fence", span(e.fence), "Supplied and fitted, 1.8 m high, including posts, gravel boards and Postcrete."));
  if (removal) host.append(row("Old fence removed", span(e.removal), "Taking down and disposing of the old fence."));
  if (e.gates.high > 0) host.append(row("Gates", span(e.gates), "Single garden gates, fitted."));
}

form?.addEventListener("submit", (ev) => ev.preventDefault());
form?.addEventListener("input", paint);
form?.addEventListener("change", paint);
paint();
