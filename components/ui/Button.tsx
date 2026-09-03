import { ActivityIndicator, Pressable, type PressableProps } from "react-native";
import { radius, space, useColors } from "../../theme/tokens";
import { Text } from "./Text";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "md" | "lg";

interface ButtonProps extends Omit<PressableProps, "children"> {
  title: string;
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  full?: boolean;
}

export function Button({ title, variant = "primary", size = "md", loading, full, disabled, style, ...rest }: ButtonProps) {
  const c = useColors();
  const height = size === "lg" ? 52 : 44;
  const isPrimary = variant === "primary";
  const isDanger = variant === "danger";

  const bg =
    isPrimary ? c.accent
    : isDanger ? c.dangerWash
    : variant === "secondary" ? c.surface
    : "transparent";
  const borderColor = variant === "ghost" ? "transparent" : isPrimary ? c.accent : isDanger ? c.danger : c.line;
  const textTone = isPrimary ? "onAccent" : isDanger ? "danger" : variant === "ghost" ? "accent" : "default";

  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled || loading}
      style={({ pressed }) => [
        {
          height,
          minWidth: full ? "100%" : undefined,
          alignSelf: full ? "stretch" : "flex-start",
          paddingHorizontal: space.xl,
          borderRadius: radius.md,
          borderWidth: 1,
          borderColor,
          backgroundColor: bg,
          alignItems: "center",
          justifyContent: "center",
          opacity: disabled ? 0.5 : pressed ? 0.85 : 1,
        },
        style as object,
      ]}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator color={isPrimary ? c.accentText : c.accent} />
      ) : (
        <Text variant="body" bold tone={textTone as "onAccent" | "danger" | "accent" | "default"}>
          {title}
        </Text>
      )}
    </Pressable>
  );
}
