# Daily Email Digest - Setup Guide

**Phase 2 du PRODUCT_VISION.md** : Système de notification quotidienne par email

## Vue d'ensemble

Le système envoie **1 article par jour** (lun-ven à 8h) aux utilisateurs configurés, avec :
- Sélection intelligente : meilleur score non envoyé
- Round-robin des catégories pour diversité
- Déduplication automatique (30 jours)
- Templates HTML + texte
- Tracking dans base de données

## Prérequis

### 1. Compte SendGrid (gratuit)

1. Créer un compte sur [sendgrid.com](https://signup.sendgrid.com/)
2. Vérifier votre email
3. Créer une **API Key** :
   - Settings → API Keys → Create API Key
   - Name: `veille-tech-daily-digest`
   - Permissions: **Full Access** (ou au minimum "Mail Send")
   - Copier la clé (elle ne sera affichée qu'une fois !)

### 2. Vérifier un sender email

SendGrid nécessite de vérifier votre adresse d'envoi :

**Option A : Single Sender Verification (recommandé pour MVP)**
- Settings → Sender Authentication → Get Started
- Verify a Single Sender
- Remplir : email, nom, adresse
- Vérifier via email de confirmation

**Option B : Domain Authentication (production)**
- Settings → Sender Authentication → Domain Authentication
- Ajouter records DNS (SPF, DKIM)
- Plus complexe mais meilleure délivrabilité

## Configuration

### 1. Variables d'environnement

Ajouter dans `backend/.env` :

```bash
# SendGrid API Key
SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Existant (déjà configuré)
GROQ_API_KEY=gsk_xxxxxxxxxxxx
```

### 2. Configuration des destinataires

Éditer `backend/config.yaml` :

```yaml
email_digest:
  enabled: true
  from_email: your-verified-email@domain.com  # ⚠️ Doit être vérifié dans SendGrid
  from_name: "Veille MAG"

  recipients:
    - email: ton-email@example.com
      name: "Ton Nom"
    # Ajouter d'autres destinataires (max ~100/jour gratuit)
    # - email: beta-tester@example.com
    #   name: "Beta Tester"

  schedule:
    frequency: daily
    time: "08:00"
    timezone: "Europe/Paris"
    days: [mon, tue, wed, thu, fri]

  selection:
    articles_per_digest: 1
    min_score_threshold: 60
    round_robin_categories: true
    avoid_duplicates_days: 30
```

### 3. GitHub Secrets (pour automation)

Ajouter dans Settings → Secrets → Actions :

- `SENDGRID_API_KEY` : Votre clé API SendGrid
- `GROQ_API_KEY` : Déjà configuré normalement

## Installation locale

```bash
cd backend

# Activer virtualenv
source .venv/bin/activate  # ou .venv\Scripts\activate (Windows)

# Installer dépendances (ajout de sendgrid)
pip install -r requirements.txt

# Créer la table sent_articles
python migrate_add_sent_articles.py
```

## Test manuel

### Test 1 : Vérifier la configuration

```bash
cd backend
python daily_digest.py
```

**Si tout est OK, vous verrez** :
```
[INFO] Starting daily digest process
[INFO] Processing recipient: ton-email@example.com
[INFO] Selected article: "Best practices for..."
[INFO] ✅ Email sent to ton-email@example.com (status: 202)
[INFO] Daily digest completed: 1 sent, 0 failed
```

**Erreurs communes** :

| Erreur | Solution |
|--------|----------|
| `Missing env var: SENDGRID_API_KEY` | Ajouter dans `.env` |
| `Forbidden: sender not verified` | Vérifier l'email sender dans SendGrid |
| `No suitable articles found` | Tous les articles ont été envoyés récemment, attendre ou baisser `min_score_threshold` |
| `Not scheduled for today` | Normal si lancé un weekend, ou tester avec `frequency: manual` |

### Test 2 : Vérifier l'email reçu

1. Ouvrir votre boîte mail
2. Chercher l'email "📡 Ton article tech du jour"
3. Vérifier :
   - ✅ Template HTML s'affiche correctement
   - ✅ Bouton "Lire l'article" fonctionne
   - ✅ Liens footer (archives, préférences) existent

### Test 3 : Vérifier le tracking

```bash
cd backend
sqlite3 veille.db "SELECT * FROM sent_articles ORDER BY sent_at DESC LIMIT 5;"
```

Vous devriez voir :
```
1|article-id-123|ton-email@example.com|1735099200|daily|1735099200
```

## Déploiement (GitHub Actions)

Le workflow `.github/workflows/daily-digest.yml` est configuré pour :
- **Exécution automatique** : Lun-Ven à 07:00 UTC (08:00 Paris hiver, 09:00 Paris été)
- **Trigger manuel** : Actions → Daily Email Digest → Run workflow

### Ajuster le timezone

Si 08:00 Paris n'est pas l'heure souhaitée :

```yaml
# Dans .github/workflows/daily-digest.yml
schedule:
  - cron: '0 7 * * 1-5'  # 07:00 UTC = 08:00 Paris (hiver)
  # Exemples :
  # - cron: '0 6 * * 1-5'  # 07:00 Paris (hiver)
  # - cron: '0 8 * * 1-5'  # 09:00 Paris (hiver)
```

**Note** : Cron GitHub Actions n'est pas précis à la minute près (±15 min possible).

## Monitoring

### Logs GitHub Actions

Actions → Daily Email Digest → [dernière exécution] → Télécharger `daily-digest-logs`

### Logs locaux

```bash
cat backend/logs/daily_digest.log
```

### Stats d'envoi SendGrid

Dashboard SendGrid → Activity → voir open rate, click rate, bounces

## Fonctionnalités avancées (Phase 3)

Pour aller plus loin :

1. **Personnalisation par utilisateur**
   - Ajouter table `user_preferences` avec catégories préférées
   - Modifier `ArticleSelector` pour filtrer par préférences

2. **Page /preferences frontend**
   - Formulaire pour choisir catégories
   - Fréquence d'envoi (quotidien vs hebdo)
   - Unsubscribe flow

3. **Analytics**
   - Tracking des clicks (SendGrid webhook)
   - Adaptation du scoring selon engagement

4. **Templates dynamiques**
   - Différents layouts selon le type d'article
   - A/B testing de subject lines

## Dépannage

### L'email n'arrive pas

1. **Vérifier spam/promotions** : Premiers envois souvent classés spam
2. **Vérifier SendGrid Activity** : Dashboard → Activity Feed
3. **Tester avec Mail Tester** : Envoyer à mail-tester.com pour score delivrability

### Les articles se répètent

Augmenter `avoid_duplicates_days` dans config.yaml (actuellement 30 jours)

### Pas assez d'articles disponibles

Baisser `min_score_threshold` (actuellement 60) à 50 ou 40

### L'email est en spam

1. **Configurer SPF/DKIM** : SendGrid Domain Authentication
2. **Éviter mots spam** : "gratuit", "urgent", majuscules excessives
3. **Ajouter lien unsubscribe** : Déjà présent dans template

## Support

- Documentation SendGrid : https://docs.sendgrid.com/
- Limits gratuits : 100 emails/jour
- Upgrade plan : $19.95/mois pour 40k emails

---

**Prêt à déployer !** 🚀

Une fois configuré, le système tourne de manière autonome tous les matins en semaine.
