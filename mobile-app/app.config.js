// mobile-app/app.config.js

module.exports = ({ config }) => {
  return {
    ...config,
    android: {
      ...config.android,
      permissions: [
        ...(config.android?.permissions || []),
        "ACCESS_COARSE_LOCATION",
        "ACCESS_FINE_LOCATION",
      ],
      config: {
        ...(config.android?.config || {}),
        googleMaps: {
          apiKey: process.env.GOOGLE_MAPS_ANDROID_API_KEY || "",
        },
      },
    },
    extra: {
      ...(config.extra || {}),
      hasGoogleMapsKey: Boolean(process.env.GOOGLE_MAPS_ANDROID_API_KEY),
    },
  };
};
