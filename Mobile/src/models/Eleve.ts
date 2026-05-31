import { Utilisateur } from "./Utilisateur";

export class Eleve extends Utilisateur {
  matricule: string;
  classe: string;
  codeEtablissement: string;
  private pin: string;

  constructor(
    id: string,
    nom: string,
    matricule: string,
    classe: string,
    codeEtablissement: string,
    pin: string
  ) {
    super(id, nom);

    this.matricule = matricule;
    this.classe = classe;
    this.codeEtablissement = codeEtablissement;
    this.pin = pin;
  }

  verifierConnexion(
    codeEtablissement: string,
    matricule: string,
    pin: string
  ): boolean {
    return (
      this.codeEtablissement === codeEtablissement &&
      this.matricule === matricule &&
      this.pin === pin
    );
  }

  changerPin(
    ancienPin: string,
    nouveauPin: string
  ): boolean {
    if (this.pin !== ancienPin) {
      return false;
    }

    this.pin = nouveauPin;
    return true;
  }
}