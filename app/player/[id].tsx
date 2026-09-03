import { useLocalSearchParams } from "expo-router";
import { Card, Divider, HStack, Screen, Text, VStack } from "../../components/ui";

// Player detail placeholder — loads the player + season stats by id later.
const STATS: [string, string][] = [
  ["Minutes", "82"],
  ["Goals", "1"],
  ["Assists", "1"],
  ["xG", "0.27"],
  ["Clean sheets", "0"],
  ["Def. contribution", "9"],
  ["Points (GW1)", "10"],
];

export default function Player() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return (
    <Screen>
      <VStack gap={4}>
        <Text variant="label" tone="faint">MID · Chelsea</Text>
        <Text variant="h1">Cole Palmer</Text>
        <Text variant="small" tone="faint">Player #{id} · 2 of 3 season uses left</Text>
      </VStack>

      <Card title="Gameweek 1">
        <VStack>
          {STATS.map(([k, v], i) => (
            <VStack key={k}>
              <HStack justify="space-between" style={{ paddingVertical: 10 }}>
                <Text variant="body" tone="soft">{k}</Text>
                <Text variant="body" bold>{v}</Text>
              </HStack>
              {i < STATS.length - 1 ? <Divider /> : null}
            </VStack>
          ))}
        </VStack>
      </Card>

      <Text variant="small" tone="faint">Upcoming fixtures and season history connect here next.</Text>
    </Screen>
  );
}
