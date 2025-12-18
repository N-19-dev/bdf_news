#!/usr/bin/env python3
"""
Vérifier des URLs alternatives pour les sources importantes
"""
import asyncio
import aiohttp

# Sources importantes à vérifier avec URLs alternatives
IMPORTANT_SOURCES = {
    "DuckDB Blog": [
        "https://duckdb.org/news/index.xml",  # Ancienne (404)
        "https://duckdb.org/feed.xml",
        "https://duckdb.org/news/rss.xml",
        "https://duckdb.org/blog.xml",
    ],
    "Polars Blog": [
        "https://www.pola.rs/feed.xml",  # Ancienne (404)
        "https://pola.rs/feed.xml",
        "https://www.pola.rs/posts/index.xml",
    ],
    "Apache Airflow Blog": [
        "https://airflow.apache.org/feeds/blog.xml",  # Ancienne (404)
        "https://airflow.apache.org/blog/feed.xml",
        "https://airflow.apache.org/blog/index.xml",
    ],
    "dbt Blog": [
        "https://www.getdbt.com/rss.xml",  # Ancienne (404)
        "https://www.getdbt.com/blog/rss.xml",
        "https://docs.getdbt.com/blog/rss.xml",
        "https://getdbt.com/blog/rss.xml",
    ],
    "Prefect Blog": [
        "https://www.prefect.io/blog/rss.xml",  # Ancienne (404)
        "https://prefect.io/blog/rss.xml",
        "https://www.prefect.io/blog/feed.xml",
    ],
    "Snowflake Blog": [
        "https://www.snowflake.com/blog/feed/",  # Ancienne (404)
        "https://www.snowflake.com/feed/",
        "https://www.snowflake.com/blog/rss/",
    ],
    "Astronomer Blog": [
        "https://www.astronomer.io/blog/rss.xml",  # Ancienne (404)
        "https://astronomer.io/blog/rss.xml",
        "https://www.astronomer.io/feed/",
    ],
    "ClickHouse Blog": [
        "https://clickhouse.com/blog/rss",  # Ancienne (404)
        "https://clickhouse.com/blog/en/rss.xml",
        "https://clickhouse.com/feed.xml",
    ],
    "Delta Lake": [
        "https://delta.io/blog/index.xml",  # Ancienne (404)
        "https://delta.io/blog/feed.xml",
        "https://delta.io/feed.xml",
    ],
    "Grafana Labs": [
        "https://grafana.com/blog/rss/",  # Ancienne (404)
        "https://grafana.com/blog/rss.xml",
        "https://grafana.com/blog/feed/",
    ],
}

async def check_url(session, name, url):
    """Vérifie si une URL répond correctement"""
    try:
        async with session.get(url, timeout=10, allow_redirects=True) as resp:
            if resp.status == 200:
                content_type = resp.headers.get('content-type', '').lower()
                is_feed = any(x in content_type for x in ['xml', 'rss', 'atom'])
                return (url, resp.status, content_type, is_feed)
            else:
                return (url, resp.status, None, False)
    except Exception as e:
        return (url, f"Error: {str(e)[:50]}", None, False)

async def main():
    async with aiohttp.ClientSession() as session:
        for source_name, urls in IMPORTANT_SOURCES.items():
            print(f"\n🔍 {source_name}:")
            tasks = [check_url(session, source_name, url) for url in urls]
            results = await asyncio.gather(*tasks)

            found_working = False
            for url, status, content_type, is_feed in results:
                status_emoji = "✅" if status == 200 else "❌"
                feed_emoji = "📰" if is_feed else ""
                print(f"  {status_emoji} {feed_emoji} {url}")
                print(f"     Status: {status}")
                if content_type:
                    print(f"     Type: {content_type}")

                if status == 200 and is_feed:
                    found_working = True
                    print(f"     ⭐ URL VALIDE TROUVÉE!")

            if not found_working:
                print(f"  ⚠️  Aucune URL valide trouvée - à supprimer")

if __name__ == "__main__":
    asyncio.run(main())
