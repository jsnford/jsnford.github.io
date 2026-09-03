// DONKEY brand — deliberately distinct from Fives: cream ground, black serif
// wordmark, green/red donkey scores. (Serif is Georgia for now — a web-safe
// editorial stand-in; swap for the licensed face later.)
export const D = {
  bg: "#EBE2DA",
  ink: "#1A1A1A",
  soft: "#6E6559",
  faint: "#A79E90",
  line: "#D8CDBF",
  green: "#2E9E4A",
  red: "#E21F2F",
  black: "#000000",
  white: "#FFFFFF",
};
export const SERIF = "Georgia";
export const MAXW = 440;

// green when under-performance is negative (good), red when positive (donkey).
export const donkeyColor = (v: number | null) => (v == null ? D.soft : v < 0 ? D.green : v > 0 ? D.red : D.ink);
export const fmtDonkey = (v: number | null) => (v == null ? "—" : (v > 0 ? "+" : "") + (Math.round(v * 100) / 100).toString());
