/**
 * Configuration de connexion à la base de données.
 *
 * La couche de persistance possède désormais ses propres règles de connexion,
 * au lieu de les disperser dans le serveur HTTP (logique applicative).
 */

/**
 * Construit une URL PostgreSQL à partir des variables d'environnement POSTGRES_*.
 * @returns {string} URL de connexion `postgresql://...`.
 */
function buildDatabaseUrl() {
  const user = encodeURIComponent(process.env.POSTGRES_USER ?? "somafrik");
  const password = encodeURIComponent(process.env.POSTGRES_PASSWORD ?? "somafrik123");
  const host = process.env.POSTGRES_HOST ?? "localhost";
  const port = process.env.POSTGRES_PORT ?? "5432";
  const database = encodeURIComponent(process.env.POSTGRES_DB ?? "somafrik");
  return `postgresql://${user}:${password}@${host}:${port}/${database}`;
}

/**
 * Résout l'URL de connexion effective: `DATABASE_URL` si fournie, sinon
 * une URL dérivée des variables POSTGRES_*.
 * @returns {string}
 */
function resolveDatabaseUrl() {
  return process.env.DATABASE_URL ?? buildDatabaseUrl();
}

module.exports = { buildDatabaseUrl, resolveDatabaseUrl };
