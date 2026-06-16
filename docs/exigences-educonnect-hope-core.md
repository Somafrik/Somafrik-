# Exigences Produit - Somafrik par OKAFRIK

## 1. Positionnement Produit

OKAFRIK est la maison mere. Elle porte la vision, la gouvernance, la marque groupe, les standards de securite, les offres commerciales et les services numeriques transverses.

Somafrik est l'application ERP scolaire SaaS d'OKAFRIK. Elle est dediee aux etablissements scolaires et universitaires : ecoles, colleges, lycees, instituts, centres de formation et universites.

Somafrik doit permettre a plusieurs pays, plusieurs etablissements et plusieurs roles de travailler sur une meme plateforme, sans melange de donnees. Le produit couvre la gestion administrative, academique, pedagogique, financiere et communicationnelle d'un etablissement.

## 2. Vision Produit SaaS

Somafrik est concu comme un ERP scolaire SaaS multi-pays, multi-etablissements et multi-roles.

Le produit repose sur ces principes :

1. OKAFRIK pilote la plateforme globale, les standards, la securite et la gouvernance.
2. Somafrik gere le metier scolaire et universitaire.
3. Chaque pays dispose de son propre perimetre d'administration.
4. Chaque etablissement dispose de ses donnees, parametres, utilisateurs et regles internes.
5. Chaque role voit uniquement les menus, donnees, boutons et actions autorises.
6. Toutes les donnees MVP doivent etre stockees dans PostgreSQL.
7. Les anciennes recommandations fonctionnelles restent valides, mais elles doivent etre appliquees sous la marque Somafrik.

## 3. Architecture Produit Cible

### 3.1 OKAFRIK

OKAFRIK est la maison mere et le niveau de gouvernance globale.

OKAFRIK doit gerer :

- strategie produit ;
- standards de securite ;
- identite de marque groupe ;
- supervision globale ;
- politiques de donnees ;
- abonnements et offres commerciales ;
- gouvernance multi-pays ;
- support et exploitation plateforme ;
- audit global ;
- services partages entre produits OKAFRIK.

### 3.2 Somafrik ERP

Somafrik est l'application ERP scolaire d'OKAFRIK.

Somafrik doit gerer :

- pays ;
- etablissements ;
- utilisateurs ;
- roles et permissions ;
- annees academiques ;
- classes ;
- cours / matieres ;
- enseignants ;
- eleves / etudiants ;
- parents ;
- inscriptions ;
- presences ;
- notes ;
- periodes, trimestres ou semestres ;
- bulletins ;
- paiements ;
- annonces ;
- messages ;
- notifications ;
- rapports ;
- audit.

### 3.3 Application Mobile / Tablette Somafrik

L'Application Mobile / Tablette Somafrik est l'interface quotidienne des acteurs de terrain :

- parents ;
- eleves / etudiants ;
- enseignants ;
- secretaires ;
- prefets des etudes ;
- administrateurs etablissement ;
- responsables pedagogiques ;
- administrateurs pays, si active ;
- super administrateurs, si active.

Elle doit etre rapide, lisible, adaptee a Android, iOS et tablette, et utilisable en contexte reseau instable.

### 3.4 BackOffice Somafrik

Le BackOffice Somafrik est l'interface web d'administration et de pilotage.

Il doit couvrir :

- administration globale OKAFRIK / Somafrik ;
- administration pays ;
- administration etablissement ;
- gestion des roles et permissions ;
- gestion des etablissements ;
- configuration academique ;
- gestion financiere ;
- rapports ;
- audit ;
- supervision des donnees.

## 4. Regles SaaS Multi-Tenant

SOM-SAA-001 - Isolation pays  
Un administrateur pays ne doit consulter, modifier, suspendre ou exporter que les donnees rattachees a son pays.

SOM-SAA-002 - Isolation etablissement  
Un administrateur etablissement ne doit jamais voir les donnees d'un autre etablissement.

SOM-SAA-003 - Isolation role  
Chaque role doit voir uniquement les ecrans, menus, donnees, boutons et actions accordes par ses droits.

SOM-SAA-004 - Isolation annee academique  
Les classes, inscriptions, periodes, notes, bulletins, presences et paiements doivent etre rattaches a une annee academique.

SOM-SAA-005 - Identifiants publics  
Chaque entite sensible doit posseder un UUID interne et un identifiant metier lisible : pays, etablissement, utilisateur, eleve, enseignant, paiement, bulletin.

SOM-SAA-006 - Configuration par etablissement  
Chaque etablissement doit pouvoir configurer ses classes, cours, periodes, types d'evaluation, baremes, bulletins et regles internes.

## 5. Roles Produit

SOM-ROLE-001 - Super Administrateur OKAFRIK  
Gere la plateforme globale : pays, administrateurs pays, etablissements, abonnements, securite, audit, statistiques globales et parametrage transverse.

SOM-ROLE-002 - Administrateur Pays  
Gere uniquement son pays : etablissements, administrateurs etablissement, validation, suspension/reactivation, abonnements pays, support et statistiques nationales.

SOM-ROLE-003 - Administrateur Etablissement  
Gere un seul etablissement : utilisateurs, eleves, enseignants, classes, matieres, paiements, annonces, parametres et rapports locaux.

SOM-ROLE-004 - Proviseur / Directeur  
Supervise la pedagogie et l'administration scolaire : enseignants, bulletins, rapports, discipline et statistiques de l'etablissement.

SOM-ROLE-005 - Prefet Des Etudes  
Controle notes, presences, examens, bulletins, classes, emplois du temps et rapports pedagogiques.

SOM-ROLE-006 - Enseignant  
Voit uniquement ses classes et ses cours affectes. Il peut faire l'appel, creer une session de notes, ajouter ou modifier les notes des eleves presents, consulter et modifier ses sessions.

SOM-ROLE-007 - Secretaire  
Gere inscriptions, dossiers eleves, documents administratifs et communications selon les droits accordes.

SOM-ROLE-008 - Comptable  
Gere paiements, recus, soldes, impayes, rapports financiers et exports.

SOM-ROLE-009 - Parent  
Consulte les donnees de ses enfants : notes, bulletins, presences, paiements, annonces, messages et notifications.

SOM-ROLE-010 - Eleve / Etudiant  
Consulte ses notes, bulletins, presences, emploi du temps, devoirs, messages et annonces.

## 6. Application Mobile / Tablette Somafrik

SOM-MOB-001 - Accueil  
Afficher le logo Somafrik, la mention "par OKAFRIK", un slogan court et un bouton de connexion.

SOM-MOB-002 - Identification organisation  
Permettre la saisie d'un code etablissement ou d'un identifiant organisation.

SOM-MOB-003 - Detection automatique  
Detecter automatiquement le type d'acces : Super Admin, Admin Pays ou utilisateur d'etablissement.

SOM-MOB-004 - Contexte etablissement  
Quand un code etablissement est valide, afficher le logo, le nom, le pays, la ville et le champ identifiant utilisateur.

SOM-MOB-005 - Role detecte  
Apres saisie de l'identifiant utilisateur, afficher le role detecte avant la saisie du mot de passe ou du PIN.

SOM-MOB-006 - Dashboard par role  
Chaque role doit arriver sur un tableau de bord adapte a ses droits.

SOM-MOB-007 - Navigation mobile  
Fournir une navigation basse, persistante, adaptee aux modules autorises.

SOM-MOB-008 - Mode hors connexion  
Permettre la consultation locale de certaines donnees et la synchronisation automatique au retour reseau.

SOM-MOB-009 - Notifications push  
Notifier absence, retard, paiement, note publiee, bulletin publie, annonce, message et incident important.

SOM-MOB-010 - Notes enseignant  
L'enseignant doit creer une session datee, choisir le type de session selon la configuration de l'etablissement, definir le bareme, afficher uniquement les eleves presents a cette date, puis saisir ou modifier les notes.

## 7. BackOffice Somafrik

SOM-BO-001 - Dashboard dynamique  
Chaque role backoffice doit disposer d'indicateurs adaptes a son perimetre : pays, etablissements, utilisateurs, abonnements, eleves, enseignants, classes, paiements, absences, notes et audit.

SOM-BO-002 - Menu lateral par droits  
Le menu doit etre genere selon le role, les permissions, le pays et l'etablissement.

SOM-BO-003 - Gestion des utilisateurs  
Permettre creation, modification, suspension/reactivation, reset mot de passe, historique de connexions, import/export, filtre par role et perimetre.

SOM-BO-004 - Gestion des roles et permissions  
Le Super Administrateur OKAFRIK doit gerer les roles et attribuer les droits Lire, Creer, Modifier, Supprimer et Suspendre par module.

SOM-BO-005 - Gestion des pays  
Le Super Administrateur OKAFRIK doit creer, modifier, suspendre/reactiver et administrer les pays.

SOM-BO-006 - Gestion des etablissements  
Le Super Administrateur OKAFRIK et l'Administrateur Pays doivent gerer creation, validation, modification, suspension/reactivation, abonnement, logo et parametrage d'etablissement selon leur perimetre.

SOM-BO-007 - Gestion academique  
Gerer classes, matieres, inscriptions, emplois du temps, periodes, evaluations, notes et bulletins.

SOM-BO-008 - Configuration etablissement  
Chaque etablissement doit configurer ses periodes, types de session, baremes, classes, cours, bulletins et regles de calcul.

SOM-BO-009 - Gestion des presences  
Permettre appel rapide, correction encadree, justificatifs, historique, rapports PDF/Excel et statistiques.

SOM-BO-010 - Gestion des paiements  
Gerer frais scolaires, encaissements, impayes, recus, rapports financiers et rapprochements.

SOM-BO-011 - Communications  
Gerer notifications, annonces, messagerie interne, pieces jointes, conversations et historique.

SOM-BO-012 - Messages parents  
Diviser la messagerie en messages recus et messages envoyes. Un message recu doit passer de non lu a lu lorsqu'il est ouvert.

## 8. Donnees Et PostgreSQL

SOM-DATA-001 - Base reelle  
Les donnees MVP doivent etre stockees dans PostgreSQL, pas uniquement en memoire ou fichier local.

SOM-DATA-002 - Tables prioritaires MVP  
Le MVP doit couvrir au minimum : countries, schools, users, academic_years, terms, classes, subjects, teachers, students, enrollments, teacher_assignments, attendance_sessions, attendance, grade_sessions, grades, payments, announcements, messages, notifications, audit_logs.

SOM-DATA-003 - Contraintes d'unicite  
Les codes pays, etablissements, utilisateurs, eleves, enseignants et paiements doivent etre uniques.

SOM-DATA-004 - Historisation  
Les donnees sensibles ne doivent pas etre supprimees brutalement. Preferer status, archived, inactive ou deleted_at.

SOM-DATA-005 - Donnees de test MVP  
Toutes les donnees de test utiles a la demonstration doivent etre migrees dans PostgreSQL pour garantir la synchronisation Mobile / BackOffice.

## 9. Securite

SOM-SEC-001 - Authentification centralisee  
Toutes les connexions doivent passer par le backend Somafrik.

SOM-SEC-002 - Hashage secret  
Aucun mot de passe ou PIN ne doit etre stocke en clair.

SOM-SEC-003 - JWT et refresh token  
Les sessions doivent utiliser access token court, refresh token, expiration et renouvellement securise.

SOM-SEC-004 - RBAC strict  
Le backend doit verifier identite, role, pays, etablissement et permissions pour chaque action sensible.

SOM-SEC-005 - Audit obligatoire  
Journaliser connexion, deconnexion, creation utilisateur, changement role, modification note, validation bulletin, paiement, suspension et export.

SOM-SEC-006 - Blocage securite  
Apres plusieurs tentatives echouees, le compte doit etre temporairement bloque et l'evenement audite.

## 10. Performance Et Exploitation

SOM-PERF-001 - Temps de reponse  
Les actions courantes doivent repondre en moins de 2 secondes.

SOM-PERF-002 - Pagination  
Toutes les listes volumineuses doivent etre paginees et filtrables.

SOM-PERF-003 - Cache  
Les statistiques et dashboards doivent pouvoir etre caches.

SOM-PERF-004 - Disponibilite  
L'objectif de disponibilite SaaS est 99,9 %.

SOM-OPS-001 - Sauvegarde  
PostgreSQL doit etre sauvegarde automatiquement.

SOM-OPS-002 - Observabilite  
Les erreurs API, synchronisations, connexions et actions critiques doivent etre journalisees et exploitables.

## 11. Priorite MVP

Le MVP Somafrik par OKAFRIK doit livrer d'abord :

1. Authentification multi-role et detection organisation.
2. Isolation pays / etablissement / role.
3. BackOffice Super Admin OKAFRIK et Admin Pays.
4. BackOffice Administrateur Etablissement.
5. Application Mobile / Tablette Somafrik par role.
6. Utilisateurs, roles, permissions et suspension.
7. Etablissements, abonnements et parametrage.
8. Eleves, enseignants, classes et affectations.
9. Presences et appels.
10. Sessions de notes, periodes, baremes et calculs.
11. Bulletins simples et PDF.
12. Paiements et recus.
13. Notifications, annonces et messages.
14. Audit, exports, pagination et sauvegarde.

## 12. Definition Produit Finale

OKAFRIK est la maison mere. Somafrik est l'application ERP scolaire SaaS d'OKAFRIK pour les etablissements scolaires et universitaires.

Somafrik combine une Application Mobile / Tablette pour l'usage quotidien et un BackOffice web pour l'administration. Le produit doit rester SaaS, multi-pays, multi-etablissements, multi-roles, securise, auditable et pret a l'emploi pour un MVP exploitable.
