/** @type {import("@expo/config").ExpoConfig} */
const fs = require("fs");
const path = require("path");

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

const mobileRoot = __dirname;
const workspaceRoot = path.join(mobileRoot, "..");
loadEnvFile(path.join(workspaceRoot, ".env"));
loadEnvFile(path.join(mobileRoot, ".env.local"));

module.exports = ({ config }) => {
  const apiUrl = String(process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:5000").replace(/\/$/, "");
  const demoMode = process.env.EXPO_PUBLIC_DEMO_MODE === "true";

  return {
    ...config,
    name: "Somafrik",
    slug: "somafrik",
    scheme: "somafrik",
    userInterfaceStyle: "light",
    extra: {
      ...config.extra,
      apiUrl,
      demoMode,
    },
    ios: {
      ...config.ios,
      bundleIdentifier: "com.somafrik.app",
      supportsTablet: true,
    },
    android: {
      ...config.android,
      package: "com.somafrik.app",
      // Obligatoire pour http://192.168.x.x:5000 en build release (AAB/APK Play Store).
      usesCleartextTraffic: true,
    },
  };
};
