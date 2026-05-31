import { Utilisateur } from "./Utilisateur";

export class Enseignant extends Utilisateur {
  codeEtablissement: string;
  matiere: string;
  motDePasse: string;

  constructor(
    id: string,
    nom: string,
    email: string,
    codeEtablissement: string,
    matiere: string,
    motDePasse: string
  ) {
    super(id, nom, email);

    this.codeEtablissement = codeEtablissement;
    this.matiere = matiere;
    this.motDePasse = motDePasse;
  }

  verifierConnexion(
    codeEtablissement: string,
    email: string,
    motDePasse: string
  ): boolean {
    return (
      this.codeEtablissement === codeEtablissement &&
      this.email === email &&
      this.motDePasse === motDePasse
    );
  }
}