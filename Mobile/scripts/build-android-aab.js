/**
 * Build AAB release Android (Somafrik Mobile) pour Google Play Console.
 * Lit EXPO_PUBLIC_API_URL depuis .env.local, .env (racine) ou la variable d'environnement.
 */
const { spawnSync } = require("child_process");
const fs = require("fs");
const path = require("path");
const os = require("os");

const mobileRoot = path.join(__dirname, "..");
const workspaceRoot = path.join(mobileRoot, "..");
const androidDir = path.join(mobileRoot, "android");
const localPropertiesPath = path.join(androidDir, "local.properties");

const DEFAULT_JAVA_HOME =
  process.platform === "win32"
    ? path.join(
        os.homedir(),
        "AppData",
        "Local",
        "Programs",
        "Eclipse Adoptium",
        "jdk-17.0.19.10-hotspot",
      )
    : null;

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  for (const line of fs.readFileSync(filePath, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim();
    if (!process.env[key]) process.env[key] = value;
  }
}

function resolveJavaHome() {
  if (process.env.JAVA_HOME && fs.existsSync(process.env.JAVA_HOME)) {
    return process.env.JAVA_HOME;
  }
  if (DEFAULT_JAVA_HOME && fs.existsSync(DEFAULT_JAVA_HOME)) {
    return DEFAULT_JAVA_HOME;
  }
  return null;
}

function resolveAndroidSdk() {
  const candidates = [
    process.env.ANDROID_HOME,
    process.env.ANDROID_SDK_ROOT,
    process.platform === "win32"
      ? path.join(os.homedir(), "AppData", "Local", "Android", "Sdk")
      : path.join(os.homedir(), "Android", "Sdk"),
  ].filter(Boolean);

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) return candidate;
  }
  return null;
}

function ensureLocalProperties(sdkDir) {
  const sdkPath = sdkDir.replace(/\\/g, "/");
  const content = `sdk.dir=${sdkPath}\n`;
  if (fs.existsSync(localPropertiesPath)) {
    const current = fs.readFileSync(localPropertiesPath, "utf8");
    if (current.includes("sdk.dir=")) return;
  }
  fs.writeFileSync(localPropertiesPath, content, "utf8");
  console.log(`Android SDK enregistre dans ${localPropertiesPath}`);
}

function ensurePrerequisites() {
  const javaHome = resolveJavaHome();
  if (!javaHome) {
    console.error("JAVA_HOME introuvable. Installez le JDK 17 (Temurin).");
    process.exit(1);
  }

  process.env.JAVA_HOME = javaHome;
  const javaBin = path.join(javaHome, "bin");
  const pathKey = process.platform === "win32" ? "Path" : "PATH";
  const currentPath = process.env[pathKey] ?? "";
  if (!currentPath.toLowerCase().includes(javaBin.toLowerCase())) {
    process.env[pathKey] = `${javaBin}${path.delimiter}${currentPath}`;
  }

  const sdkDir = resolveAndroidSdk();
  if (!sdkDir) {
    console.error("Android SDK introuvable. Installez Android Studio (SDK Manager).");
    process.exit(1);
  }

  process.env.ANDROID_HOME = sdkDir;
  process.env.ANDROID_SDK_ROOT = sdkDir;
  ensureLocalProperties(sdkDir);
}

loadEnvFile(path.join(workspaceRoot, ".env"));
loadEnvFile(path.join(mobileRoot, ".env.local"));
ensurePrerequisites();

const apiUrl = process.env.EXPO_PUBLIC_API_URL;
if (!apiUrl || /localhost|127\.0\.0\.1/i.test(apiUrl)) {
  console.error(
    "EXPO_PUBLIC_API_URL doit pointer vers l'IP LAN du backend (ex. http://192.168.1.35:5000).",
  );
  console.error("Definissez-la dans Mobile/.env.local ou en variable d'environnement.");
  process.exit(1);
}

console.log(`Build AAB avec API: ${apiUrl}`);
console.log(`JAVA_HOME: ${process.env.JAVA_HOME}`);
console.log(`ANDROID_HOME: ${process.env.ANDROID_HOME}`);
console.log("Gradle bundleRelease en cours (premier build : 5 a 15 min)...");
console.log("");

const gradlew = path.join(androidDir, process.platform === "win32" ? "gradlew.bat" : "gradlew");
const result = spawnSync(gradlew, ["bundleRelease"], {
  cwd: androidDir,
  stdio: "inherit",
  shell: process.platform === "win32",
  env: {
    ...process.env,
    EXPO_PUBLIC_API_URL: apiUrl,
    EXPO_PUBLIC_DEMO_MODE: process.env.EXPO_PUBLIC_DEMO_MODE ?? "false",
  },
});

if (result.error) {
  console.error("Echec lancement Gradle:", result.error.message);
  process.exit(1);
}

if (result.status !== 0) {
  console.error(`Build Gradle echoue (code ${result.status ?? 1}).`);
  process.exit(result.status ?? 1);
}

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
