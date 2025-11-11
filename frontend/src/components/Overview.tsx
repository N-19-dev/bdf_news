// src/components/Overview.tsx
import React from "react";
import { marked } from "marked";

export default function Overview({ content }: { content?: string }) {
  if (!content) return null;

  const html = React.useMemo(() => {
    // Configuration du parser Markdown
    marked.setOptions({
      breaks: true,
      gfm: true,
    });
    return marked.parse(content);
  }, [content]);

  return (
    <section className="bg-white border rounded-2xl p-8 shadow-sm">
      <div className="mb-5">
        <div className="text-xs font-semibold tracking-widest uppercase text-neutral-500">
          Aperçu
        </div>
        <h2 className="text-2xl md:text-3xl font-bold mt-1 flex items-center gap-2">
          <span className="text-blue-600">🟦</span> Aperçu général de la semaine
        </h2>
        <div className="h-1 bg-accent w-24 mt-3 rounded-full" />
      </div>

      <article
        className="prose prose-neutral max-w-none prose-p:leading-relaxed prose-a:text-blue-600 hover:prose-a:text-blue-500 prose-strong:text-neutral-900 prose-li:my-0.5"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </section>
  );
}