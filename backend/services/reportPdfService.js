class ReportPdfService {
  constructor({ school }) {
    this.school = school;
  }

  generateReportCardPdf(report) {
    const lines = this.buildLines(report);
    const content = this.buildContent(lines);
    return this.createPdf(content);
  }

  buildLines(report) {
    const student = report.student ?? {};
    const subjectRows = report.subjects?.length
      ? report.subjects
      : [{ subject: "Aucune note publiee", average: 0, coefficient: 0 }];

    return [
      { text: "SchoolLink - Bulletin scolaire", size: 20, x: 54, y: 790 },
      { text: this.school.name, size: 13, x: 54, y: 764 },
      { text: `Code etablissement: ${this.school.code}`, size: 10, x: 54, y: 746 },
      { text: `Periode: ${report.period}`, size: 12, x: 54, y: 710 },
      { text: `Statut: ${report.status}`, size: 12, x: 360, y: 710 },
      { text: `Eleve: ${student.name ?? "Eleve"}`, size: 12, x: 54, y: 688 },
      { text: `Matricule: ${student.matricule ?? student.publicId ?? "-"}`, size: 12, x: 54, y: 670 },
      { text: `Classe: ${student.className ?? "-"}`, size: 12, x: 360, y: 670 },
      { text: "Resultats par matiere", size: 14, x: 54, y: 632 },
      { text: "Matiere", size: 11, x: 54, y: 610 },
      { text: "Moyenne", size: 11, x: 330, y: 610 },
      { text: "Coeff.", size: 11, x: 430, y: 610 },
      ...subjectRows.flatMap((row, index) => {
        const y = 588 - index * 20;
        return [
          { text: row.subject, size: 10, x: 54, y },
          { text: `${Number(row.average ?? 0).toFixed(2)}/20`, size: 10, x: 330, y },
          { text: String(row.coefficient ?? 1), size: 10, x: 430, y },
        ];
      }),
      { text: `Moyenne generale: ${Number(report.average ?? 0).toFixed(2)}/20`, size: 13, x: 54, y: 260 },
      { text: `Rang: ${report.rankLabel ?? "-"}`, size: 13, x: 54, y: 238 },
      { text: `Appreciation: ${report.appreciation ?? "-"}`, size: 13, x: 54, y: 216 },
      { text: `Genere le: ${new Date(report.generatedAt).toLocaleDateString("fr-FR")}`, size: 9, x: 54, y: 72 },
      { text: "Document genere automatiquement par SchoolLink.", size: 9, x: 54, y: 54 },
    ];
  }

  buildContent(lines) {
    const commands = ["BT", "/F1 10 Tf"];

    lines.forEach((line) => {
      commands.push(`/F1 ${line.size} Tf`);
      commands.push(`1 0 0 1 ${line.x} ${line.y} Tm`);
      commands.push(`(${this.escapePdfText(line.text)}) Tj`);
    });

    commands.push("ET");
    return commands.join("\n");
  }

  createPdf(content) {
    const objects = [
      "<< /Type /Catalog /Pages 2 0 R >>",
      "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
      "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>",
      "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
      `<< /Length ${Buffer.byteLength(content, "latin1")} >>\nstream\n${content}\nendstream`,
    ];
    const chunks = ["%PDF-1.4\n"];
    const offsets = [0];

    objects.forEach((object, index) => {
      offsets.push(Buffer.byteLength(chunks.join(""), "latin1"));
      chunks.push(`${index + 1} 0 obj\n${object}\nendobj\n`);
    });

    const xrefOffset = Buffer.byteLength(chunks.join(""), "latin1");
    chunks.push(`xref\n0 ${objects.length + 1}\n`);
    chunks.push("0000000000 65535 f \n");
    offsets.slice(1).forEach((offset) => {
      chunks.push(`${String(offset).padStart(10, "0")} 00000 n \n`);
    });
    chunks.push(`trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`);

    return Buffer.from(chunks.join(""), "latin1");
  }

  escapePdfText(value) {
    return String(value ?? "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^\x20-\x7E]/g, "")
      .replace(/\\/g, "\\\\")
      .replace(/\(/g, "\\(")
      .replace(/\)/g, "\\)");
  }
}

module.exports = { ReportPdfService };
