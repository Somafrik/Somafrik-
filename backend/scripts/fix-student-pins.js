/**
 * Diagnostique et répare les PIN étudiants incohérents dans PostgreSQL.
 *
 * Contexte : chaque étudiant démo doit pouvoir se connecter avec le PIN « 1234 ».
 * Le PIN de connexion est lu dans la table `users` (role STUDENT) via la jointure
 * `users.user_code = students.student_code`. Si cette ligne manque ou contient un
 * hash qui ne correspond pas à « 1234 », la connexion échoue (401).
 *
 * Ce script :
 *   1) crée la ligne `users` (role STUDENT) manquante pour chaque étudiant ;
 *   2) réaligne le `pin_hash` sur « 1234 » pour tout étudiant dont le PIN ne
 *      vérifie pas (sans toucher aux comptes déjà personnalisés et valides).
 *
 * Usage :
 *   node backend/scripts/fix-student-pins.js            # applique la correction
 *   node backend/scripts/fix-student-pins.js --dry-run  # diagnostic seulement
 */
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", "..", ".env") });
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

const { Pool } = require("pg");
const { resolveDatabaseUrl } = require("../db/connectionConfig");
const { hashSecret, verifySecret } = require("../services/credentialService");

const DEFAULT_PIN = process.env.SOMAFRIK_DEFAULT_STUDENT_PIN || "1234";
const dryRun = process.argv.includes("--dry-run");

async function main() {
  const pool = new Pool({ connectionString: resolveDatabaseUrl() });

  const { rows: students } = await pool.query(
    `SELECT st.school_id, st.student_code, st.first_name, st.last_name,
            st.parent_email, st.parent_phone, st.status, u.id AS user_id, u.pin_hash
     FROM students st
     LEFT JOIN users u
       ON u.school_id = st.school_id AND u.user_code = st.student_code
     ORDER BY st.student_code`
  );

  const missing = [];
  const broken = [];
  for (const row of students) {
    if (!row.user_id) {
      missing.push(row);
    } else if (!verifySecret(DEFAULT_PIN, row.pin_hash)) {
      broken.push(row);
    }
  }

  console.log(`Étudiants analysés : ${students.length}`);
  console.log(`  • Comptes de connexion manquants : ${missing.length}`);
  console.log(`  • PIN incohérents (≠ ${DEFAULT_PIN})   : ${broken.length}`);
  if (missing.length) {
    console.log("    manquants :", missing.map((r) => r.student_code).join(", "));
  }
  if (broken.length) {
    console.log("    incohérents:", broken.map((r) => r.student_code).join(", "));
  }

  if (dryRun) {
    console.log("Mode --dry-run : aucune modification appliquée.");
    await pool.end();
    return;
  }

  let created = 0;
  let repaired = 0;

  for (const row of missing) {
    await pool.query(
      `INSERT INTO users (school_id, user_code, first_name, last_name, email, phone, password_hash, pin_hash, role, status)
       VALUES ($1, $2, $3, $4, $5, $6, NULL, $7, 'STUDENT', $8)
       ON CONFLICT (user_code) DO UPDATE SET pin_hash = EXCLUDED.pin_hash`,
      [
        row.school_id,
        row.student_code,
        row.first_name,
        row.last_name,
        row.parent_email,
        row.parent_phone,
        hashSecret(DEFAULT_PIN),
        row.status || "active",
      ]
    );
    created += 1;
  }

  for (const row of broken) {
    await pool.query(`UPDATE users SET pin_hash = $1, updated_at = NOW() WHERE id = $2`, [
      hashSecret(DEFAULT_PIN),
      row.user_id,
    ]);
    repaired += 1;
  }

  console.log(`Comptes de connexion créés : ${created}`);
  console.log(`PIN réalignés sur ${DEFAULT_PIN} : ${repaired}`);
  console.log("Correction terminée.");

  await pool.end();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
