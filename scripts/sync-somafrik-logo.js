/**
 * Copie Logo Somafrik.png vers tous les emplacements de marque du monorepo.
 * Usage : node scripts/sync-somafrik-logo.js
 */
const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const root = path.join(__dirname, "..");
const source = path.join(root, "Logo Somafrik.png");

if (!fs.existsSync(source)) {
  console.error(`Fichier source introuvable : ${source}`);
  process.exit(1);
}

const pngTargets = [
  path.join(root, "Mobile", "assets", "somafrik-logo.png"),
  path.join(root, "Mobile", "assets", "schoollink-logo.png"),
  path.join(root, "BackOffice", "assets", "somafrik-logo.png"),
  path.join(root, "BackOffice", "assets", "schoollink-logo.png"),
  path.join(root, "backend", "assets", "somafrik-logo.png"),
  path.join(root, "backend", "assets", "schoollink-logo.png"),
  path.join(root, "web", "public", "somafrik-logo.png"),
  path.join(root, "Mobile", "android", "app", "src", "main", "res", "drawable", "splashscreen_logo.png"),
  path.join(root, "Mobile", "android", "app", "src", "main", "res", "drawable-mdpi", "splashscreen_logo.png"),
  path.join(root, "Mobile", "android", "app", "src", "main", "res", "drawable-hdpi", "splashscreen_logo.png"),
  path.join(root, "Mobile", "android", "app", "src", "main", "res", "drawable-xhdpi", "splashscreen_logo.png"),
  path.join(root, "Mobile", "android", "app", "src", "main", "res", "drawable-xxhdpi", "splashscreen_logo.png"),
  path.join(root, "Mobile", "android", "app", "src", "main", "res", "drawable-xxxhdpi", "splashscreen_logo.png"),
];

for (const target of pngTargets) {
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.copyFileSync(source, target);
  console.log(`OK ${path.relative(root, target)}`);
}

if (process.platform === "win32") {
  const ps = `
Add-Type -AssemblyName System.Drawing
$src = '${source.replace(/'/g, "''")}'
$jpg = '${path.join(root, "backend", "assets", "somafrik-logo.jpg").replace(/'/g, "''")}'
$img = [System.Drawing.Image]::FromFile($src)
$img.Save($jpg, [System.Drawing.Imaging.ImageFormat]::Jpeg)
$img.Dispose()
`;
  const result = spawnSync("powershell", ["-NoProfile", "-Command", ps], { stdio: "inherit" });
  if (result.status === 0) {
    console.log("OK backend/assets/somafrik-logo.jpg");
  }
}

console.log("\nLogo Somafrik synchronisé.");
