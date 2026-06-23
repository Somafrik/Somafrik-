import Constants from "expo-constants";
import { Platform } from "react-native";

function normalizeBaseUrl(value?: string) {
  return String(value ?? "").trim().replace(/\/$/, "");
}

function isLocalhostUrl(url: string) {
  return /:\/\/(localhost|127\.0\.0\.1)(:|\/|$)/i.test(url);
}

/** IP de la machine de dev (PC) telle qu'Expo Go la voit via Metro. */
function getDevMachineHost(): string | null {
  const candidates = [
    Constants.expoGoConfig?.debuggerHost,
    (Constants.expoConfig as { hostUri?: string } | null)?.hostUri,
    (Constants.manifest2 as { extra?: { expoClient?: { hostUri?: string } } } | null)?.extra?.expoClient
      ?.hostUri,
    (Constants as { manifest?: { debuggerHost?: string } }).manifest?.debuggerHost,
  ];

  for (const value of candidates) {
    if (!value) continue;
    const raw = String(value).replace(/^exp:\/\//, "").replace(/^https?:\/\//, "");
    const host = raw.split(":")[0]?.trim();
    if (host && !isLocalhostUrl(`http://${host}`)) {
      return host;
    }
  }

  return null;
}

function rewriteLocalhostForDevice(url: string): string {
  if (!Constants.isDevice || !isLocalhostUrl(url)) {
    return url;
  }

  const devHost = getDevMachineHost();
  if (!devHost) {
    return url;
  }

  const portMatch = url.match(/:(\d+)/);
  const port = portMatch?.[1] ?? "5000";
  return `http://${devHost}:${port}`;
}

/** URL racine du backend (sans /api). */
export function resolveApiRootUrl(): string {
  const fromExtra = normalizeBaseUrl(Constants.expoConfig?.extra?.apiUrl as string | undefined);
  const fromEnv = normalizeBaseUrl(process.env.EXPO_PUBLIC_API_URL);
  let configured = fromExtra || fromEnv;

  if (configured) {
    // APK release : pas de Metro → conserver l'URL injectée au build (ex. IP LAN).
    if (!Constants.expoGoConfig && !isLocalhostUrl(configured)) {
      return configured;
    }
    return rewriteLocalhostForDevice(configured);
  }

  // Émulateur Android : localhost de la machine hôte
  if (Platform.OS === "android" && !Constants.isDevice) {
    return "http://10.0.2.2:5000";
  }

  // Téléphone physique : déduire l'IP PC depuis la connexion Expo Metro
  const devHost = getDevMachineHost();
  if (devHost) {
    return `http://${devHost}:5000`;
  }

  return "http://localhost:5000";
}

export function resolveApiBaseUrl(): string {
  return `${resolveApiRootUrl()}/api`;
}

export function isDemoMode(): boolean {
  if (Constants.expoConfig?.extra?.demoMode === true) {
    return true;
  }
  return process.env.EXPO_PUBLIC_DEMO_MODE === "true";
}

export function isUsingLocalhostOnDevice(): boolean {
  const root = normalizeBaseUrl(Constants.expoConfig?.extra?.apiUrl as string | undefined)
    || normalizeBaseUrl(process.env.EXPO_PUBLIC_API_URL);
  return Boolean(Constants.isDevice && root && isLocalhostUrl(root) && !getDevMachineHost());
}

/** Intervalle de synchronisation automatique avec le backend (5 minutes). */
export const SYNC_INTERVAL_MS = 5 * 60 * 1000;
