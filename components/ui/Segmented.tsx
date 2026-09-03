import { Pressable, View } from "react-native";
import { radius, space, useColors } from "../../theme/tokens";
import { Text } from "./Text";

interface SegmentedProps<T extends string> {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}

// Segmented control — used to tab between Leagues and Players inside Standings.
export function Segmented<T extends string>({ options, value, onChange }: SegmentedProps<T>) {
  const c = useColors();
  return (
    <View
      style={{
        flexDirection: "row",
        backgroundColor: c.surface2,
        borderRadius: radius.md,
        padding: 3,
        gap: 3,
      }}
    >
      {options.map((o) => {
        const active = o.value === value;
        return (
          <Pressable
            key={o.value}
            onPress={() => onChange(o.value)}
            style={{
              flex: 1,
              paddingVertical: space.sm,
              borderRadius: radius.sm,
              backgroundColor: active ? c.surface : "transparent",
              alignItems: "center",
            }}
          >
            <Text variant="small" bold tone={active ? "default" : "faint"}>{o.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}
