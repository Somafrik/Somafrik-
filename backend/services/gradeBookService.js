class GradeBookService {
  constructor({ students, notes, courses }) {
    this.students = students;
    this.notes = notes;
    this.courses = courses;
  }

  getStudentAverage(studentId) {
    const studentNotes = this.notes.filter((note) => note.studentId === studentId);
    const subjects = [...new Set(studentNotes.map((note) => note.subject))];
    const subjectRows = subjects.map((subject) => this.getSubjectAverage(studentId, subject));
    const totalPoints = subjectRows.reduce((sum, row) => sum + row.average * row.coefficient, 0);
    const totalCoefficients = subjectRows.reduce((sum, row) => sum + row.coefficient, 0);
    const average = totalCoefficients ? totalPoints / totalCoefficients : 0;
    const rank = this.getClassRankingForStudent(studentId);

    return {
      average,
      totalPoints,
      totalCoefficients,
      rankLabel: `${rank.rank}e / ${rank.total}`,
      appreciation: this.getAutomaticAppreciation(average),
      subjects: subjectRows,
    };
  }

  getSubjectAverage(studentId, subject) {
    const notes = this.notes.filter((note) => note.studentId === studentId && note.subject === subject);
    const course = this.courses.find((item) => item.name === subject);
    const total = notes.reduce((sum, note) => {
      const scale = note.scale ?? 20;
      const value = scale === 20 ? note.value : (note.value / scale) * 20;
      return sum + value * (note.evaluationCoefficient ?? 1);
    }, 0);
    const coefficients = notes.reduce((sum, note) => sum + (note.evaluationCoefficient ?? 1), 0);

    return {
      subject,
      average: coefficients ? total / coefficients : 0,
      coefficient: course?.coefficient ?? 1,
    };
  }

  generateReport(studentId, period = "Trimestre 1", status = "Publié") {
    const student = this.students.find((item) => item.id === studentId);
    const average = this.getStudentAverage(studentId);

    return {
      id: `BUL-${studentId}-${period.replace(/\s+/g, "-").toUpperCase()}`,
      period,
      status,
      student,
      ...average,
      pdfReady: status === "Publié",
      generatedAt: new Date().toISOString(),
    };
  }

  getClassRanking(className) {
    const rows = this.students
      .filter((student) => student.className === className)
      .map((student) => ({ student, average: this.getStudentAverageValue(student.id) }))
      .sort((a, b) => b.average - a.average);
    let lastAverage = null;
    let lastRank = 0;

    return rows.map((row, index) => {
      if (lastAverage === null || row.average !== lastAverage) {
        lastAverage = row.average;
        lastRank = index + 1;
      }

      return { ...row, rank: lastRank };
    });
  }

  getClassRankingForStudent(studentId) {
    const student = this.students.find((item) => item.id === studentId);
    if (!student) return { rank: 0, total: 0 };

    const ranking = this.getClassRanking(student.className);
    const row = ranking.find((item) => item.student.id === studentId);

    return { rank: row?.rank ?? 0, total: ranking.length };
  }

  getAutomaticAppreciation(average) {
    if (average >= 16) return "Excellent";
    if (average >= 14) return "Très Bien";
    if (average >= 12) return "Bien";
    if (average >= 10) return "Assez Bien";
    return "Insuffisant";
  }

  getStudentAverageValue(studentId) {
    const studentNotes = this.notes.filter((note) => note.studentId === studentId);
    const subjects = [...new Set(studentNotes.map((note) => note.subject))];
    const subjectRows = subjects.map((subject) => this.getSubjectAverage(studentId, subject));
    const totalPoints = subjectRows.reduce((sum, row) => sum + row.average * row.coefficient, 0);
    const totalCoefficients = subjectRows.reduce((sum, row) => sum + row.coefficient, 0);

    return totalCoefficients ? totalPoints / totalCoefficients : 0;
  }
}

module.exports = { GradeBookService };
