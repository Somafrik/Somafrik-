import { Utilisateur } from "./Utilisateur";

export class Parent extends Utilisateur {
  codeEtablissement: string;
  private pin: string;

  constructor(
    id: string,
    nom: string,
    telephone: string,
    codeEtablissement: string,
    pin: string
  ) {
    super(id, nom, undefined, telephone);

    this.codeEtablissement = codeEtablissement;
    this.pin = pin;
  }

  verifierConnexion(
    codeEtablissement: string,
    telephone: string,
    pin: string
  ): boolean {
    return (
      this.codeEtablissement === codeEtablissement &&
      this.telephone === telephone &&
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
