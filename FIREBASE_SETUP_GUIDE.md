# Guide Pas à Pas : Configuration Firebase pour les Commentaires

## 🎯 Ce que vous devez faire

Vous devez configurer 2 choses dans Firebase :
1. **Les indexes** (pour que les requêtes soient rapides)
2. **Les règles de sécurité** (pour protéger vos données)

Les collections (`comments`, `comment_likes`, `sentiment_patterns`) seront créées **automatiquement** par le code quand vous posterez le premier commentaire ou que le backend tournera.

---

## 📍 Étape 1 : Accéder à Firebase Console

1. Allez sur : **https://console.firebase.google.com/**
2. Sélectionnez votre projet : **veille-tech-bb46c**
3. Dans le menu de gauche, cliquez sur **"Firestore Database"**

---

## 🔍 Étape 2 : Créer les Indexes (3 indexes à créer)

### Pourquoi des indexes ?

Firestore a besoin d'indexes pour les requêtes qui :
- Filtrent sur plusieurs champs (ex : `article_id` + `created_at`)
- Trient les résultats

Sans index, les requêtes échoueront avec une erreur.

### Comment créer un index :

1. Dans Firestore Database, cliquez sur l'onglet **"Indexes"** (en haut)
2. Cliquez sur **"Create Index"** ou **"Créer un index"**

---

### Index #1 : Commentaires par article

**But :** Récupérer tous les commentaires d'un article, triés par date

**Configuration :**
```
Collection ID:        comments
Fields to index:
  Field path          Order
  article_id          Ascending
  created_at          Ascending

Query scope:          Collection
```

**Étapes détaillées :**
1. Cliquez sur "Create Index"
2. **Collection ID** : Tapez `comments`
3. **Add field** :
   - Premier champ : `article_id`
   - Order : `Ascending` (croissant)
4. **Add field** (cliquez encore) :
   - Deuxième champ : `created_at`
   - Order : `Ascending`
5. **Query scope** : Sélectionnez `Collection`
6. Cliquez sur **"Create"**

⏳ **Attendez** : L'index va passer de "Building" à "Enabled" (peut prendre 1-2 minutes)

---

### Index #2 : Commentaires par semaine

**But :** Récupérer les commentaires d'une semaine pour l'analyse backend

**Configuration :**
```
Collection ID:        comments
Fields to index:
  Field path          Order
  week_label          Ascending
  created_at          Descending

Query scope:          Collection
```

**Étapes détaillées :**
1. Cliquez sur "Create Index"
2. **Collection ID** : `comments`
3. **Add field** :
   - Premier champ : `week_label`
   - Order : `Ascending`
4. **Add field** :
   - Deuxième champ : `created_at`
   - Order : `Descending` ⚠️ (ATTENTION : Descending cette fois !)
5. **Query scope** : `Collection`
6. Cliquez sur **"Create"**

⏳ **Attendez** que l'index soit "Enabled"

---

### Index #3 : Patterns de sentiment par semaine

**But :** Récupérer les patterns de sentiment pour une semaine donnée

**Configuration :**
```
Collection ID:        sentiment_patterns
Fields to index:
  Field path            Order
  applied_from_week     Ascending
  pattern_type          Ascending

Query scope:            Collection
```

**Étapes détaillées :**
1. Cliquez sur "Create Index"
2. **Collection ID** : `sentiment_patterns`
3. **Add field** :
   - Premier champ : `applied_from_week`
   - Order : `Ascending`
4. **Add field** :
   - Deuxième champ : `pattern_type`
   - Order : `Ascending`
5. **Query scope** : `Collection`
6. Cliquez sur **"Create"**

⏳ **Attendez** que l'index soit "Enabled"

---

### ✅ Vérification des indexes

Une fois les 3 indexes créés, vous devriez voir dans l'onglet "Indexes" :

| Collection | Fields | Status |
|------------|--------|--------|
| comments | article_id (Asc), created_at (Asc) | ✅ Enabled |
| comments | week_label (Asc), created_at (Desc) | ✅ Enabled |
| sentiment_patterns | applied_from_week (Asc), pattern_type (Asc) | ✅ Enabled |

**Si vous voyez "Building"** → Attendez quelques minutes et rafraîchissez la page

---

## 🔒 Étape 3 : Configurer les Règles de Sécurité

### Pourquoi des règles ?

Les règles de sécurité définissent :
- Qui peut lire/écrire les commentaires
- Quelles validations appliquer (ex : max 2000 caractères)
- Les contraintes temporelles (ex : édition dans les 15 min)

### Comment modifier les règles :

1. Dans Firestore Database, cliquez sur l'onglet **"Rules"** (en haut)
2. Vous verrez un éditeur de code avec vos règles actuelles
3. **Ajoutez** les nouvelles règles pour les commentaires (voir ci-dessous)

---

### Règles à ajouter

**⚠️ IMPORTANT :** Ne supprimez PAS les règles existantes pour `votes` et `voting_patterns`. Ajoutez simplement les nouvelles règles.

Voici les règles complètes (incluant vos règles existantes + les nouvelles) :

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // ==========================================
    // COMMENTS - Système de commentaires
    // ==========================================

    match /comments/{commentId} {
      // Tout le monde peut lire les commentaires
      allow read: if true;

      // Créer un commentaire : doit être authentifié
      allow create: if request.auth != null
        && request.auth.uid == request.resource.data.user_id
        && request.resource.data.content.size() > 0
        && request.resource.data.content.size() <= 2000
        && request.resource.data.article_id is string
        && request.resource.data.week_label is string;

      // Modifier son propre commentaire : dans les 15 minutes
      allow update: if request.auth != null
        && request.auth.uid == resource.data.user_id
        && request.time < resource.data.created_at + duration.value(15, 'm')
        && request.resource.data.user_id == resource.data.user_id
        && request.resource.data.article_id == resource.data.article_id;

      // Supprimer son propre commentaire
      allow delete: if request.auth != null
        && request.auth.uid == resource.data.user_id;
    }

    // ==========================================
    // COMMENT LIKES - Likes sur les commentaires
    // ==========================================

    match /comment_likes/{likeId} {
      // Tout le monde peut lire les likes
      allow read: if true;

      // Créer/supprimer un like : doit être authentifié
      // Format du likeId : {userId}_{commentId}
      allow create, delete: if request.auth != null
        && request.auth.uid == request.resource.data.user_id
        && likeId == request.auth.uid + '_' + request.resource.data.comment_id;
    }

    // ==========================================
    // SENTIMENT PATTERNS - Analyse backend uniquement
    // ==========================================

    match /sentiment_patterns/{patternId} {
      // Tout le monde peut lire les patterns
      allow read: if true;

      // Seul le backend (via Admin SDK) peut écrire
      allow write: if false;
    }

    // ==========================================
    // VOTES - Système de votes (existant)
    // ==========================================

    match /votes/{voteId} {
      allow read: if true;
      allow write: if request.auth != null
        && request.auth.uid == request.resource.data.user_id
        && voteId == request.auth.uid + '_' + request.resource.data.article_id;
    }

    // ==========================================
    // VOTING PATTERNS - Patterns de votes (existant)
    // ==========================================

    match /voting_patterns/{patternId} {
      allow read: if true;
      allow write: if false;
    }

  }
}
```

---

### Étapes détaillées :

1. **Sélectionnez tout** le contenu actuel dans l'éditeur (Cmd+A / Ctrl+A)
2. **Remplacez** par les règles ci-dessus
3. Cliquez sur **"Publish"** (ou "Publier") en haut à droite
4. ⚠️ Si vous voyez une erreur, vérifiez :
   - Les accolades `{}` sont bien balancées
   - Les points-virgules `;` sont présents à la fin des lignes `allow`
   - Il n'y a pas de caractères bizarres copiés-collés

---

### ✅ Vérification des règles

Après publication, vous devriez voir en haut :
- ✅ **"Rules published successfully"**
- La date/heure de publication

**Test rapide :**
1. Allez dans l'onglet "Rules playground" (terrain de jeu)
2. Testez une lecture :
   ```
   Collection: comments
   Document ID: test123
   Operation: get
   Authenticated: No
   ```
3. Cliquez sur "Run" → Devrait afficher ✅ **"Allowed"**

---

## 📦 Étape 4 : Vérifier que tout est prêt

### Checklist finale :

- [ ] **3 indexes créés** dans l'onglet "Indexes" (tous "Enabled")
- [ ] **Règles publiées** dans l'onglet "Rules"
- [ ] **Pas d'erreurs** affichées en rouge

### Collections :

**⚠️ N'essayez PAS de créer les collections manuellement !**

Elles apparaîtront automatiquement :
- `comments` → Quand vous posterez le premier commentaire
- `comment_likes` → Quand vous likerez le premier commentaire
- `sentiment_patterns` → Quand le backend tournera pour la première fois

---

## 🧪 Étape 5 : Tester (une fois le frontend déployé)

### Test des commentaires :

1. Allez sur votre site déployé
2. Connectez-vous avec Google
3. Cliquez sur 💬 sur un article
4. Postez un commentaire de test : "Test du système de commentaires"
5. Retournez dans Firebase Console → Data (onglet)
6. Vous devriez voir apparaître la collection `comments` avec votre commentaire

### Structure attendue dans `comments` :

```
comments (collection)
  └─ AbCd1234xyz (document auto-généré)
      ├─ user_id: "votre-uid-firebase"
      ├─ user_name: "Votre Nom"
      ├─ article_id: "hash-de-l-article"
      ├─ content: "Test du système de commentaires"
      ├─ week_label: "2026w02"
      ├─ created_at: timestamp
      ├─ likes: 0
      └─ (autres champs...)
```

### Test des likes :

1. Cliquez sur le ❤️ sous votre commentaire
2. Retournez dans Firebase → Data
3. Une nouvelle collection `comment_likes` devrait apparaître
4. Avec un document ID format : `{votre_uid}_{comment_id}`

---

## 🐛 Troubleshooting

### Erreur : "Missing or insufficient permissions"

**Cause :** Les règles ne sont pas bien configurées

**Solution :**
1. Retournez dans "Rules"
2. Vérifiez que les règles pour `comments` sont présentes
3. Assurez-vous que `allow read: if true;` est bien là
4. Re-publiez les règles

---

### Erreur : "The query requires an index"

**Cause :** Un index est manquant ou en cours de création

**Solution :**
1. Lisez l'erreur complète dans la console du navigateur
2. Firebase vous donnera un **lien direct** pour créer l'index
3. Cliquez sur ce lien → il pré-remplit les champs
4. Cliquez sur "Create"
5. Attendez que l'index soit "Enabled"

---

### Je ne vois pas mes commentaires

**Vérifications :**
1. Vous êtes bien connecté ? (bouton "Se connecter" en haut)
2. La console du navigateur (F12) montre des erreurs ?
3. Les règles sont publiées ?
4. Les indexes sont "Enabled" ?

---

### Le compteur de commentaires ne s'affiche pas

**Cause probable :** Index manquant ou en cours de création

**Solution :**
1. Attendez 2-3 minutes (le temps que les indexes se construisent)
2. Rafraîchissez la page
3. Si toujours rien, vérifiez la console (F12) pour voir les erreurs

---

## 📞 Aide Supplémentaire

Si vous êtes bloqué :

1. **Console du navigateur (F12)** → Onglet "Console"
   - Les erreurs Firebase y seront affichées
   - Copiez l'erreur complète

2. **Firebase Console** → Onglet "Usage"
   - Vérifiez qu'il y a des requêtes en cours
   - Si 0 requête = problème de configuration frontend

3. **GitHub Actions** → Vérifiez les logs du backend
   - Est-ce que `analyze_comment_sentiment.py` s'exécute ?
   - Erreurs dans les logs ?

---

## 📊 Résumé : Ce que vous devez faire MAINTENANT

1. ✅ **Créer 3 indexes** (Firestore → Indexes → Create Index)
   - Index #1 : `comments` (article_id, created_at)
   - Index #2 : `comments` (week_label, created_at DESC)
   - Index #3 : `sentiment_patterns` (applied_from_week, pattern_type)

2. ✅ **Configurer les règles** (Firestore → Rules → Copier-coller les règles)
   - Copier les règles complètes
   - Publier

3. ✅ **Attendre** que les indexes soient "Enabled" (1-2 min)

4. ✅ **Déployer** le frontend (git push → GitHub Actions)

5. ✅ **Tester** en postant un commentaire

**C'est tout !** Les collections se créeront automatiquement.

---

## 🎯 Temps estimé

- Création des 3 indexes : **5 minutes**
- Configuration des règles : **2 minutes**
- Attente (indexes "Enabled") : **1-2 minutes**
- Premier test : **1 minute**

**Total : ~10 minutes** ⏱️
