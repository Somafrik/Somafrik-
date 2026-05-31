export class Utilisateur {
  id: string;
  nom: string;
  email?: string;
  telephone?: string;

  constructor(
    id: string,
    nom: string,
    email?: string,
    telephone?: string
  ) {
    this.id = id;
    this.nom = nom;
    this.email = email;
    this.telephone = telephone;
  }

  afficherProfil() {
    return `${this.nom}`;
  }
}