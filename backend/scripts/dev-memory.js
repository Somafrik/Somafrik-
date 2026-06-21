/**
 * Démarre le backend sans PostgreSQL (données en mémoire, rechargées à chaque run).
 * Usage: npm run dev:memory
 */
process.env.SOMAFRIK_DB_REQUIRED = "false";
process.env.NODE_ENV = process.env.NODE_ENV ?? "development";
require("../server.js");
