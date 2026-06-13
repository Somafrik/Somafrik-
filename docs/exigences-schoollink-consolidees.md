# Exigences SchoolLink consolidees

Date de consolidation : 2026-06-13

Ce document est additif. Il consolide les exigences sources sans remplacer les recommandations existantes dans `C:\Users\Lenovo\Desktop\Projets\Exigences SchoolLink\`.

## Sources prises en compte

- `Phase MVP.txt`
- `Exigences MVP - Acces Mobile et tablette.txt`
- `1. Exigences generales PostgreSQL.txt`
- `Exigences metier - Gestion des appels.txt`
- `Exigences Metier - Gestion des Notes et Bulletins (SchoolLink).txt`
- `Exigences metier - Gestion des notifications et messages (SchoolLink).txt`
- `Exigences metier - Super Administrateur et admin pays.txt`
- `Gestion des etablissements.txt`
- `Gestion des utilisateurs.md`
- `Structure des identifiants uniques.txt`
- `Pour SchoolLink, les points faibles a corriger.txt`

## Regles de preservation

- Ne pas ecraser les anciennes recommandations.
- Ajouter les nouvelles recommandations sous forme d'addendum date.
- En cas de conflit, conserver la decision produit la plus recente et garder la recommandation precedente comme historique.
- Les exigences deja implementees doivent rester testables par endpoint, ecran ou action utilisateur.

## Decisions produit deja validees

- Le code etablissement visible reste de type `CD-2026-0001`.
- Les identifiants eleves/etudiants acceptes restent `ELE-0001` et `ETU-0001`.
- Les identifiants enseignants acceptes restent `ENS-0001`.
- Le code etablissement doit rester en memoire/contexte pour les utilisateurs d'un etablissement.
- Les formats plus longs du type `ELE-2026-000001` restent une recommandation d'evolution, pas une rupture MVP.

## Modules MVP obligatoires

1. Authentification
2. Gestion des etablissements
3. Gestion des utilisateurs et roles
4. Gestion des eleves / etudiants
5. Gestion des classes
6. Gestion des enseignants
7. Gestion des presences / appels
8. Gestion des notes simples
9. Bulletins et PDF
10. Paiements scolaires
11. Notifications et messages
12. Tableaux de bord
13. Super Admin / Admin Pays
14. Audit, securite et isolation multi-tenant

## Backoffice Web

### Authentification

- Connexion par identifiant et mot de passe.
- Controle du statut utilisateur : actif, suspendu, desactive.
- Redirection vers un tableau de bord adapte au role.
- Les comptes suspendus ou desactives ne doivent pas se connecter.

### Etablissements

- Creation, modification, suspension/reactivation.
- Champs minimum : nom, code unique, type, pays, ville, adresse, telephone, email, logo, statut, devise, langue, fuseau horaire.
- Affichage du logo dans les zones utiles : login, dashboard, documents.
- Association avec abonnement et limites SaaS.

### Utilisateurs et permissions

- Creation, modification, suspension/reactivation, reinitialisation mot de passe.
- Roles MVP : Super Admin, Admin Pays, Admin Etablissement, Proviseur, Prefet des etudes, Enseignant, Secretaire, Comptable, Parent, Eleve/Etudiant.
- Attribution des droits par role en CRUD par le Super Admin.
- Admin Pays doit disposer des droits CRUD necessaires pour gerer les Admins Etablissement de son perimetre.

### Rapports et supervision

- KPIs globaux et par perimetre.
- Rapports MVP : couverture fonctionnelle, audit, abonnements, utilisateurs, etablissements.
- Exports a prevoir : PDF/Excel selon le module.

## Mobile / Tablette

### Acces initial

- Ecran de bienvenue avec logo SchoolLink, slogan court et bouton de connexion.
- Ecran unique de saisie : code etablissement ou identifiant organisation.
- Detection automatique : Super Admin, Admin Pays ou utilisateur lie a un etablissement.
- Affichage du logo, nom, pays et ville de l'etablissement reconnu.

### Connexion par role

- Identification par telephone, email ou identifiant unique.
- Detection du role avant authentification.
- Mot de passe pour roles administratifs.
- PIN ou mot de passe pour enseignant, parent, eleve/etudiant selon configuration.
- Redirection vers dashboard adapte.

### Dashboards mobiles

- Super Admin : pays, etablissements, admins pays, abonnements, statistiques globales, securite.
- Admin Pays : etablissements du pays, admins etablissements, statistiques nationales, abonnements, support.
- Admin Etablissement : classes, eleves, enseignants, paiements, annonces, parametres.
- Proviseur / Prefet : pedagogie, presences, notes, bulletins, rapports.
- Enseignant : classes, eleves, appels, notes, messages, annonces.
- Secretaire : eleves, inscriptions, presences, paiements, documents, messages.
- Parent : enfants, notes, bulletins, presences, paiements, messages.
- Eleve/Etudiant : profil, notes, presences, bulletins, paiements si applicable.

## PostgreSQL et donnees reelles

### Tables MVP minimales

- `countries`
- `schools`
- `subscriptions`
- `users`
- `academic_years`
- `terms`
- `classes`
- `subjects`
- `teachers`
- `students`
- `enrollments`
- `grades`
- `attendance`
- `payments`
- `announcements`
- `notifications`
- `audit_logs`
- `sessions`
- `backoffice_state`

### Contraintes

- Donnees multi-pays, multi-etablissement, multi-role, multi-annee scolaire.
- Mots de passe et PIN jamais stockes en clair.
- Identifiants internes UUID et identifiants publics lisibles.
- Filtrage systematique par etablissement et pays selon le role.

## Presences / Appels

- L'enseignant voit uniquement ses classes.
- Appel rapide : tous presents par defaut, modification des absents/retards.
- Statuts : Present, Absent, Retard, Justifie.
- Sauvegarde en une action.
- Date, heure, enseignant, classe, matiere et auteur enregistres.
- Historique des corrections.
- Notification parent en cas d'absence ou retard.
- Rapports journalier, hebdomadaire, mensuel, annuel.

## Notes et bulletins

- Matieres avec classe, coefficient et enseignant.
- Evaluations multiples par periode.
- Saisie note par eleve et en masse.
- Controle du bareme et des valeurs min/max.
- Historisation de toute modification.
- Calcul automatique des moyennes matiere et generale.
- Recalcul apres modification.
- Classement avec gestion des ex aequo.
- Appreciation enseignant et appreciation generale.
- Bulletin PDF visionnable depuis mobile et backoffice.

## Notifications et messages

- Notifications manuelles et automatiques.
- Ciblage : tous, role, classe, utilisateur, groupe.
- Priorites : faible, moyenne, haute, critique.
- Statuts : non lu, lu, archive.
- Messages internes avec historique, reponse, transfert, suppression, archivage.
- Pieces jointes a prevoir : PDF, image, Word, Excel, audio, video.
- Audit : createur, destinataires, envoi, lecture, archivage, suppression.

## Securite, audit et performance

- JWT, refresh token, deconnexion securisee, revocation session.
- RBAC par role et permission.
- Isolation multi-tenant par `school_id` et `country_id`.
- Audit des operations sensibles : connexion, deconnexion, utilisateur, note, bulletin, paiement, actions backoffice.
- Pagination obligatoire pour listes volumineuses : eleves, enseignants, utilisateurs, paiements, notes, notifications.
- Recherche ciblee avec objectif de reponse inferieur a 2 secondes sur volumes eleves.
- Cache Redis recommande pour dashboards, statistiques et listes frequentes.
- Invalidation cache apres ajout, modification ou suppression.

## Priorites de livraison

- P0 : authentification, etablissements, utilisateurs, roles/permissions, eleves, classes, enseignants, presences, notes, bulletins PDF, isolation tenant.
- P1 : paiements, notifications/messages, audit consultable, tableaux de bord par role, pagination/recherche.
- P2 : documents versionnes, pieces jointes avancees, Redis distribue, exports Excel et reporting avance.

