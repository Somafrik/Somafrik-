# Addendum recommandations SchoolLink - 2026-06-13

Ce fichier complete les recommandations existantes sans les remplacer.

## Recommandations conservees

Les recommandations du fichier source `Pour SchoolLink, les points faibles a corriger.txt` restent valides :

- securite JWT + RBAC ;
- isolation multi-etablissements ;
- isolation par pays ;
- pagination et recherche rapide ;
- cache et invalidation ;
- stockage documentaire securise ;
- audit complet ;
- notifications reelles.

## Addendum MVP actuel

### 1. Stabiliser l'environnement mobile Expo

- Conserver Expo SDK 54 pour compatibilite avec le telephone de test.
- Garder `@expo/vector-icons` en version compatible SDK 54.
- Normaliser l'URL API pour toujours inclure `/api`.
- Documenter l'adresse LAN active du PC avant chaque test mobile.

### 2. Eviter les conflits entre versions de projet

- Version corrigee principale : `C:\Users\Lenovo\Desktop\Projets\SchoolLink_1.2.0`.
- Version Expo utilisee par le telephone : `C:\Users\Lenovo\Desktop\Projets\SchoolLink\Mobile`.
- Toute correction mobile critique faite dans l'une des versions doit etre reportee explicitement dans l'autre si elle reste utilisee.

### 3. Identifiants MVP

- Ne pas casser les identifiants courts deja valides :
  - etablissement : `CD-2026-0001` ;
  - eleve : `ELE-0001` ;
  - etudiant : `ETU-0001` ;
  - enseignant : `ENS-0001`.
- Les formats longs recommandes restent une evolution future, pas une migration bloquante.

### 4. Synchronisation backoffice / mobile

- Les actions backoffice et mobile doivent converger vers le backend.
- Les sauvegardes partielles ne doivent pas ecraser les autres domaines de donnees.
- Une action mobile doit rester utilisable en mode optimiste, avec statut de synchronisation visible si possible.

### 5. Verification minimale avant demo

- Backend : `GET /api/health` doit retourner `database: postgresql`.
- Mobile : recherche etablissement `CD-2026-0001` doit retourner JSON, jamais HTML.
- Backoffice : ouvrir via `http://127.0.0.1:5000/backoffice/`, pas en `file://`.
- Expo : relancer avec cache vide apres correction API : `npx expo start -c`.

