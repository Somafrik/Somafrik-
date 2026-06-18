# Somafrik MVP

Somafrik est prêt à être lancé en MVP avec PostgreSQL, API backend, Backoffice web et application mobile Expo.

## Démarrage rapide

```powershell
Copy-Item .env.example .env
docker compose up -d postgres backend
```

BackOffice :

```text
http://localhost:5000/backoffice
```

API santé :

```text
http://localhost:5000/api/health
```

Mobile Expo :

```powershell
npm --prefix Mobile run start -- --clear
```

Mobile Expo avec Docker Desktop :

```powershell
docker compose up -d postgres backend mobile
docker compose logs -f mobile
```

Dans `.env`, remplacez `ADRESSE_IP_DU_PC` par l'adresse Wi-Fi du PC, par exemple `192.168.1.141`. Le téléphone doit être sur le même Wi-Fi et ouvrir le QR Code affiché dans les logs du service `somafrik-mobile`.

Gardez `EXPO_PUBLIC_DEMO_MODE=false` pour forcer l'application mobile à utiliser l'API et PostgreSQL. Le mode `true` sert uniquement aux démonstrations hors connexion.

Si le port Expo `8081` ou `8082` est déjà utilisé, gardez `EXPO_PORT=8083` dans `.env` puis relancez le service mobile.

## Comptes de démonstration

BackOffice Super Admin :

```text
Code établissement : CD-2026-0001
Identifiant : superadmin@somafrik.app
Mot de passe : 1234
```

Mobile élève :

```text
Code établissement : CD-2026-0001
Identifiant : ELE-0001
PIN : 1234
```

Mobile enseignant :

```text
Code établissement : CD-2026-0001
Identifiant : ENS-0001
PIN : 1234
```

## Avant usage réel

- Changez `POSTGRES_PASSWORD` et `JWT_SECRET` dans `.env`.
- Gardez `SOMAFRIK_DB_REQUIRED=true` pour éviter un démarrage en mode démo si PostgreSQL est indisponible.
- Définissez `CORS_ORIGINS` avec les URL réellement utilisées.
- Vérifiez que `/api/health` répond avec `database: "postgresql"`.
