/**
 * Build AAB release Android (Somafrik Mobile) pour Google Play Console.
 */
const fs = require("fs");
const path = require("path");
const { mobileRoot, androidDir, loadBuildEnv, runGradle } = require("./build-android-env");

const apiUrl = loadBuildEnv();

console.log(`Build AAB avec API: ${apiUrl}`);
console.log(`JAVA_HOME: ${process.env.JAVA_HOME}`);
console.log(`ANDROID_HOME: ${process.env.ANDROID_HOME}`);
console.log("Gradle bundleRelease en cours (premier build : 5 a 15 min)...");
console.log("");

runGradle("bundleRelease");

const aabPath = path.join(
  androidDir,
  "app",
  "build",
  "outputs",
  "bundle",
  "release",
  "app-release.aab",
);

if (!fs.existsSync(aabPath)) {
  console.error(`AAB introuvable apres build: ${aabPath}`);
  process.exit(1);
}

const distDir = path.join(mobileRoot, "dist");
fs.mkdirSync(distDir, { recursive: true });
const stamped = `somafrik-v13-${new Date().toISOString().slice(0, 10)}.aab`;
const distAab = path.join(distDir, stamped);
fs.copyFileSync(aabPath, distAab);

console.log("");
console.log("AAB release genere:");
console.log(`  ${aabPath}`);
console.log(`  ${distAab}`);
console.log("");
console.log("Upload sur Google Play Console > Production ou Tests internes.");
