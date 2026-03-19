export const COLORS = {
  background: "#0A0A0F",
  backgroundSecondary: "#12121A",
  backgroundCard: "#1A1A26",
  backgroundElevated: "#1E1E2E",
  surface: "#252535",

  primary: "#E50914",
  primaryDark: "#B20710",
  primaryLight: "#FF2A35",
  primaryGlow: "rgba(229, 9, 20, 0.3)",

  accent: "#FF6B35",
  accentGold: "#F5A623",
  gold: "#F5A623",

  text: "#FFFFFF",
  textSecondary: "rgba(255, 255, 255, 0.65)",
  textMuted: "rgba(255, 255, 255, 0.35)",
  textDisabled: "rgba(255, 255, 255, 0.2)",

  border: "rgba(255, 255, 255, 0.08)",
  borderLight: "rgba(255, 255, 255, 0.15)",

  overlay: "rgba(0, 0, 0, 0.7)",
  overlayLight: "rgba(0, 0, 0, 0.4)",

  success: "#22C55E",
  warning: "#F59E0B",
  error: "#EF4444",

  tabBarBg: "rgba(10, 10, 15, 0.95)",
  tabIconDefault: "rgba(255, 255, 255, 0.4)",
  tabIconSelected: "#E50914",

  gradientHero: ["transparent", "rgba(10, 10, 15, 0.8)", "#0A0A0F"] as const,
  gradientCard: ["transparent", "rgba(10, 10, 15, 0.95)"] as const,
};

export default {
  light: {
    text: COLORS.text,
    background: COLORS.background,
    tint: COLORS.primary,
    tabIconDefault: COLORS.tabIconDefault,
    tabIconSelected: COLORS.primary,
  },
};
