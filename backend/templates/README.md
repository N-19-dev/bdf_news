# Email Templates

Templates pour les emails de digest quotidien.

## Fichiers

- **daily_digest.html** : Template HTML principal (clients email modernes)
- **daily_digest.txt** : Template texte (fallback + accessibilité)

## Variables disponibles

Les variables suivantes sont remplacées dans les templates via `{{variable}}` :

| Variable | Description | Exemple |
|----------|-------------|---------|
| `{{recipient_name}}` | Nom du destinataire | "Nathan" |
| `{{date}}` | Date formatée | "25 décembre 2025" |
| `{{title}}` | Titre de l'article | "ClickHouse vs DuckDB: When to Use Each" |
| `{{url}}` | URL de l'article | "https://..." |
| `{{source}}` | Source de l'article | "DataBricks Blog" |
| `{{summary}}` | Résumé (max 300 chars) | "This article compares..." |
| `{{score}}` | Score de pertinence | "92" |
| `{{category}}` | Catégorie formatée | "Warehouses & Query Engines" |
| `{{read_time}}` | Temps de lecture estimé | "8" (minutes) |
| `{{archive_url}}` | Lien vers les archives | "https://..." |
| `{{manage_prefs_url}}` | Lien préférences | "https://..." |
| `{{unsubscribe_url}}` | Lien de désinscription | "https://...?email=..." |

## Modification des templates

### HTML (daily_digest.html)

- Design responsive (max-width: 600px pour compatibilité email)
- Inline CSS requis (certains clients email ignorent `<style>`)
- Testé sur Gmail, Outlook, Apple Mail
- Style "magazine" cohérent avec le frontend

### Texte (daily_digest.txt)

- Fallback pour clients email sans HTML
- Format UTF-8 avec émojis
- Largeur max 70 caractères recommandée

## Test local

Pour tester visuellement les templates :

1. Modifier le template
2. Lancer `python daily_digest.py` (avec config valide)
3. Vérifier l'email reçu dans votre client

Ou utiliser [Litmus](https://litmus.com/) pour tests multi-clients.

## Best Practices

- **Subject line** : <60 chars, emoji au début pour visibilité
- **Preheader** : Première ligne de texte (affichée dans preview)
- **CTA button** : Grand, contrasté, action claire
- **Footer** : Toujours inclure unsubscribe (légal + bonne pratique)
- **Images** : Éviter (bloquées par défaut), utiliser emoji + texte

## Liens utiles

- [Email Design Best Practices](https://www.campaignmonitor.com/resources/guides/email-marketing-guide/)
- [Can I Email](https://www.caniemail.com/) - Support CSS par client
- [SendGrid Email Templates](https://docs.sendgrid.com/ui/sending-email/how-to-send-an-email-with-dynamic-templates)
