import { Parent } from "./models/Parent";

const parent = new Parent(
  "PAR001",
  "Baudouin",
  "+33612345678",
  "LUM001",
  "1234"
);

console.log(parent.afficherProfil());