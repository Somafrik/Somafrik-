/**
 * Build APK release Android (Somafrik Mobile) — test direct sur téléphone.
 */
const fs = require("fs");
const path = require("path");
const { mobileRoot, androidDir, loadBuildEnv, runGradle } = require("./build-android-env");

const apiUrl = loadBuildEnv();

console.log(`Build APK avec API: ${apiUrl}`);
console.log(`JAVA_HOME: ${process.env.JAVA_HOME}`);
console.log(`ANDROID_HOME: ${process.env.ANDROID_HOME}`);
console.log("Gradle assembleRelease en cours (premier build : 5 a 15 min)...");
console.log("");

runGradle("assembleRelease");

const apkPath = path.join(androidDir, "app", "build", "outputs", "apk", "release", "app-release.apk");
if (!fs.existsSync(apkPath)) {
  console.error(`APK introuvable apres build: ${apkPath}`);
  process.exit(1);
}

const distDir = path.join(mobileRoot, "dist");
fs.mkdirSync(distDir, { recursive: true });
const stamped = `somafrik-v13-${new Date().toISOString().slice(0, 10)}.apk`;
const distApk = path.join(distDir, stamped);
fs.copyFileSync(apkPath, distApk);

console.log("");
console.log("APK release genere:");
console.log(`  ${apkPath}`);
console.log(`  ${distApk}`);
console.log("");
console.log("Copiez l'APK sur le telephone et installez-le (desinstallez l'ancienne version avant).");
