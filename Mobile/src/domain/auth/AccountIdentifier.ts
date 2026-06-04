export class AccountIdentifier {
  readonly schoolCode: string;
  readonly raw: string;
  readonly upper: string;
  readonly values: string[];

  constructor(schoolCode: string, identifier: string) {
    this.schoolCode = schoolCode.trim().toUpperCase();
    this.raw = identifier.trim();
    this.upper = this.raw.toUpperCase();
    this.values = this.buildValues();
  }

  matches(value?: string) {
    const normalizedValue = String(value ?? "").trim().toUpperCase();

    if (!normalizedValue) {
      return false;
    }

    if (this.values.includes(normalizedValue) || this.values.includes(String(value).trim())) {
      return true;
    }

    const localMatch = AccountIdentifier.parseLocalIdentifier(normalizedValue);

    if (!localMatch) {
      return false;
    }

    return AccountIdentifier.buildAliases(this.schoolCode, localMatch.profile, localMatch.sequence).some((alias) =>
      this.values.includes(alias)
    );
  }

  isAdmin() {
    return this.raw.toLowerCase() === "admin";
  }

  private buildValues() {
    const values = new Set([this.raw, this.upper]);
    const localMatch = AccountIdentifier.parseLocalIdentifier(this.upper);

    if (localMatch) {
      AccountIdentifier.buildAliases(this.schoolCode, localMatch.profile, localMatch.sequence).forEach((alias) =>
        values.add(alias)
      );
    }

    return [...values];
  }

  private static parseLocalIdentifier(value: string) {
    const match = value
      .trim()
      .toUpperCase()
      .match(/(?:^|-)(ELE|ETU|ENS)-(\d+)$/);

    if (!match) {
      return null;
    }

    return { profile: match[1], sequence: match[2] };
  }

  private static buildAliases(schoolCode: string, profile: string, sequence: string) {
    const profiles = AccountIdentifier.getProfileAliases(profile);
    const sequences = [
      String(Number(sequence)),
      AccountIdentifier.formatSequence(sequence, 4),
      AccountIdentifier.formatSequence(sequence, 5),
      AccountIdentifier.formatSequence(sequence, 6),
    ].filter((value, index, values) => values.indexOf(value) === index);
    const aliases: string[] = [];

    profiles.forEach((profileAlias) => {
      sequences.forEach((formattedSequence) => {
        const localIdentifier = `${profileAlias}-${formattedSequence}`;
        aliases.push(localIdentifier);
        aliases.push(`${schoolCode}-${localIdentifier}`);
      });
    });

    return aliases;
  }

  private static getProfileAliases(profile: string) {
    const normalizedProfile = profile.trim().toUpperCase();

    if (["ELE", "ETU"].includes(normalizedProfile)) {
      return ["ELE", "ETU"];
    }

    return ["ENS"];
  }

  private static formatSequence(sequence: string, size: number) {
    return String(Number(sequence)).padStart(size, "0");
  }
}
