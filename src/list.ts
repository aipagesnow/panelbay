import { formatLength, type Tally } from "./tally";

export function shoppingList(t: Tally): string[] {
  const width = formatLength(t.widthMm);
  const lines: string[] = [];
  const cut = t.cutMm > 0 ? `, 1 cut to ${formatLength(t.cutMm)}` : "";
  if (t.panels > 0) lines.push(`${t.panels} fence panels, ${width} wide${cut}`);
  if (t.posts > 0) lines.push(`${t.posts} posts, ${t.post.label} (2.4 m long for a fence 1.8 m high)`);
  if (t.bags > 0) lines.push(`${t.bags} bags of Postcrete, 20 kg`);
  if (t.boards > 0) lines.push(`${t.boards} gravel boards, ${width} long${cut}`);
  if (t.gateMm > 0) lines.push(`1 gate, ${formatLength(t.gateMm)} wide, with hinges and a latch`);
  return lines;
}

export function listText(t: Tally): string {
  return ["Panel Bay shopping list", `Run: ${formatLength(t.lengthMm)}`, ...shoppingList(t).map((l) => `- ${l}`)].join("\n");
}
