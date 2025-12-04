# 🏢 Sources Engineering Blogs (REX & All Hands)

## 📊 Vue d'ensemble

**43 sources** d'engineering blogs ont été ajoutées pour capturer les retours d'expérience (REX), post-mortems et études de cas.

Ces sources sont reconnues dans l'industrie pour la qualité de leurs articles techniques narratifs décrivant des incidents, migrations, et architectures à grande échelle.

## 🌟 Top 10 sources REX

| Rang | Source | Poids | Spécialités |
|------|--------|-------|-------------|
| 1 | **Netflix Tech Blog** | 0.95 | Microservices, Chaos Engineering, Scale extrême |
| 2 | **Uber Engineering** | 0.90 | Post-mortems d'incidents, Architecture distribuée |
| 3 | **Airbnb Engineering** | 0.90 | Migrations de données, Infrastructure |
| 4 | **Stripe Engineering** | 0.85 | Fiabilité financière, Infrastructure payments |
| 5 | **LinkedIn Engineering** | 0.85 | Scale social network, Real-time data |
| 6 | **Meta Engineering** | 0.85 | Infrastructure globale, ML at scale |
| 7 | **GitHub Engineering** | 0.85 | Git infrastructure, Availability |
| 8 | **Spotify Engineering** | 0.85 | Streaming at scale, Recommendation systems |
| 9 | **Shopify Engineering** | 0.80 | E-commerce scale, Black Friday incidents |
| 10 | **DoorDash Engineering** | 0.80 | Real-time logistics, Delivery optimization |

## 📂 Sources par catégorie

### 🏢 GAFAM & Big Tech (10)
- Netflix, Uber, Airbnb, LinkedIn, Meta
- Instagram, Twitter/X, Pinterest, Lyft

**Exemples d'articles** :
- "How Netflix Processes 400+ Billion Events Daily"
- "Uber's Real-Time Pricing Architecture"
- "Airbnb's Migration to Kubernetes"

### 💰 Fintech & Payments (4)
- Stripe, PayPal, Wise, Revolut

**Exemples d'articles** :
- "Stripe's Approach to Reliability"
- "How PayPal Scaled to 1M Transactions/Minute"

### 🔧 Developer Tools (5)
- GitHub, GitLab, Slack, Atlassian, Dropbox

**Exemples d'articles** :
- "GitHub's MySQL Infrastructure"
- "How We Scaled GitLab to 100K Users"

### 🛒 E-commerce (4)
- Shopify, Etsy, Booking.com, Walmart

**Exemples d'articles** :
- "Shopify's Black Friday: Handling 10K Orders/Minute"
- "Etsy's Search Infrastructure Evolution"

### ☁️ SaaS & Cloud (4)
- Heroku, Twilio, Salesforce, Zendesk

### 🚗 Ride-sharing & Delivery (2)
- DoorDash, Grab

**Exemples d'articles** :
- "DoorDash's Real-Time ML Pipeline"
- "Grab's Distributed Tracing at Scale"

### 🎵 Streaming & Media (2)
- Spotify, SoundCloud

**Exemples d'articles** :
- "Spotify's Event Delivery System"
- "How Spotify Recommends Music"

### 🇪🇺 European Tech (3)
- Monzo, N26, BlaBlaCar

### 📈 Analytics & Data (3)
- Segment, Amplitude, Confluent

**Exemples d'articles** :
- "Segment's Data Pipeline Architecture"
- "Confluent's Kafka Infrastructure"

## 🎯 Types d'articles attendus

### Post-mortems & Incidents
```
"Database Outage Post-mortem - What We Learned"
"How We Recovered from a Major Incident"
"Lessons from Our Worst Day"
```
**Mots-clés détectés** : postmortem, incident, outage, recovery

### Migrations & Scale
```
"Migrating 100TB to Snowflake: Our Journey"
"How We Scaled to 1M Users"
"Moving from MySQL to PostgreSQL"
```
**Mots-clés détectés** : migration, how we scaled, our journey

### Architecture Decisions
```
"Why We Chose Kubernetes Over ECS"
"Building a Real-Time Data Platform"
"Our Microservices Journey"
```
**Mots-clés détectés** : how we built, architecture, journey

### Case Studies
```
"Case Study: Reducing API Latency by 80%"
"How We Achieved 99.99% Uptime"
"In Production: Lessons from 5 Years"
```
**Mots-clés détectés** : case study, in production, lessons learned

## 🚀 Comment crawler ces sources

### Option 1 : Crawl complet avec toutes les sources

```bash
cd backend
source .venv/bin/activate
python main.py
```

**Durée estimée** : ~20-30 minutes (avec les 43 nouvelles sources)

**Articles attendus** : 50-100 nouveaux articles, dont 10-20% de REX

### Option 2 : Test rapide (5 sources top)

```bash
cd backend
source .venv/bin/activate
python veille_tech.py --config config_rex_test.yaml
```

**Durée** : ~2-3 minutes

**Sources testées** : Netflix, Uber, Airbnb, Stripe, GitHub

### Option 3 : Crawl par batch

Pour éviter les rate limits, crawlez en plusieurs fois :

```python
# Éditer config.yaml et commenter temporairement certaines sources
# Lancer plusieurs fois avec différents groupes de sources
```

## 📈 Métriques attendues

Après le premier crawl complet avec les nouvelles sources :

| Métrique | Estimation |
|----------|------------|
| **Nouveaux articles** | 60-120 |
| **Articles REX** | 15-30 (15-25%) |
| **Articles Technical** | 90-100 (75-85%) |
| **Sources actives** | 35-40 / 43 |
| **Score moyen REX** | 65-75 |

## 🔍 Vérifier les résultats

Après le crawl :

```bash
# Compter les REX dans la DB
cd backend
sqlite3 veille.db "
  SELECT
    content_type,
    COUNT(*) as count
  FROM items
  WHERE published_ts >= strftime('%s', 'now', '-7 days')
  GROUP BY content_type
"
```

Output attendu :
```
technical|45
rex|12
```

## ⚙️ Configuration avancée

### Ajuster le seuil de détection REX

Si trop ou pas assez d'articles sont classés REX, ajustez dans `config.yaml` :

```yaml
content_types:
  rex_min_score: 40  # Diminuer pour plus de REX (ex: 35)
                      # Augmenter pour moins de REX (ex: 50)
```

### Ajouter des mots-clés spécifiques

```yaml
content_types:
  rex_keywords:
    - "votre mot-clé personnalisé"
    - "incident report"
    - "architecture evolution"
```

### Ajuster les poids des sources

```yaml
relevance:
  source_weights:
    "Nouvelle Source Engineering": 0.85
```

## 🎯 Exemples concrets

### Article REX typique détecté

```json
{
  "title": "How We Migrated 10 Million Users to a New Auth System",
  "source": "Stripe Engineering Blog",
  "content_type": "rex",
  "score": 87.5,
  "keywords_matched": [
    "how we migrated",
    "lessons learned",
    "in production"
  ]
}
```

### Article Technical typique

```json
{
  "title": "Getting Started with Apache Kafka",
  "source": "Confluent Blog",
  "content_type": "technical",
  "score": 72.3
}
```

## 🐛 Troubleshooting

### Problème : Aucun REX détecté

**Causes** :
1. Les sources n'ont pas publié récemment
2. Le seuil `rex_min_score` est trop élevé
3. Les mots-clés ne matchent pas le vocabulaire des articles

**Solutions** :
1. Augmenter `lookback_days` dans `config.yaml`
2. Baisser `rex_min_score` à 35
3. Ajouter des variantes de mots-clés

### Problème : Trop d'articles classés REX

**Solution** : Augmenter `rex_min_score` à 50

### Problème : Sources en erreur (404, 429)

**Normal** : Certains RSS feeds peuvent être down ou rate-limitées.

**Action** : Les sources OK seront crawlées, ignorez les erreurs ponctuelles.

## 📚 Ressources

- [Documentation Classification](CONTENT_TYPES.md)
- [Config complète](../backend/config.yaml)
- [Config test REX](../backend/config_rex_test.yaml)

## 🎉 Prochaine étape

Lancez un crawl complet pour voir les premiers vrais articles REX :

```bash
cd backend
source .venv/bin/activate
python main.py
```

Puis rafraîchissez l'interface : **http://localhost:5173/veille/**

Et cliquez sur l'onglet **📖 REX & All Hands** pour voir les résultats !
