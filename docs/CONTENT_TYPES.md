# 📖 Système de classification par type de contenu

## Vue d'ensemble

Le système distingue maintenant **deux types de contenu** pour offrir une meilleure organisation :

1. **🔧 Articles techniques** (`technical`) : Tutoriels, guides, documentation, articles d'apprentissage
2. **📖 REX & All Hands** (`rex`) : Retours d'expérience, post-mortems, études de cas, présentations internes

## Comment ça fonctionne

### Backend

#### Détection automatique

Le système utilise un algorithme de scoring basé sur des mots-clés pour classifier automatiquement chaque article :

**Mots-clés REX** (voir `backend/config.yaml`) :
- "retour d'expérience", "rex", "all hands"
- "postmortem", "post-mortem"
- "lessons learned", "what we learned"
- "how we built", "how we scaled"
- "migration story", "case study"
- "in production", "war stories"
- "real world", "behind the scenes"

**Scoring** :
- Mot-clé dans le titre : **+30 points**
- Mot-clé dans le contenu : **+10 points** par occurrence
- Patterns spéciaux ("we migrated", "we scaled", etc.) : **+15 points**

**Seuil** : Score >= 40 → classé comme REX

#### Stockage

Le type de contenu est stocké dans la base de données SQLite :

```sql
ALTER TABLE items ADD COLUMN content_type TEXT DEFAULT 'technical'
```

Valeurs possibles :
- `"technical"` (par défaut)
- `"rex"`

### Frontend

#### Interface utilisateur

L'interface propose maintenant **3 onglets** :

1. **📚 Tous les articles** : Affiche tout le contenu
2. **🔧 Articles techniques** : Filtre uniquement les articles techniques
3. **📖 REX & All Hands** : Filtre uniquement les REX

Chaque onglet affiche le nombre d'articles correspondants.

#### Navigation

- Les filtres de catégorie et la recherche fonctionnent **à l'intérieur** de l'onglet sélectionné
- Changement de semaine → Reset sur "Tous les articles"

## Configuration

### Ajuster les mots-clés

Éditez `backend/config.yaml` :

```yaml
content_types:
  rex_keywords:
    - "votre mot-clé"
    - "another keyword"

  rex_title_bonus: 30  # Bonus si dans le titre
  rex_min_score: 40    # Score minimum pour REX
```

### Tester la classification

```bash
cd backend
python3 -c "
from content_classifier import detect_content_type
import yaml

config = yaml.safe_load(open('config.yaml'))

# Test 1: Article REX
type1 = detect_content_type(
    'How we migrated to Snowflake',
    'Our journey scaling data infrastructure',
    'We learned many lessons...',
    config
)
print(f'Test 1: {type1}')  # Devrait être 'rex'

# Test 2: Article technique
type2 = detect_content_type(
    'Introduction to dbt',
    'Learn the basics of data transformation',
    'This tutorial covers...',
    config
)
print(f'Test 2: {type2}')  # Devrait être 'technical'
"
```

## Export des données

### Format JSON

Tous les exports incluent maintenant le champ `content_type` :

```json
{
  "category_key": [
    {
      "title": "How we scaled our data platform",
      "url": "https://...",
      "content_type": "rex",
      "score": 85
    }
  ]
}
```

### Exports disponibles

- `export/{week}/digest.json` : Tous les articles crawlés (avec `content_type`)
- `export/{week}/ai_selection.json` : Articles sélectionnés par score (avec `content_type`)
- `export/{week}/summary.json` : Résumé LLM + top3 (avec `content_type`)

## Migration

### Bases de données existantes

La migration est **automatique** au premier lancement :

1. Le script détecte que la colonne `content_type` n'existe pas
2. Ajoute la colonne avec la valeur par défaut `'technical'`
3. Les nouveaux articles seront classés automatiquement

### Reclassifier les anciens articles

Si vous voulez reclassifier les articles existants :

```python
import sqlite3
from content_classifier import detect_content_type
import yaml

config = yaml.safe_load(open('config.yaml'))
conn = sqlite3.connect('veille.db')

# Récupérer les articles
cursor = conn.execute("SELECT id, title, summary, content FROM items")

for row in cursor:
    id, title, summary, content = row
    content_type = detect_content_type(title, summary, content, config)
    conn.execute("UPDATE items SET content_type = ? WHERE id = ?", (content_type, id))

conn.commit()
conn.close()
```

## Cas d'usage

### Pour les utilisateurs

**Vous cherchez :**
- Des tutoriels et guides ? → Onglet "Articles techniques"
- Des retours d'expérience d'entreprises ? → Onglet "REX & All Hands"
- Tout parcourir ? → Onglet "Tous les articles"

### Pour les contributeurs

**Ajouter une source spécialisée REX :**

```yaml
sources:
  - name: "Eng Blog - PostMortems"
    url: "https://example.com/postmortems/feed"
```

Les articles seront automatiquement classés comme REX s'ils contiennent les bons mots-clés.

## Statistiques

Après un crawl, vous pouvez voir la répartition :

```bash
cd backend
sqlite3 veille.db "
  SELECT
    content_type,
    COUNT(*) as count,
    ROUND(AVG(final_score), 2) as avg_score
  FROM items
  WHERE published_ts >= strftime('%s', 'now', '-7 days')
  GROUP BY content_type
"
```

Output exemple :
```
technical|45|67.3
rex|12|72.8
```

## Troubleshooting

### Problème : Tous les articles sont classés "technical"

**Causes possibles :**
1. Les mots-clés REX ne matchent pas le contenu
2. Le seuil `rex_min_score` est trop élevé

**Solution :** Ajuster les mots-clés ou baisser le seuil dans `config.yaml`

### Problème : Trop d'articles classés "rex"

**Solution :** Augmenter `rex_min_score` dans `config.yaml`

### Problème : La colonne content_type n'existe pas

**Solution :** Le script devrait la créer automatiquement. Si non :

```bash
cd backend
sqlite3 veille.db "ALTER TABLE items ADD COLUMN content_type TEXT DEFAULT 'technical'"
```

## Prochaines améliorations

Améliorations potentielles :

- [ ] ML pour améliorer la classification
- [ ] Plus de types (opinions, comparaisons, benchmarks)
- [ ] Notation de confiance pour la classification
- [ ] Interface pour corriger manuellement la classification
- [ ] Analyse de la langue (FR vs EN)

## Feedback

Trouvez un article mal classé ? Ouvrez une issue avec :
- URL de l'article
- Type actuel vs type attendu
- Suggestion de mots-clés à ajouter
