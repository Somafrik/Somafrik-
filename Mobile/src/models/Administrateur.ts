import { Utilisateur } from "./Utilisateur";

export class Administrateur extends Utilisateur {
  private motDePasse: string;

  constructor(
    id: string,
    nom: string,
    email: string,
    motDePasse: string
  ) {
    super(id, nom, email);
    this.motDePasse = motDePasse;
  }

  verifierConnexion(email: string, motDePasse: string): boolean {
    return this.email === email && this.motDePasse === motDePasse;
  }

  changerMotDePasse(ancienMotDePasse: string, nouveauMotDePasse: string): boolean {
    if (this.motDePasse !== ancienMotDePasse) {
      return false;
    }

    this.motDePasse = nouveauMotDePasse;
    return true;
  }
}