import type { ExpoConfig } from "expo/config";

const apiUrl =
  process.env.EXPO_PUBLIC_API_URL ?? "https://nobetci-backend.onrender.com";

const config: ExpoConfig = {
  name: "Nobetci",
  slug: "nobetci",
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/icon.png",
  userInterfaceStyle: "light",
  extra: {
    apiUrl,
  },
  ios: {
    supportsTablet: true,
    infoPlist: {
      NSCameraUsageDescription: "İhlal fotoğrafı çekmek için kamera gerekir.",
      NSLocationWhenInUseUsageDescription:
        "İhbar konumunu belirlemek için konum gerekir.",
    },
  },
  android: {
    permissions: ["CAMERA", "ACCESS_FINE_LOCATION"],
    adaptiveIcon: {
      backgroundColor: "#E6F4FE",
      foregroundImage: "./assets/android-icon-foreground.png",
      backgroundImage: "./assets/android-icon-background.png",
      monochromeImage: "./assets/android-icon-monochrome.png",
    },
    predictiveBackGestureEnabled: false,
  },
  web: {
    favicon: "./assets/favicon.png",
  },
};

export default config;
