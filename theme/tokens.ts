import { useColorScheme } from "react-native";

// Design tokens for Fantasy Fives. Deliberately minimal — text, borders and
// spacing only, no imagery — so the whole look can be designed from here later.

export const palettes = {
  light: {
    bg: "#F6F5F0",
    surface: "#FFFFFF",
    surface2: "#EEEDE6",
    text: "#16211B",
    textSoft: "#4A554E",
    textFaint: "#828B83",
    line: "#E2E1D8",
    accent: "#0F7A52",
    accentText: "#FFFFFF",
    accentWash: "#E6F1EA",
    danger: "#B23A2E",
    dangerWash: "#F6E7E4",
  },
  dark: {
    bg: "#0D1310",
    surface: "#151B17",
    surface2: "#1C231D",
    text: "#E9EFE9",
    textSoft: "#A6B1A8",
    textFaint: "#6E7972",
    line: "#28302A",
    accent: "#2FB577",
    accentText: "#08130D",
    accentWash: "#15251C",
    danger: "#E0705F",
    dangerWash: "#2A1613",
  },
};

export type Palette = typeof palettes.light;

// Theme-independent scales.
export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 } as const;
export const radius = { sm: 6, md: 10, lg: 14, pill: 999 } as const;
export const font = {
  display: 30,
  h1: 24,
  h2: 20,
  h3: 17,
  body: 16,
  small: 14,
  label: 12,
} as const;
export const weight = { regular: "400", medium: "500", bold: "600" } as const;

export function useColors(): Palette {
  const scheme = useColorScheme();
  return scheme === "dark" ? palettes.dark : palettes.light;
}
