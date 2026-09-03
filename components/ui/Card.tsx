import { View, type ViewProps } from "react-native";
import { radius, space, useColors } from "../../theme/tokens";
import { Text } from "./Text";

interface CardProps extends ViewProps {
  title?: string;
  padded?: boolean;
}

export function Card({ title, padded = true, children, style, ...rest }: CardProps) {
  const c = useColors();
  return (
    <View
      style={[
        {
          backgroundColor: c.surface,
          borderWidth: 1,
          borderColor: c.line,
          borderRadius: radius.lg,
          padding: padded ? space.lg : 0,
          gap: space.md,
        },
        style,
      ]}
      {...rest}
    >
      {title ? <Text variant="label" tone="faint">{title}</Text> : null}
      {children}
    </View>
  );
}
