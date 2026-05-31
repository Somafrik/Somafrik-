export class Etablissement {
  nom: string;
  email: string;
  code: string;
  motDePasse: string;

  constructor(
    nom: string,
    email: string,
    code: string,
    motDePasse: string
  ) {
    this.nom = nom;
    this.email = email;
    this.code = code;
    this.motDePasse = motDePasse;
  }

  afficherInfos() {
    return `${this.nom} - ${this.email} - ${this.code}`;
  }

  verifierConnexion(
    email: string,
    motDePasse: string
  ): boolean {
    return (
      this.email === email &&
      this.motDePasse === motDePasse
    );
  }
}