// src/lib/parse.ts — STATIQUE (lit /export/*)

export type WeekMeta = { week: string; range?: string; };
export type TopItem = { title: string; url: string; source?: string; date?: string; score?: string|number; };
export type SectionItem = { title: string; url: string; source?: string; score?: string|number; };
export type SummarySection = { title: string; items: SectionItem[] };

async function loadText(relativePath: string): Promise<string> {
  const clean = relativePath.startsWith("/") ? relativePath.slice(1) : relativePath;
  const base = typeof document !== "undefined" ? document.baseURI : "/";
  const url = new URL(clean, base).toString();
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`Impossible de charger ${url} (${res.status})`);
  return await res.text();
}

export async function loadWeeksIndex(): Promise<WeekMeta[]> {
  try {
    const txt = await loadText("export/weeks.json");
    const arr = JSON.parse(txt) as Array<{ week: string; range?: string }>;
    return (arr || []).sort((a, b) => (a.week < b.week ? 1 : -1));
  } catch {
    return [{ week: "latest", range: "" }];
  }
}

function summaryPath(meta: { week: string }): string {
  if (meta.week === "latest") return "export/latest/ai_summary.md";
  return `export/${meta.week}/ai_summary.md`;
}

// ---- Parsing Markdown (Top3 + sections) ----

function parseTop3(md: string): TopItem[] {
  const out: TopItem[] = [];
  const topHeader = /(^|\n)##\s*🏆?\s*Top\s*3[^\n]*\n([\s\S]*?)(\n##\s|$)/i;
  const m = md.match(topHeader);
  if (!m) return out;
  const block = m[2];
  const itemRe =
    /^\s*[-–•]\s*(?:\*\*\d+\.\*\*\s*)?\[(.+?)\]\((https?:\/\/[^\s)]+)\)\s*—\s*([^·\n]+)?(?:\s*·\s*([\d-]{8,10}))?(?:\s*·\s*\*\*(\d+)\s*\/\s*100\*\*)?/gim;
  let mm: RegExpExecArray | null;
  while ((mm = itemRe.exec(block)) && out.length < 3) {
    out.push({ title: mm[1]?.trim(), url: mm[2]?.trim(), source: mm[3]?.trim(), date: mm[4]?.trim(), score: mm[5]?.trim() });
  }
  return out;
}

function parseSections(md: string): SummarySection[] {
  const sections: SummarySection[] = [];
  const h2Re = /(^|\n)##\s+([^\n]+)\n/gm;
  const indices: Array<{ title: string; start: number; end: number }> = [];
  let match: RegExpExecArray | null;
  while ((match = h2Re.exec(md))) {
    const title = match[2].trim();
    const start = match.index + match[0].length;
    indices.push({ title, start, end: md.length });
    if (indices.length > 1) indices[indices.length - 2].end = match.index;
  }
  for (const seg of indices) {
    const title = seg.title;
    const block = md.slice(seg.start, seg.end).trim();
    if (/aperçu général/i.test(title)) continue;
    const lineRe =
      /^\s*[-–•]\s*\[(.+?)\]\((https?:\/\/[^\s)]+)\)\s*(?:—\s*([^·\n]+))?(?:\s*·\s*([\d-]{8,10}))?(?:\s*·\s*\*\*(\d+)\s*\/\s*100\*\*)?/gim;
    const items: SectionItem[] = [];
    let lm: RegExpExecArray | null;
    while ((lm = lineRe.exec(block))) {
      items.push({ title: lm[1]?.trim(), url: lm[2]?.trim(), source: lm[3]?.trim(), score: lm[5]?.trim() });
    }
    if (items.length) sections.push({ title, items });
  }
  return sections;
}

export async function loadWeekSummary(meta: WeekMeta): Promise<{ top3: TopItem[]; sections: SummarySection[] }> {
  const md = await loadText(summaryPath(meta));
  return { top3: parseTop3(md), sections: parseSections(md) };
}

export function getDomain(url?: string): string | null {
  if (!url) return null; try { return new URL(url).hostname.replace(/^www\./, ""); } catch { return null; }
}
export function faviconUrl(url?: string, size = 32): string {
  const dom = getDomain(url); if (!dom) return `https://via.placeholder.com/${size}`;
  return `https://www.google.com/s2/favicons?domain=${dom}&sz=${size}`;
}