// mobile-app/src/theme/colors.ts

export const Colors = {
  primary: "#1FC600",
  secondary: "#0EFF00",

  background: "#F9FAFB",
  surface: "#FFFFFF",

  text: {
    primary: "#111827",
    secondary: "#6B7280",
    disabled: "#9CA3AF",
    inverse: "#FFFFFF",
  },

  border: {
    light: "#E5E7EB",
    medium: "#D1D5DB",
  },

  status: {
    success: "#22C55E",
    warning: "#F59E0B",
    error: "#EF4444",
    info: "#3B82F6",
  },

  ride: {
    highDemand: "#F97316",
    surge: "#DC2626",
  },

  button: {
    primary: "#1FC600",
    primaryPressed: "#18A800",

    secondary: "#0EFF00",
    secondaryPressed: "#09D600",

    disabled: "#D1D5DB",
  },

  overlay: "rgba(0,0,0,0.45)",

  transparent: "transparent",
} as const;

export type AppColors = typeof Colors;