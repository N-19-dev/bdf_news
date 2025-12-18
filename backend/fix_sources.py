#!/usr/bin/env python3
"""
Corrige et nettoie les sources dans config.yaml
"""
import yaml
from pathlib import Path

# URLs à remplacer (ancien → nouveau)
URL_REPLACEMENTS = {
    "https://duckdb.org/news/index.xml": "https://duckdb.org/feed.xml",
    "https://airflow.apache.org/feeds/blog.xml": "https://airflow.apache.org/blog/index.xml",
    "https://www.getdbt.com/rss.xml": "https://www.getdbt.com/blog/rss.xml",
    "https://www.snowflake.com/blog/feed/": "https://www.snowflake.com/feed/",
}

# URLs à supprimer (pas d'alternative trouvée)
URLS_TO_REMOVE = [
    "https://addons.mozilla.org/en-US/firefox/addon/daily/",
    "https://ai.googleblog.com/feeds/posts/default",
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
    "https://www.pinecone.io/learn/feed.xml",
    "https://www.pola.rs/feed.xml",
    "https://www.prefect.io/blog/rss.xml",
    "https://www.scaleway.com/en/blog/rss/",
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
    sources = config.get("sources", [])

    # Statistiques
    replaced_count = 0
    removed_count = 0

    # Corriger les URLs
    for source in sources:
        old_url = source.get("url")
        if old_url in URL_REPLACEMENTS:
            new_url = URL_REPLACEMENTS[old_url]
            source["url"] = new_url
            replaced_count += 1
            print(f"✏️  CORRIGÉ: {source.get('name')}")
            print(f"   Ancien: {old_url}")
            print(f"   Nouveau: {new_url}\n")

    # Supprimer les sources cassées
    cleaned_sources = [
        src for src in sources
        if src.get("url") not in URLS_TO_REMOVE
    ]

    removed_sources = [
        src for src in sources
        if src.get("url") in URLS_TO_REMOVE
    ]
    removed_count = len(removed_sources)

    # Afficher résumé
    print(f"\n📊 RÉSUMÉ:")
    print(f"  Sources originales: {original_count}")
    print(f"  ✏️  URLs corrigées: {replaced_count}")
    print(f"  ❌ Sources supprimées: {removed_count}")
    print(f"  ✅ Sources finales: {len(cleaned_sources)}\n")

    if removed_count > 0:
        print("Sources supprimées (pas d'alternative trouvée):")
        for src in removed_sources:
            print(f"  - {src.get('name')}")

    # Mettre à jour la config
    config["sources"] = cleaned_sources

    # Backup de l'ancien fichier
    backup_path = config_path.with_suffix('.yaml.backup')
    if config_path.exists():
        config_path.rename(backup_path)
        print(f"\n💾 Backup créé: {backup_path}")

    # Écrire la nouvelle config
    with open(config_path, 'w') as f:
        yaml.dump(config, f, default_flow_style=False, allow_unicode=True, sort_keys=False)

    print(f"✨ Configuration mise à jour: {config_path}")

if __name__ == "__main__":
    main()
