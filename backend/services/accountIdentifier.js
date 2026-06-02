class AccountIdentifier {
  constructor(schoolCode, identifier) {
    this.schoolCode = String(schoolCode ?? "").trim().toUpperCase();
    this.raw = String(identifier ?? "").trim();
    this.upper = this.raw.toUpperCase();
    this.values = this.buildValues();
  }

  matches(value) {
    const normalizedValue = String(value ?? "").trim().toUpperCase();

    if (!normalizedValue) {
      return false;
    }

    if (this.values.includes(normalizedValue) || this.values.includes(String(value).trim())) {
      return true;
    }

    const localMatch = normalizedValue.match(/(?:^|-)(ELE|ETU|ENS)-(\d+)$/);

    if (!localMatch) {
      return false;
    }

    const [, profile, sequence] = localMatch;
    const normalizedSequence = AccountIdentifier.formatSequence(sequence, 4);
    const extendedSequence = AccountIdentifier.formatSequence(sequence, 6);

    return (
      this.values.includes(`${profile}-${sequence}`) ||
      this.values.includes(`${profile}-${normalizedSequence}`) ||
      this.values.includes(`${profile}-${extendedSequence}`)
    );
  }

  isAdmin() {
    return this.raw.toLowerCase() === "admin";
  }

  buildValues() {
    const values = new Set([this.raw, this.upper]);
    const localMatch = this.upper.match(/^(ELE|ETU|ENS)-(\d+)$/);

    if (localMatch) {
      const [, profile, sequence] = localMatch;
      const normalizedSequence = AccountIdentifier.formatSequence(sequence, 4);
      const extendedSequence = AccountIdentifier.formatSequence(sequence, 6);
      const localIdentifier = `${profile}-${normalizedSequence}`;
      const extendedLocalIdentifier = `${profile}-${extendedSequence}`;

      values.add(localIdentifier);
      values.add(extendedLocalIdentifier);
      values.add(`${this.schoolCode}-${this.upper}`);
      values.add(`${this.schoolCode}-${localIdentifier}`);
      values.add(`${this.schoolCode}-${extendedLocalIdentifier}`);
    }

    return [...values];
  }

  static formatSequence(sequence, size) {
    return String(Number(sequence)).padStart(size, "0");
  }
}

module.exports = { AccountIdentifier };
