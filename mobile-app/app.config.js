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
    },
  };
};
