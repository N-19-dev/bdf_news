#!/usr/bin/env python3
"""Convert ai_selection.json to summary.json format"""
import json
from pathlib import Path
import yaml

def load_config():
    return yaml.safe_load(Path("config.yaml").read_text())

def get_category_title(cfg, category_key: str) -> str:
    """Get readable category title"""
    for cat in cfg.get("categories", []):
        if cat.get("key") == category_key:
            return cat.get("title", category_key)
    return category_key

def convert_to_summary(week_label="2025w49"):
    cfg = load_config()

    # Load ai_selection.json
    export_dir = Path("export") / week_label
    ai_selection_path = export_dir / "ai_selection.json"

    if not ai_selection_path.exists():
        print(f"Error: {ai_selection_path} not found")
        return

    ai_selection = json.loads(ai_selection_path.read_text())

    # Read range
    range_path = export_dir / "range.txt"
    date_range = range_path.read_text().strip() if range_path.exists() else "2025-12-01 → 2025-12-08"

    # Convert to summary format
    summary = {
        "week": week_label,
        "range": date_range,
        "overview": "Cette semaine : focus sur les retours d'expérience (REX) et articles techniques de qualité.",
        "top3": [],
        "sections": []
    }

    # Group by category
    for cat_key, items in ai_selection.items():
        if not items:
            continue

        cat_title = get_category_title(cfg, cat_key)

        # Sort by score descending
        sorted_items = sorted(items, key=lambda x: x.get("score", 0), reverse=True)

        # Take top items per category
        top_items = sorted_items[:5]

        section = {
            "title": cat_title,
            "items": [
                {
                    "url": item["url"],
                    "title": item["title"],
                    "summary": item.get("summary", ""),
                    "published_ts": item.get("published_ts", 0),
                    "source_name": item.get("source_name", ""),
                    "score": item.get("score", 0),
                    "content_type": item.get("content_type", "technical")
                }
                for item in top_items
            ]
        }

        summary["sections"].append(section)

    # Write summary.json
    summary_path = export_dir / "summary.json"
    summary_path.write_text(json.dumps(summary, indent=2, ensure_ascii=False))

    print(f"✅ Generated {summary_path}")
    print(f"   Sections: {len(summary['sections'])}")
    total_items = sum(len(s['items']) for s in summary['sections'])
    rex_items = sum(1 for s in summary['sections'] for i in s['items'] if i.get('content_type') == 'rex')
    print(f"   Total items: {total_items}")
    print(f"   REX items: {rex_items}")

if __name__ == "__main__":
    convert_to_summary()
