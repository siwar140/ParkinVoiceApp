# Rapport de sécurité ParkinVoice

**Date :** 14 septembre 2026  
**Périmètre :** backend FastAPI, frontend React, authentification, base de données, fichiers téléversés et configuration de déploiement.

## 1. Synthèse

L’application dispose d’une séparation fonctionnelle entre les rôles **administrateur**, **médecin** et **patient**. Les mots de passe sont hachés avec bcrypt et les sessions utilisent des jetons JWT avec expiration.

Plusieurs mesures de durcissement ont été mises en place : validation des fichiers téléversés, protection des routes, restriction des fichiers publics, en-têtes HTTP de sécurité, nettoyage des fichiers d’environnement et refus des secrets faibles en production.

**État actuel :** l’application est déployée ou destinée à être exploitée en production, mais son niveau de sécurité reste conditionnel. Les contrôles techniques de base sont présents ; plusieurs actions opérationnelles doivent encore être vérifiées ou finalisées pour un usage de données médicales en production.

## 2. Données sensibles concernées

L’application traite notamment :

- Identités, emails, téléphones et informations professionnelles des médecins.
- Identités, coordonnées, date de naissance, genre et notes médicales des patients.
- Enregistrements audio utilisés pour l’analyse vocale.
- Résultats et probabilités de prédiction liés à la maladie de Parkinson.
- Jetons JWT, mots de passe hachés et codes de vérification.
- Paramètres de connexion PostgreSQL et configuration du service email.

Ces données doivent être considérées comme confidentielles et protégées conformément aux exigences applicables aux données de santé.

## 3. Contrôles de sécurité vérifiés

### Authentification et autorisation

- Les rôles admin, médecin et patient utilisent des flux d’authentification séparés.
- Les JWT contiennent un type de rôle : `admin`, `user` ou `patient`.
- Les routes protégées vérifient le type du token et l’existence du compte.
- Les comptes inactifs sont refusés.
- Les mots de passe sont hachés avec bcrypt et ne sont pas stockés en clair.
- Les mots de passe doivent comporter entre 8 et 128 caractères.
- Les données patient sont filtrées par `doctor_id` côté médecin.
- Les résultats patient sont filtrés par `patient_id` côté patient.

### Protection des fichiers

- Les fichiers audio ne sont plus servis publiquement par `StaticFiles`.
- Seules les images de profil sont exposées via `/uploads/profiles`.
- Les extensions d’images sont limitées à JPEG, PNG et WEBP.
- Les fichiers audio sont limités aux extensions audio autorisées.
- Une taille maximale de 5 Mo est appliquée aux images.
- Une taille maximale de 25 Mo est appliquée aux fichiers audio.
- Les noms de fichiers sont générés par le serveur.

### Configuration et transport

- Les secrets locaux sont exclus par `.gitignore`.
- La clé JWT locale a été remplacée par une valeur forte.
- En production, une clé faible ou absente provoque l’arrêt de l’application.
- `DEBUG=True` est refusé en production.
- Des en-têtes `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy` et `Permissions-Policy` sont ajoutés.
- Le CORS est limité aux origines configurées.

### Validation

- Le backend compile correctement.
- Les routes d’authentification ont été vérifiées.
- Le build frontend passe.
- La connexion admin et l’accès au dashboard ont été testés avec succès.

## 4. Risques résiduels

### Critique : secrets à révoquer hors du code

Une clé Resend a précédemment été présente dans l’environnement local. Elle a été retirée du fichier `.env`, mais toute clé déjà exposée doit être révoquée depuis le tableau de bord Resend.

**Action :** révoquer l’ancienne clé et créer une nouvelle clé stockée uniquement dans les variables d’environnement du déploiement.

### Élevé : secrets et données sensibles en environnement local

Le fichier `.env` contient encore les paramètres de connexion locaux à la base de données. Il est ignoré par Git, mais il reste sensible sur le poste de développement.

**Action :** utiliser des secrets distincts par environnement, limiter les permissions du fichier et ne jamais transmettre `.env` par email ou dans une archive.

### Élevé : tokens stockés dans `localStorage`

Les tokens frontend sont stockés dans `localStorage`. Une vulnérabilité XSS pourrait permettre leur lecture.

**Action recommandée :** migrer vers des cookies `HttpOnly`, `Secure` et `SameSite`, avec protection CSRF adaptée. À défaut, maintenir une politique CSP stricte et éviter tout HTML non contrôlé.

### Élevé : absence de limitation anti-brute-force

Les endpoints de connexion et d’envoi de codes ne montrent pas de limitation par IP, email ou compte.

**Action recommandée :** ajouter un rate limiting, une temporisation progressive après échecs et une journalisation des tentatives anormales.

### Moyen : codes de vérification

Les codes sont stockés en base sous forme lisible et aucune limitation explicite du nombre d’essais n’est visible.

**Action recommandée :** stocker un hash du code, limiter les essais, invalider les anciens codes et journaliser les abus sans enregistrer le code lui-même.

### Moyen : gestion et conservation des fichiers médicaux

Les fichiers audio sont privés au niveau HTTP, mais une politique de rétention et de suppression automatique n’est pas définie.

**Action recommandée :** définir une durée de conservation, chiffrer le stockage si nécessaire, supprimer les fichiers après traitement ou à l’expiration du dossier, et contrôler les accès administrateurs.

### Moyen : journalisation

Les erreurs serveur peuvent contenir des détails techniques lorsque le debug est actif. Les journaux doivent être considérés comme sensibles.

**Action recommandée :** désactiver le debug en production, centraliser les logs, masquer les emails et identifiants lorsque possible, et appliquer une durée de conservation limitée.

### Faible : dépendances

Le frontend a signalé des vulnérabilités npm lors de l’installation. Une analyse complète des dépendances doit être réalisée avant production.

**Action recommandée :** exécuter régulièrement `npm audit`, mettre à jour les dépendances compatibles et utiliser un scan Python des dépendances.

## 5. Mesures obligatoires avant production

1. Révoquer l’ancienne clé Resend exposée.
2. Générer une clé JWT différente pour chaque environnement.
3. Définir `ENVIRONMENT=production` et `DEBUG=False`.
4. Définir `DATABASE_URL`, `SECRET_KEY`, les origines CORS et les clés email uniquement dans le gestionnaire de secrets du fournisseur.
5. Changer le mot de passe administrateur de développement.
6. Remplacer les tokens `localStorage` par des cookies HttpOnly lorsque possible.
7. Ajouter un rate limiting sur login, reset password et vérification email.
8. Mettre en place des sauvegardes chiffrées et tester leur restauration.
9. Définir la conservation et la suppression des fichiers audio et données patient.
10. Effectuer un test d’intrusion ou une revue externe avant mise en production.

## 5 bis. Contrôle opérationnel de la production

À effectuer dans Render, sans inscrire les valeurs dans le dépôt :

- Vérifier que `DATABASE_URL` est fourni par `parkinvoice-db`.
- Vérifier que `SECRET_KEY` est générée par Render et comporte au moins 32 caractères.
- Vérifier que `DEBUG=false` et `ENVIRONMENT=production`.
- Vérifier que `VITE_API_URL` pointe vers l’URL HTTPS réelle du backend.
- Remplacer `CORS_ORIGINS` par l’URL exacte du frontend et ajouter le domaine personnalisé s’il existe.
- Définir une nouvelle `RESEND_API_KEY` après révocation de l’ancienne.
- Vérifier `/health`, `/docs` désactivé en production et les trois connexions par rôle.
- Activer les sauvegardes PostgreSQL et tester une restauration.
- Prévoir un stockage persistant pour les fichiers audio et images.

## 6. Conclusion

La base de sécurité de ParkinVoice est structurée : authentification par rôle, hachage des mots de passe, contrôle d’accès aux données et limitation des uploads sont présents. Les principales priorités restantes sont opérationnelles et concernent la rotation des secrets, le durcissement des sessions frontend, la limitation anti-abus et la gouvernance des données médicales.

**Avis final :** la production est techniquement possible, mais l’application ne doit pas être considérée comme pleinement conforme pour des données médicales tant que la rotation des secrets, la protection des sessions, le rate limiting, la rétention des fichiers et les sauvegardes n’ont pas été validés.
