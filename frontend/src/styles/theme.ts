// Green Theme Color Palette for UVION
export const theme = {
  primary: "#10b981", // Emerald Green
  primaryDark: "#059669", // Dark Emerald
  primaryLight: "#d1fae5", // Very Light Green
  secondary: "#34d399", // Bright Green
  accent: "#6ee7b7", // Light Green

  // Neutrals
  background: "#f9fafb", // Off White
  surface: "#ffffff", // White
  border: "#e5e7eb", // Light Gray
  text: "#1f2937", // Dark Gray
  textSecondary: "#6b7280", // Medium Gray
  textLight: "#9ca3af", // Light Gray

  // Status Colors
  success: "#10b981",
  warning: "#f59e0b",
  error: "#ef4444",
  info: "#3b82f6",

  // Shadows
  shadowSm: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
  shadowMd: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
  shadowLg: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
  shadowXl: "0 20px 25px -5px rgba(0, 0, 0, 0.1)",

  // Border Radius
  radiusSm: "0.375rem",
  radiusMd: "0.5rem",
  radiusLg: "0.75rem",
  radiusXl: "1rem",
  radiusFull: "9999px",

  // Transitions
  transition: "all 0.3s ease",
};

export type Theme = typeof theme;
