export class Paiement {
  constructor(
    public id: string,
    public eleveId: string,
    public montant: number,
    public date: string,
    public statut: "PAYE" | "EN_ATTENTE"
  ) {}
}