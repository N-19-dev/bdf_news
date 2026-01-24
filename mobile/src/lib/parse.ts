// src/lib/parse.ts - React Native version

const BASE_URL = "https://n-19-dev.github.io/veille";

export type WeekMeta = { week: string; range?: string };
export type TopItem = { title: string; url: string; source?: string; score?: string | number; tech_level?: string; marketing_score?: number };
export type VideoItem = { title: string; url: string; source?: string; score?: string | number; source_type?: "youtube" | "podcast" };
export type SectionItem = { title: string; url: string; source?: string; score?: string | number; content_type?: string; tech_level?: string; marketing_score?: number };
export type SummarySection = { title: string; items: SectionItem[] };

type RawSelectionItem = {
  title?: string;
  url?: string;
  source_name?: string;
  score?: number | string;
  content_type?: string;
  tech_level?: string;
  marketing_score?: number;
  source_type?: "youtube" | "podcast" | "article";
};

async function loadJson<T>(path: string): Promise<T> {
  const url = `${BASE_URL}/${path}`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to load ${url} (${res.status})`);
  return res.json();
}

async function loadText(path: string): Promise<string> {
  const url = `${BASE_URL}/${path}`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to load ${url} (${res.status})`);
  return res.text();
}

export async function loadWeeksIndex(): Promise<WeekMeta[]> {
  try {
    const arr = await loadJson<Array<{ week: string; range?: string }>>("export/weeks.json");
    return (arr || []).sort((a, b) => (a.week < b.week ? 1 : -1));
  } catch {
    return [{ week: "latest", range: "" }];
  }
}

let _categoriesCache: Record<string, string> | null = null;

async function loadCategories(): Promise<Record<string, string>> {
  if (_categoriesCache) return _categoriesCache;
  try {
    _categoriesCache = await loadJson<Record<string, string>>("export/categories.json");
    return _categoriesCache!;
  } catch {
    return {};
  }
}

function summaryPath(meta: WeekMeta): string {
  return meta.week === "latest" ? "export/latest/ai_summary.md" : `export/${meta.week}/ai_summary.md`;
}

function parseOverview(md: string): string {
  const rx = /(^|\n)##\s*(?:🟦\s*)?Aperçu général de la semaine\s*\n([\s\S]*?)(\n##\s|$)/i;
  const m = md.match(rx);
  return m ? m[2].trim() : "";
}

async function loadTop3Json(meta: WeekMeta): Promise<TopItem[]> {
  try {
    const path = meta.week === "latest" ? "export/latest/top3.json" : `export/${meta.week}/top3.json`;
    const data = await loadJson<RawSelectionItem[]>(path);
    return data.map((item) => ({
      title: item.title || "",
      url: item.url || "",
      source: item.source_name || "",
      score: item.score,
      tech_level: item.tech_level || "intermediate",
      marketing_score: item.marketing_score || 0,
    }));
  } catch {
    return [];
  }
}

async function loadTopVideosJson(meta: WeekMeta): Promise<VideoItem[]> {
  try {
    const path = meta.week === "latest" ? "export/latest/top3_videos.json" : `export/${meta.week}/top3_videos.json`;
    const data = await loadJson<RawSelectionItem[]>(path);
    return data.map((item) => ({
      title: item.title || "",
      url: item.url || "",
      source: item.source_name || "",
      score: item.score,
      source_type: item.source_type === "youtube" ? "youtube" : "podcast",
    }));
  } catch {
    return [];
  }
}

async function loadSelectionJson(meta: WeekMeta): Promise<Record<string, RawSelectionItem[]>> {
  try {
    const path = meta.week === "latest" ? "export/latest/ai_selection.json" : `export/${meta.week}/ai_selection.json`;
    return await loadJson<Record<string, RawSelectionItem[]>>(path);
  } catch {
    return {};
  }
}

export async function loadWeekSummary(meta: WeekMeta): Promise<{
  overview: string;
  top3: TopItem[];
  topVideos: VideoItem[];
  sections: SummarySection[];
}> {
  const md = await loadText(summaryPath(meta));
  const top3Data = await loadTop3Json(meta);
  const topVideosData = await loadTopVideosJson(meta);
  const selectionData = await loadSelectionJson(meta);
  const categories = await loadCategories();

  const sections: SummarySection[] = [];

  for (const [categoryKey, items] of Object.entries(selectionData)) {
    const categoryTitle = categories[categoryKey] || categoryKey;
    const sectionItems: SectionItem[] = items.map((item) => ({
      title: item.title || "",
      url: item.url || "",
      source: item.source_name || "",
      score: item.score,
      content_type: item.content_type || "technical",
      tech_level: item.tech_level || "intermediate",
      marketing_score: item.marketing_score || 0,
    }));

    if (sectionItems.length > 0) {
      sections.push({ title: categoryTitle, items: sectionItems });
    }
  }

  return {
    overview: parseOverview(md),
    top3: top3Data,
    topVideos: topVideosData,
    sections,
  };
}

export async function loadLatestWeek(): Promise<WeekMeta> {
  const arr = await loadWeeksIndex();
  return arr[0] ?? { week: "latest", range: "" };
}

export function getDomain(url?: string): string | null {
  if (!url) return null;
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}

export function faviconUrl(url?: string, size = 32): string {
  const dom = getDomain(url);
  return dom ? `https://www.google.com/s2/favicons?domain=${dom}&sz=${size}` : `https://via.placeholder.com/${size}`;
}
