# SchoolLink MVP

SchoolLink est prêt à être lancé en MVP avec PostgreSQL, API backend, BackOffice web et application mobile Expo.

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

Pour le mobile, configurez l'API si besoin :

```powershell
$env:EXPO_PUBLIC_API_URL="http://ADRESSE_IP_DU_PC:5000"
```

## Comptes de démonstration

BackOffice Super Admin :

```text
Code établissement : CD-2026-0001
Identifiant : superadmin@schoollink.app
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
- Gardez `SCHOOLLINK_DB_REQUIRED=true` pour éviter un démarrage en mode démo si PostgreSQL est indisponible.
- Définissez `CORS_ORIGINS` avec les URL réellement utilisées.
- Vérifiez que `/api/health` répond avec `database: "postgresql"`.
