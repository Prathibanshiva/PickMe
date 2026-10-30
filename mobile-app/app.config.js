// mobile-app/app.config.js
// Dynamic Expo config — injects Google Maps API keys from environment variables.
// For local development, set GOOGLE_MAPS_ANDROID_API_KEY and GOOGLE_MAPS_IOS_API_KEY
// in mobile-app/.env (Expo picks up .env automatically with SDK 49+).
// For EAS builds, define them as EAS Secrets.

module.exports = ({ config }) => {
  const androidApiKey = (process.env.GOOGLE_MAPS_ANDROID_API_KEY || "").trim();
  const iosApiKey = (process.env.GOOGLE_MAPS_IOS_API_KEY || "").trim();

  if (!androidApiKey) {
    console.warn(
      "[PickMe Expo Config] Warning: GOOGLE_MAPS_ANDROID_API_KEY is not configured in environment."
    );
  }
  if (!iosApiKey) {
    console.warn(
      "[PickMe Expo Config] Warning: GOOGLE_MAPS_IOS_API_KEY is not configured in environment."
    );
  }

  // IMPORTANT: react-native-maps config plugin reads `androidGoogleMapsApiKey`
  // and `iosGoogleMapsApiKey` — NOT `googleMapsApiKey`. Using the wrong option
  // name causes the plugin to silently skip meta-data injection.
  const plugins = (config.plugins || []).map((plugin) => {
    if (Array.isArray(plugin) && plugin[0] === "react-native-maps") {
      return [
        "react-native-maps",
        {
          ...plugin[1],
          androidGoogleMapsApiKey: androidApiKey,
          iosGoogleMapsApiKey: iosApiKey,
        },
      ];
    }
    if (plugin === "react-native-maps") {
      return [
        "react-native-maps",
        {
          androidGoogleMapsApiKey: androidApiKey,
          iosGoogleMapsApiKey: iosApiKey,
        },
      ];
    }
    return plugin;
  });

  return {
    ...config,
    plugins,
    android: {
      ...config.android,
      permissions: [
        ...(config.android?.permissions || []),
        "ACCESS_COARSE_LOCATION",
        "ACCESS_FINE_LOCATION",
      ],
      config: {
        ...config.android?.config,
        googleMaps: {
          apiKey: androidApiKey,
        },
      },
    },
    ios: {
      ...config.ios,
      config: {
        ...config.ios?.config,
        googleMapsApiKey: iosApiKey,
      },
    },
  };
};
