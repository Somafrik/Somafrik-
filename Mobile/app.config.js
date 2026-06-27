/** @type {import("@expo/config").ExpoConfig} */
module.exports = ({ config }) => {
  const apiUrl = String(process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:5000").replace(/\/$/, "");
  const packagerHost = String(process.env.REACT_NATIVE_PACKAGER_HOSTNAME ?? "").trim();

  return {
    ...config,
    name: "Somafrik",
    slug: "somafrik",
    scheme: "somafrik",
    userInterfaceStyle: "light",
    extra: {
      ...config.extra,
      apiUrl,
      packagerHost: packagerHost || undefined,
      demoMode: process.env.EXPO_PUBLIC_DEMO_MODE === "true",
    },
    ios: {
      ...config.ios,
      bundleIdentifier: "com.somafrik.app",
      supportsTablet: true,
    },
    android: {
      ...config.android,
      package: "com.somafrik.app",
    },
  };
};
