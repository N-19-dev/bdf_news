# Guide des APIs LLM pour Veille Tech

## 🎯 Résumé Rapide

**GROQ EST DÉJÀ GRATUIT - PAS BESOIN DE CHANGER !** ✅

Les rate limits que vous voyez ne viennent PAS du LLM, mais des sources RSS (Hashnode).

---

## 🆓 Option 1 : Groq (ACTUEL - RECOMMANDÉ)

### Configuration actuelle (config.yaml)
```yaml
llm:
  provider: "openai_compat"
  base_url: "https://api.groq.com/openai/v1"
  api_key_env: "GROQ_API_KEY"
  model: "llama-3.1-8b-instant"
  temperature: 0.2
  max_tokens: 1200
```

### Obtenir une clé Groq GRATUITE

1. **Créer un compte :** https://console.groq.com
2. **Générer une clé API :** Settings → API Keys → Create API Key
3. **Configurer dans .env :**
   ```bash
   cd backend
   echo "GROQ_API_KEY=gsk_votre_clé_ici" >> .env
   ```

### Quotas GRATUITS Groq
- **llama-3.1-8b-instant :** 30 requêtes/minute
- **Limite journalière :** ~14,400 requêtes/jour
- **Coût :** $0 (100% gratuit)
- **Vitesse :** Très rapide (hardware spécialisé LPU)

### Utilisation estimée pour ce projet
- Crawl hebdomadaire : ~100 articles
- Classification LLM : ~100 requêtes
- Résumé : 10 requêtes
- **Total : ~110 requêtes/semaine**
- **Verdict : LARGEMENT DANS LE QUOTA GRATUIT** ✅

---

## 💰 Option 2 : Mistral AI (PAYANT)

### Configuration Mistral
```yaml
llm:
  provider: "openai_compat"
  base_url: "https://api.mistral.ai/v1"
  api_key_env: "MISTRAL_API_KEY"
  model: "mistral-small-latest"  # ou "open-mistral-7b"
  temperature: 0.2
  max_tokens: 1200
```

### Tarifs Mistral (décembre 2024)
- **open-mistral-7b :** $0.10 / 1M tokens input, $0.10 / 1M tokens output
- **mistral-small :** $0.10 / 1M tokens input, $0.30 / 1M tokens output
- **mistral-medium :** $0.70 / 1M tokens input, $2.10 / 1M tokens output

### Coût estimé mensuel (4 crawls/mois)
- Tokens utilisés : ~400k tokens/mois (100k/crawl)
- Avec mistral-small : ~$0.16/mois
- **Verdict : Très peu cher, mais Groq est GRATUIT** 💡

### Obtenir une clé Mistral
1. https://console.mistral.ai
2. Créer un compte (carte bancaire requise)
3. Générer API Key
4. Ajouter à .env : `MISTRAL_API_KEY=...`

---

## 🚀 Option 3 : OpenAI (PAYANT, CHER)

### Configuration OpenAI
```yaml
llm:
  provider: "openai_compat"
  base_url: "https://api.openai.com/v1"
  api_key_env: "OPENAI_API_KEY"
  model: "gpt-4o-mini"  # ou "gpt-3.5-turbo"
  temperature: 0.2
  max_tokens: 1200
```

### Tarifs OpenAI (décembre 2024)
- **gpt-4o-mini :** $0.15 / 1M tokens input, $0.60 / 1M tokens output
- **gpt-3.5-turbo :** $0.50 / 1M tokens input, $1.50 / 1M tokens output
- **gpt-4 :** $30 / 1M tokens input, $60 / 1M tokens output

### Coût estimé mensuel
- Avec gpt-4o-mini : ~$0.30/mois
- Avec gpt-3.5-turbo : ~$0.80/mois
- **Verdict : Plus cher que Mistral, Groq est GRATUIT** 💸

---

## 🆓 Option 4 : Ollama (LOCAL - GRATUIT)

### Avantages
- ✅ 100% gratuit
- ✅ Pas de limites de requêtes
- ✅ Données privées (tout local)

### Inconvénients
- ❌ Nécessite une bonne machine (16GB RAM minimum)
- ❌ Plus lent que les APIs cloud
- ❌ Nécessite installation et configuration

### Installation Ollama
```bash
# MacOS/Linux
curl -fsSL https://ollama.com/install.sh | sh

# Télécharger un modèle
ollama pull llama3.1:8b

# Lancer le serveur
ollama serve
```

### Configuration dans config.yaml
```yaml
llm:
  provider: "openai_compat"
  base_url: "http://localhost:11434/v1"
  api_key_env: "OLLAMA_API_KEY"  # Peut être vide
  model: "llama3.1:8b"
  temperature: 0.2
  max_tokens: 1200
```

---

## 🔧 RÉSOUDRE LES RATE LIMITS (CRAWLING RSS)

### Problème identifié
Les rate limits viennent de **Hashnode** (sources RSS), PAS du LLM !

### Solution 1 : Supprimer Hashnode (FAIT ✅)
```yaml
# Dans config.yaml - DÉJÀ FAIT
# - name: Hashnode · data
#   url: https://hashnode.com/n/data/rss
# - name: Hashnode · machine-learning
#   url: https://hashnode.com/n/machine-learning/rss
```

### Solution 2 : Réduire le rate limiting (FAIT ✅)
```yaml
crawl:
  concurrency: 8      # Réduit de 12 à 8
  per_host_rps: 1.0   # Réduit de 1.5 à 1.0
```

### Solution 3 : Ajouter des délais entre sources
```yaml
crawl:
  concurrency: 4      # Encore plus conservateur
  per_host_rps: 0.5   # 1 requête toutes les 2 secondes
```

---

## 📊 COMPARATIF FINAL

| Fournisseur | Coût/mois | Vitesse | Quota | Recommandation |
|-------------|-----------|---------|-------|----------------|
| **Groq** ✅ | $0 | ⚡⚡⚡ Très rapide | 14k req/jour | **MEILLEUR CHOIX** |
| Mistral | ~$0.16 | ⚡⚡ Rapide | Payant | Si quota Groq dépassé |
| OpenAI | ~$0.30+ | ⚡⚡ Rapide | Payant | Plus cher |
| Ollama | $0 | ⚡ Lent | Illimité | Si machine puissante |

---

## 🎯 RECOMMANDATION FINALE

### Pour ce projet : **GROQ (ACTUEL)** ✅

**Pourquoi ?**
1. ✅ 100% gratuit
2. ✅ Très rapide (LPU hardware)
3. ✅ Quota largement suffisant (14k req/jour vs ~110 req/semaine)
4. ✅ Déjà configuré dans le code
5. ✅ Pas de carte bancaire nécessaire

### Où payer SI NÉCESSAIRE ?

**Scénario 1 : Quota Groq dépassé**
- Passer à Mistral (~$0.20/mois)
- Ou OpenAI gpt-4o-mini (~$0.30/mois)

**Scénario 2 : Meilleure qualité LLM**
- OpenAI gpt-4 (~$12/mois pour ce projet)
- Claude 3.5 Sonnet via Anthropic API (~$10/mois)

**Scénario 3 : Zero coût**
- Installer Ollama en local (gratuit, mais nécessite bonne machine)

---

## 🚀 ACTIONS À FAIRE MAINTENANT

1. **Obtenir une clé Groq (GRATUIT) :**
   ```bash
   # 1. Aller sur https://console.groq.com
   # 2. Créer un compte
   # 3. Générer une clé API
   # 4. Ajouter à .env
   cd backend
   echo "GROQ_API_KEY=gsk_votre_clé" >> .env
   ```

2. **Relancer le pipeline :**
   ```bash
   source .venv/bin/activate
   python regenerate_weeks.py
   ```

3. **Vérifier les résultats :**
   - Plus de REX détectés (classification LLM active)
   - Résumés hebdomadaires générés
   - Plus d'erreurs de rate limit (Hashnode supprimé)

---

## 📝 EN CAS DE PROBLÈME

### "GROQ_API_KEY manquant"
```bash
# Vérifier que .env existe
cat backend/.env

# Ajouter la clé si manquante
echo "GROQ_API_KEY=gsk_votre_clé" >> backend/.env
```

### "Rate limit exceeded" (Groq)
- Passer au modèle gratuit le plus lent : `llama-3.1-70b-versatile`
- Ou passer à Mistral (~$0.20/mois)

### "Trop lent"
- Garder Groq (déjà le plus rapide)
- Ou augmenter `concurrency` dans config.yaml

### "Qualité LLM insuffisante"
- Passer à OpenAI gpt-4o-mini (~$0.30/mois)
- Ou Claude 3.5 Sonnet (~$10/mois)
