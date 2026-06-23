/**
 * Build APK release Android (Somafrik Mobile).
 * Lit EXPO_PUBLIC_API_URL depuis .env.local ou la variable d'environnement.
 */
const { spawnSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const mobileRoot = path.join(__dirname, "..");
const androidDir = path.join(mobileRoot, "android");
const envLocalPath = path.join(mobileRoot, ".env.local");

function loadEnvLocal() {
  if (!fs.existsSync(envLocalPath)) return;
  for (const line of fs.readFileSync(envLocalPath, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim();
    if (!process.env[key]) process.env[key] = value;
  }
}

loadEnvLocal();

const apiUrl = process.env.EXPO_PUBLIC_API_URL;
if (!apiUrl || /localhost|127\.0\.0\.1/i.test(apiUrl)) {
  console.error(
    "EXPO_PUBLIC_API_URL doit pointer vers l'IP LAN du backend (ex. http://10.x.x.x:5000).",
  );
  console.error("Définissez-la dans Mobile/.env.local ou en variable d'environnement.");
  process.exit(1);
}

console.log(`Build APK avec API: ${apiUrl}`);

const gradlew = process.platform === "win32" ? "gradlew.bat" : "./gradlew";
const result = spawnSync(gradlew, ["assembleRelease"], {
  cwd: androidDir,
  stdio: "inherit",
  env: {
    ...process.env,
    EXPO_PUBLIC_API_URL: apiUrl,
    EXPO_PUBLIC_DEMO_MODE: process.env.EXPO_PUBLIC_DEMO_MODE ?? "false",
  },
});

if (result.status !== 0) {
  process.exit(result.status ?? 1);
}

const apkPath = path.join(androidDir, "app", "build", "outputs", "apk", "release", "app-release.apk");
const distDir = path.join(mobileRoot, "dist");
fs.mkdirSync(distDir, { recursive: true });
const stamped = `somafrik-${new Date().toISOString().slice(0, 10)}.apk`;
const distApk = path.join(distDir, stamped);
fs.copyFileSync(apkPath, distApk);

console.log("");
console.log("APK release genere:");
console.log(`  ${apkPath}`);
console.log(`  ${distApk}`);
