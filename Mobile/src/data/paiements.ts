import { Paiement } from "../models/Paiement";

export const paiements: Paiement[] = [
  new Paiement("1", "1", 25000, "2026-05-10", "PAYE"),
  new Paiement("2", "1", 15000, "2026-05-25", "EN_ATTENTE"),
  new Paiement("3", "2", 25000, "2026-05-10", "PAYE"),
];