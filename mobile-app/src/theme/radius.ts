// mobile-app/src/theme/radius.ts

export const Radius = {
  none: 0,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  pill: 9999,
  round: 9999,
} as const;

export type AppRadius = typeof Radius;