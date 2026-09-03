import { View } from "react-native";
import { radius, space, useColors } from "../../theme/tokens";
import { Text } from "./Text";

type Tone = "neutral" | "accent" | "danger";

export function Pill({ label, tone = "neutral" }: { label: string; tone?: Tone }) {
  const c = useColors();
  const bg = tone === "accent" ? c.accentWash : tone === "danger" ? c.dangerWash : c.surface2;
  const textTone = tone === "accent" ? "accent" : tone === "danger" ? "danger" : "soft";
  return (
    <View style={{ backgroundColor: bg, borderRadius: radius.pill, paddingVertical: 3, paddingHorizontal: space.sm, alignSelf: "flex-start" }}>
      <Text variant="label" tone={textTone as "accent" | "danger" | "soft"}>{label}</Text>
    </View>
  );
}
