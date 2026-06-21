# Somafrik BackOffice — Web (React + Tailwind CSS)

Frontend web du BackOffice Somafrik, réécrit en **React 18 + TypeScript + Vite + Tailwind CSS**.
Il consomme la même API Express/PostgreSQL que le BackOffice historique (`/api/...`) et reprend
sa logique de périmètre (scoping multi-pays / multi-établissements), ses permissions RBAC et son
flux d'état (`GET`/`PUT /api/backoffice/state`).

## Stack

- React 18 + TypeScript
- Vite (dev server + build)
- Tailwind CSS 3
- React Router 6

## Prérequis

- Node.js 20+
- Le backend Somafrik démarré (par défaut sur `http://localhost:5000`)

## Démarrage en développement

```bash
cd web
npm install
cp .env.example .env.local   # optionnel: change VITE_API_TARGET si le backend n'est pas sur :5000
npm run dev
```

L'app est servie sur `http://localhost:5173/web/`. Les appels `/api/*` sont proxifiés vers le backend.

### Comptes de démonstration

| Profil          | Identifiant | Mot de passe | Code établissement |
| --------------- | ----------- | ------------ | ------------------ |
| Super Admin     | `superadmin`| `1234`       | —                  |
| Admin Pays      | `admin-rdc` | `1234`       | —                  |
| Établissement   | `admin`     | `1234`       | `CD-2026-0001`     |

## Build de production

```bash
cd web
npm run build      # génère web/dist (typé via tsc puis bundlé par Vite)
npm run preview    # prévisualise le build localement
```

Le build (`web/dist`) est servi automatiquement par le backend Express sur `/web`
quand il est présent (voir `backend/server.js`).

## Scripts

- `npm run dev` — serveur de développement
- `npm run build` — type-check + build de production
- `npm run preview` — prévisualisation du build
- `npm run typecheck` — vérification TypeScript seule
- `npm run lint` — ESLint

## Structure

```
web/src/
  api/          Client HTTP (Bearer JWT, /api)
  context/      AuthContext (session/JWT) + DataContext (état BackOffice)
  lib/          scope, permissions RBAC, format, constantes
  components/   UI réutilisable (Button, Card, Table, Modal, ...) + layout
  pages/        Connexion + modules (Dashboard, Pays, Établissements, Abonnements,
                Notifications, Utilisateurs, Permissions, Conformité MVP)
```
