/**
 * Fabrique de dépôts: point de composition unique de la couche de persistance.
 *
 * Le serveur HTTP n'a plus à connaître les détails d'instanciation ni la
 * stratégie de repli PostgreSQL -> mémoire. Il demande simplement un dépôt
 * conforme au contrat d'accès aux données.
 */

const { PostgresRepository } = require("./postgresRepository");
const { FallbackRepository } = require("./fallbackRepository");
const { resolveDatabaseUrl } = require("./connectionConfig");
const { assertRepositoryContract } = require("./repositoryContract");

/**
 * Crée le dépôt PostgreSQL (non initialisé).
 * @param {string} [databaseUrl] URL de connexion explicite.
 * @returns {PostgresRepository}
 */
function createPostgresRepository(databaseUrl = resolveDatabaseUrl()) {
  const repository = new PostgresRepository(databaseUrl);
  repository.engine = "postgresql";
  return assertRepositoryContract(repository, "postgresql");
}

/**
 * Crée le dépôt mémoire de secours (mode démo, non initialisé).
 * @returns {FallbackRepository}
 */
function createFallbackRepository() {
  return assertRepositoryContract(new FallbackRepository(), "memory");
}

/**
 * Initialise la persistance avec repli automatique.
 *
 * Tente PostgreSQL d'abord. En cas d'échec, bascule sur le dépôt mémoire,
 * sauf si `required` (ou SOMAFRIK_DB_REQUIRED=true) impose PostgreSQL.
 *
 * @param {object} [options]
 * @param {object} [options.repository] Dépôt PostgreSQL pré-construit à réutiliser.
 * @param {string} [options.databaseUrl] URL de connexion explicite.
 * @param {boolean} [options.required] Interdit le repli mémoire.
 * @param {Console} [options.logger] Journaliseur (défaut: console).
 * @returns {Promise<{ repository: object, engine: string, usedFallback: boolean }>}
 */
async function initializeRepository({
  repository = null,
  databaseUrl = resolveDatabaseUrl(),
  required = process.env.SOMAFRIK_DB_REQUIRED === "true",
  logger = console,
} = {}) {
  const primary = repository ?? createPostgresRepository(databaseUrl);

  try {
    await primary.init();
    return { repository: primary, engine: primary.engine ?? "postgresql", usedFallback: false };
  } catch (error) {
    if (required) {
      throw error;
    }

    logger.warn("PostgreSQL indisponible, démarrage en mode démo mémoire.");
    logger.warn(`Cause: ${error.code ?? error.message}`);

    const fallback = createFallbackRepository();
    await fallback.init();
    return { repository: fallback, engine: fallback.engine ?? "memory", usedFallback: true };
  }
}

module.exports = {
  createPostgresRepository,
  createFallbackRepository,
  initializeRepository,
};
