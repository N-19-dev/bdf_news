import ArticleCard from "./ArticleCard";

type Item = {
  title: string;
  url: string;
  source: string;
  date?: string;
  score?: number;
};

export default function Top3({ items, weekLabel }: { items: Item[]; weekLabel?: string }) {
  if (!items?.length) return null;
  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold">🏆 Top 3 de la semaine</h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {items.map((it, i) => (
          <ArticleCard
            key={i}
            title={it.title}
            url={it.url}
            source={it.source}
            date={it.date}
            score={it.score}
            weekLabel={weekLabel}
            category="top3"
          />
        ))}
      </div>
    </section>
  );
}