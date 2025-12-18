#!/usr/bin/env python3
"""
Script pour nettoyer les sources cassées de config.yaml
"""
import yaml
from pathlib import Path

# Liste des URLs cassées (404)
BROKEN_URLS = [
    "https://addons.mozilla.org/en-US/firefox/addon/daily/",
    "https://ai.googleblog.com/feeds/posts/default",
    "https://airflow.apache.org/feeds/blog.xml",
    "https://blog.ippon.fr/feed.xml",
    "https://blog.min.io/index.xml",
    "https://clickhouse.com/blog/rss",
    "https://cloud.google.com/bigquery/rss.xml",
    "https://cloud.google.com/blog/feeds/posts/default",
    "https://delta.io/blog/index.xml",
    "https://dev.to/t/data/rss",
    "https://dev.to/t/dataengineering/rss",
    "https://dev.to/t/datascience/rss",
    "https://dev.to/t/machinelearning/rss",
    "https://developers.soundcloud.com/blog/feed.xml",
    "https://duckdb.org/news/index.xml",
    "https://fastapi.tiangolo.com/feed.xml",
    "https://grafana.com/blog/rss/",
    "https://greatexpectations.io/blog/feed",
    "https://medium.com/feed/blablacar-tech",
    "https://medium.com/tag/data-engineering/rss",
    "https://medium.com/tag/data/rss",
    "https://medium.com/tag/machine-learning/rss",
    "https://monzo.com/blog/feed",
    "https://segment.com/blog/feed/",
    "https://shopify.engineering/blog.atom",
    "https://wandb.ai/site/rss.xml",
    "https://www.astronomer.io/blog/rss.xml",
    "https://www.atlassian.com/blog/rss/engineering.xml",
    "https://www.clever-cloud.com/blog/feed.xml",
    "https://www.collibra.com/us/en/blog/rss",
    "https://www.confluent.io/blog/feed/",
    "https://www.datadoghq.com/blog/engineering/rss/",
    "https://www.datafold.com/blog/rss.xml",
    "https://www.getdbt.com/rss.xml",
    "https://www.pinecone.io/learn/feed.xml",
    "https://www.pola.rs/feed.xml",
    "https://www.prefect.io/blog/rss.xml",
    "https://www.scaleway.com/en/blog/rss/",
    "https://www.snowflake.com/blog/feed/",
    "https://www.starrocks.io/blog/rss",
    "https://www.startdataengineering.com/index.xml",
    "https://www.twilio.com/blog/tag/engineering/feed",
]

def main():
    config_path = Path("config.yaml")

    # Charger config
    with open(config_path) as f:
        config = yaml.safe_load(f)

    original_count = len(config.get("sources", []))

    # Filtrer les sources cassées
    cleaned_sources = [
        src for src in config.get("sources", [])
        if src.get("url") not in BROKEN_URLS
    ]

    removed_count = original_count - len(cleaned_sources)

    # Afficher les sources supprimées
    print(f"📊 Sources originales: {original_count}")
    print(f"❌ Sources supprimées: {removed_count}")
    print(f"✅ Sources conservées: {len(cleaned_sources)}\n")

    if removed_count > 0:
        print("Sources supprimées:")
        removed_sources = [
            src for src in config.get("sources", [])
            if src.get("url") in BROKEN_URLS
        ]
        for src in removed_sources:
            print(f"  - {src.get('name')} ({src.get('url')})")

        # Mettre à jour la config
        config["sources"] = cleaned_sources

        # Backup de l'ancien fichier
        backup_path = config_path.with_suffix('.yaml.backup')
        config_path.rename(backup_path)
        print(f"\n💾 Backup créé: {backup_path}")

        # Écrire la nouvelle config
        with open(config_path, 'w') as f:
            yaml.dump(config, f, default_flow_style=False, allow_unicode=True, sort_keys=False)

        print(f"✨ Configuration nettoyée: {config_path}")
    else:
        print("Aucune source à supprimer.")

if __name__ == "__main__":
    main()
