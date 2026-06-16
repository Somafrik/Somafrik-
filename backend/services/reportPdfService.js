const fs = require("fs");
const path = require("path");

class ReportPdfService {
  constructor({ school }) {
    this.school = school;
    this.logo = this.loadLogo();
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
      { text: "Somafrik - Bulletin scolaire", size: 20, x: 54, y: 790 },
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
      { text: "Document genere automatiquement par Somafrik.", size: 9, x: 54, y: 54 },
    ];
  }

  buildContent(lines) {
    const commands = [];

    if (this.logo) {
      commands.push("q");
      commands.push("88 0 0 88 450 728 cm");
      commands.push("/Logo Do");
      commands.push("Q");
    }

    commands.push("BT", "/F1 10 Tf");

    lines.forEach((line) => {
      commands.push(`/F1 ${line.size} Tf`);
      commands.push(`1 0 0 1 ${line.x} ${line.y} Tm`);
      commands.push(`(${this.escapePdfText(line.text)}) Tj`);
    });

    commands.push("ET");
    return commands.join("\n");
  }

  createPdf(content) {
    const resources = this.logo
      ? "/Resources << /Font << /F1 4 0 R >> /XObject << /Logo 6 0 R >> >>"
      : "/Resources << /Font << /F1 4 0 R >> >>";
    const objects = [
      "<< /Type /Catalog /Pages 2 0 R >>",
      "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] ${resources} /Contents 5 0 R >>`,
      "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
      `<< /Length ${Buffer.byteLength(content, "latin1")} >>\nstream\n${content}\nendstream`,
    ];

    if (this.logo) {
      objects.push({
        dictionary: `<< /Type /XObject /Subtype /Image /Width ${this.logo.width} /Height ${this.logo.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${this.logo.buffer.length} >>`,
        stream: this.logo.buffer,
      });
    }

    const chunks = [Buffer.from("%PDF-1.4\n", "latin1")];
    const offsets = [0];
    let byteLength = chunks[0].length;

    objects.forEach((object, index) => {
      offsets.push(byteLength);
      const objectChunks = this.buildPdfObject(index + 1, object);
      chunks.push(...objectChunks);
      byteLength += objectChunks.reduce((total, chunk) => total + chunk.length, 0);
    });

    const xrefOffset = byteLength;
    chunks.push(Buffer.from(`xref\n0 ${objects.length + 1}\n`, "latin1"));
    chunks.push(Buffer.from("0000000000 65535 f \n", "latin1"));
    offsets.slice(1).forEach((offset) => {
      chunks.push(Buffer.from(`${String(offset).padStart(10, "0")} 00000 n \n`, "latin1"));
    });
    chunks.push(
      Buffer.from(
        `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`,
        "latin1",
      ),
    );

    return Buffer.concat(chunks);
  }

  buildPdfObject(number, object) {
    if (typeof object === "string") {
      return [Buffer.from(`${number} 0 obj\n${object}\nendobj\n`, "latin1")];
    }

    return [
      Buffer.from(`${number} 0 obj\n${object.dictionary}\nstream\n`, "latin1"),
      object.stream,
      Buffer.from("\nendstream\nendobj\n", "latin1"),
    ];
  }

  loadLogo() {
    const logoPath = path.join(__dirname, "..", "assets", "somafrik-logo.jpg");

    try {
      const buffer = fs.readFileSync(logoPath);
      return { buffer, ...this.getJpegSize(buffer) };
    } catch (error) {
      return null;
    }
  }

  getJpegSize(buffer) {
    let offset = 2;

    while (offset < buffer.length) {
      if (buffer[offset] !== 0xff) {
        offset += 1;
        continue;
      }

      const marker = buffer[offset + 1];
      const length = buffer.readUInt16BE(offset + 2);
      const isStartOfFrame = marker >= 0xc0 && marker <= 0xc3;

      if (isStartOfFrame) {
        return {
          height: buffer.readUInt16BE(offset + 5),
          width: buffer.readUInt16BE(offset + 7),
        };
      }

      offset += length + 2;
    }

    return { width: 1254, height: 1254 };
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
