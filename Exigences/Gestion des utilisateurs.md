Pour SchoolLink, la gestion des utilisateurs est un module central. Voici les exigences métier et fonctionnelles que je recommande.



Gestion des utilisateurs

Objectif



Permettre à un établissement de créer, gérer et sécuriser les comptes des différents acteurs :



Administrateur établissement

Directeur

Secrétaire

Enseignant

Parent

Élève / Étudiant

Comptable

Surveillant

Super Administrateur SchoolLink

Exigences métier

EM-UTIL-001 : Création d'utilisateur



Le système doit permettre à un administrateur autorisé de créer un utilisateur.



Informations obligatoires :



Nom

Prénom

Sexe

Téléphone

Email (optionnel)

Rôle

Établissement

Identifiant unique

EM-UTIL-002 : Attribution d'un rôle



Chaque utilisateur doit être associé à un rôle unique ou multiple selon la politique de l'établissement.



Exemples :



Enseignant

Secrétaire

Comptable

Parent

Directeur

EM-UTIL-003 : Gestion des permissions



Les permissions doivent être automatiquement attribuées selon le rôle.



Exemple :



|Fonction|Enseignant|Secrétaire|Directeur|
|-|-|-|-|
|Voir élèves|Oui|Oui|Oui|
|Modifier notes|Oui|Non|Oui|
|Gérer paiements|Non|Oui|Oui|
|Gérer utilisateurs|Non|Non|Oui|



EM-UTIL-004 : Désactivation d'un compte



Un utilisateur peut être :



Actif

Suspendu

Désactivé



Le compte désactivé ne doit plus pouvoir se connecter.



EM-UTIL-005 : Historisation



Le système doit enregistrer :



Date de création

Dernière connexion

Créateur du compte

Modifications effectuées

Exigences fonctionnelles

EF-UTIL-001 : Liste des utilisateurs



L'utilisateur autorisé peut :



Rechercher un utilisateur

Trier la liste

Filtrer par rôle

Filtrer par établissement

Filtrer par statut

EF-UTIL-002 : Consultation d'un utilisateur



Affichage :



Photo

Nom complet

Téléphone

Rôle

Statut

Dernière connexion

EF-UTIL-003 : Modification



L'administrateur peut modifier :



Téléphone

Email

Rôle

Permissions

Statut

EF-UTIL-004 : Réinitialisation du mot de passe



Le système doit permettre :



Réinitialisation par administrateur

Réinitialisation par SMS

Réinitialisation par email

EF-UTIL-005 : Importation massive



Le système doit permettre l'import :



Excel

CSV



Pour :



Enseignants

Élèves

Parents

EF-UTIL-006 : Exportation



Export :



Excel

PDF

CSV

Critères d'acceptation

Écran Liste des utilisateurs

CA-UTIL-001



Étant donné que je suis administrateur



Quand j'ouvre la gestion des utilisateurs



Alors la liste des utilisateurs apparaît.



CA-UTIL-002



Quand je saisis un nom dans la recherche



Alors seuls les utilisateurs correspondants sont affichés.



Écran Création utilisateur

CA-UTIL-003



Quand tous les champs obligatoires sont remplis



Et que je clique sur "Créer"



Alors l'utilisateur est enregistré.



CA-UTIL-004



Quand un champ obligatoire est vide



Alors un message d'erreur est affiché.



Écran Gestion des rôles

CA-UTIL-005



Quand je change le rôle d'un utilisateur



Alors les permissions associées sont mises à jour automatiquement.



Écran Réinitialisation mot de passe

CA-UTIL-006



Quand je clique sur "Réinitialiser le mot de passe"



Alors un nouveau mot de passe temporaire est généré.



Écrans à prévoir dans SchoolLink

Liste des utilisateurs

Création utilisateur

Fiche utilisateur

Modification utilisateur

Gestion des rôles

Gestion des permissions

Réinitialisation mot de passe

Historique des connexions

Import Excel/CSV

Export utilisateurs



Pour une version SaaS professionnelle, je recommande également un module multi-établissements, où un Super Administrateur SchoolLink peut gérer plusieurs établissements depuis une seule plateforme.

