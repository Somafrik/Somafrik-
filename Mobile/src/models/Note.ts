export class Note {
  constructor(
    public id: string,
    public eleveId: string,
    public matiere: string,
    public valeur: number,
    public coefficient: number,
    public date: string
  ) {}

  calculerPoints(): number {
    return this.valeur * this.coefficient;
  }
}