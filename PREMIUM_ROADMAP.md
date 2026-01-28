# Roadmap Premium - Veille Tech

> **Proposition de valeur** : "La veille tech en 5 minutes par semaine"
>
> L'anti-Daily.dev : moins de bruit, plus de signal. Juste le TOP 3.

---

## Modèle Freemium

| Gratuit | Premium (3-5€/mois) |
|---------|---------------------|
| Top 3 articles | ✅ |
| Top 3 vidéos | ✅ |
| Votes / commentaires | ✅ |
| — | **TL;DR** (3 bullet points par article) |
| — | **"Pourquoi c'est important"** (insight IA) |
| — | **Version audio** du digest |
| — | **Accès aux archives** (semaines passées) |
| — | **Notification prioritaire** |

---

## Phase 1 : Contenu Premium (Backend)

**Objectif** : Générer le contenu à valeur ajoutée

- [ ] Modifier `summarize_week_llm.py` pour générer :
  - TL;DR (3 bullet points max) pour chaque article
  - "Pourquoi c'est important" (1-2 phrases, insight orienté Data Engineer)
- [ ] Mettre à jour le schéma JSON (`digest.json`) :
  ```json
  {
    "title": "...",
    "url": "...",
    "tldr": ["Point 1", "Point 2", "Point 3"],
    "why_it_matters": "..."
  }
  ```
- [ ] Régénérer les dernières semaines avec le nouveau format

---

## Phase 2 : Authentification

**Objectif** : Identifier les utilisateurs pour gérer le premium

- [ ] Option A : Fixer Google Sign-In (OAuth consent screen)
- [ ] Option B : Remettre connexion invité + upgrade vers compte
- [ ] Créer collection Firestore `users` :
  ```json
  {
    "uid": "...",
    "email": "...",
    "is_premium": false,
    "premium_until": null,
    "created_at": "..."
  }
  ```

---

## Phase 3 : Paiement

**Objectif** : Permettre l'achat de l'abonnement premium

- [ ] Créer compte [RevenueCat](https://www.revenuecat.com/) (gratuit jusqu'à 2500$/mois)
- [ ] Configurer produit dans App Store Connect :
  - `veille_tech_premium_monthly` - 3,99€/mois
  - `veille_tech_premium_yearly` - 29,99€/an (2 mois gratuits)
- [ ] Intégrer `react-native-purchases` dans l'app mobile
- [ ] Synchroniser statut premium avec Firebase

---

## Phase 4 : UI Premium

**Objectif** : Afficher le contenu premium avec paywall

### Mobile (`/mobile`)

- [ ] Composant `PremiumBadge` - Affiche 🔒 ou ✨
- [ ] Composant `PaywallModal` - Écran d'upgrade
- [ ] Modifier `ArticleCard` :
  - Afficher TL;DR si premium, sinon blur + 🔒
  - Bouton "Débloquer avec Premium"
- [ ] Écran `ProfileScreen` :
  - Statut premium
  - Bouton "Gérer l'abonnement"
- [ ] Modifier `Top3` et `TopVideos` :
  - Afficher "Pourquoi c'est important" si premium

### Web (`/frontend`)

- [ ] Même logique que mobile
- [ ] Intégrer Stripe pour paiement web

---

## Phase 5 : Bonus

### Version Audio
- [ ] Intégrer API Text-to-Speech (ElevenLabs, Google TTS, ou OpenAI)
- [ ] Générer MP3 du digest chaque semaine
- [ ] Player audio dans l'app
- [ ] Optionnel : Podcast RSS privé pour premium

### Archives
- [ ] Semaines > 4 visibles uniquement pour premium
- [ ] Ou : Gratuit = 2 dernières semaines, Premium = tout l'historique

### Notifications
- [ ] Push notification le lundi matin
- [ ] Premium : Reçoit la notif en premier (dimanche soir ?)

---

## Stack Technique

| Composant | Techno |
|-----------|--------|
| Paiement mobile | RevenueCat |
| Paiement web | Stripe |
| Auth | Firebase Auth |
| User data | Firestore |
| TL;DR generation | Groq LLM (existant) |
| Audio | ElevenLabs / Google TTS |
| Push notifications | Expo Notifications + Firebase |

---

## Métriques de succès

- [ ] 100 utilisateurs actifs / semaine
- [ ] 5% conversion gratuit → premium
- [ ] < 5% churn mensuel
- [ ] NPS > 40

---

## Timeline estimée

| Phase | Durée |
|-------|-------|
| Phase 1 (Backend TL;DR) | 1-2 jours |
| Phase 2 (Auth) | 1 jour |
| Phase 3 (Paiement) | 2-3 jours |
| Phase 4 (UI) | 2-3 jours |
| Phase 5 (Bonus) | 3-5 jours |

**Total MVP Premium** : ~2 semaines

---

## Prochaine étape

Commencer par **Phase 1** : Générer les TL;DR dans le backend pour avoir du contenu premium à montrer.
