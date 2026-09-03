import { View, type ViewProps, type ViewStyle } from "react-native";

// Layout primitives — flex rows/columns with a gap. The spacing backbone.

export interface StackProps extends ViewProps {
  gap?: number;
  align?: ViewStyle["alignItems"];
  justify?: ViewStyle["justifyContent"];
  flex?: number;
  wrap?: boolean;
}

export function VStack({ gap = 0, align, justify, flex, wrap, style, ...rest }: StackProps) {
  return (
    <View
      style={[
        { flexDirection: "column", gap, alignItems: align, justifyContent: justify, flex, flexWrap: wrap ? "wrap" : "nowrap" },
        style,
      ]}
      {...rest}
    />
  );
}

export function HStack({ gap = 0, align = "center", justify, flex, wrap, style, ...rest }: StackProps) {
  return (
    <View
      style={[
        { flexDirection: "row", gap, alignItems: align, justifyContent: justify, flex, flexWrap: wrap ? "wrap" : "nowrap" },
        style,
      ]}
      {...rest}
    />
  );
}

export function Spacer() {
  return <View style={{ flex: 1 }} />;
}
