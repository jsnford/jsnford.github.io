import { Text as RNText, type TextProps as RNTextProps } from "react-native";
import { font, useColors, weight } from "../../theme/tokens";

type Variant = "display" | "h1" | "h2" | "h3" | "body" | "small" | "label";
type Tone = "default" | "soft" | "faint" | "accent" | "danger" | "onAccent";

export interface TextProps extends RNTextProps {
  variant?: Variant;
  tone?: Tone;
  bold?: boolean;
  center?: boolean;
}

const sizes: Record<Variant, number> = {
  display: font.display,
  h1: font.h1,
  h2: font.h2,
  h3: font.h3,
  body: font.body,
  small: font.small,
  label: font.label,
};

export function Text({ variant = "body", tone = "default", bold, center, style, ...rest }: TextProps) {
  const c = useColors();
  const color =
    tone === "soft" ? c.textSoft
    : tone === "faint" ? c.textFaint
    : tone === "accent" ? c.accent
    : tone === "danger" ? c.danger
    : tone === "onAccent" ? c.accentText
    : c.text;
  const isHeading = variant === "display" || variant === "h1" || variant === "h2" || variant === "h3";
  return (
    <RNText
      style={[
        {
          fontSize: sizes[variant],
          color,
          fontWeight: (bold || isHeading ? weight.bold : weight.regular) as "400" | "500" | "600",
          letterSpacing: variant === "label" ? 0.6 : 0,
          textTransform: variant === "label" ? "uppercase" : "none",
          lineHeight: isHeading ? sizes[variant] * 1.2 : sizes[variant] * 1.45,
          textAlign: center ? "center" : "left",
        },
        style,
      ]}
      {...rest}
    />
  );
}
