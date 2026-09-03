import { Pressable, View } from "react-native";
import { radius, space, useColors } from "../../theme/tokens";
import { HStack, VStack } from "./Stack";
import { Text } from "./Text";

interface ListRowProps {
  title: string;
  subtitle?: string;
  right?: string;
  rightSub?: string;
  lead?: string; // short badge/initials on the left
  onPress?: () => void;
}

// The workhorse list item — a title/subtitle with an optional leading badge and
// a right-aligned value. Used for players, leagues, standings, settings.
export function ListRow({ title, subtitle, right, rightSub, lead, onPress }: ListRowProps) {
  const c = useColors();
  const body = (
    <HStack
      gap={space.md}
      style={{
        backgroundColor: c.surface,
        borderWidth: 1,
        borderColor: c.line,
        borderRadius: radius.md,
        paddingVertical: space.md,
        paddingHorizontal: space.md,
      }}
    >
      {lead ? (
        <View
          style={{
            width: 36, height: 36, borderRadius: radius.sm,
            backgroundColor: c.surface2, alignItems: "center", justifyContent: "center",
          }}
        >
          <Text variant="small" bold tone="soft">{lead}</Text>
        </View>
      ) : null}
      <VStack flex={1} gap={2}>
        <Text variant="body" bold numberOfLines={1}>{title}</Text>
        {subtitle ? <Text variant="small" tone="faint" numberOfLines={1}>{subtitle}</Text> : null}
      </VStack>
      {right ? (
        <VStack align="flex-end" gap={2}>
          <Text variant="body" bold>{right}</Text>
          {rightSub ? <Text variant="small" tone="faint">{rightSub}</Text> : null}
        </VStack>
      ) : null}
    </HStack>
  );
  if (!onPress) return body;
  return (
    <Pressable onPress={onPress} style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}>
      {body}
    </Pressable>
  );
}
