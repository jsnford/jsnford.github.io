import { ScrollView } from "react-native";
import { type GwTeamView, type PoolPlayer } from "../lib/data";
import { space } from "../theme/tokens";
import { Pitch } from "./Pitch";
import { HStack, Pill, Text, VStack } from "./ui";

// Read-only pitch view of a submitted team, with each player's gameweek points
// shown under their kit (bench included, below the line). Used for previous-
// gameweek review and for peeking at a rival's team from the Standings page.
export function TeamPitchView({ data }: { data: GwTeamView }) {
  const starters: (PoolPlayer | null)[] = data.starters.map((s) => s.player);
  while (starters.length < 5) starters.push(null);
  const captainId = data.starters.find((s) => s.isCaptain)?.player.id ?? null;
  const points: Record<string, number> = {};
  for (const s of data.starters) points[s.player.id] = s.points;
  if (data.sub) points[data.sub.player.id] = data.sub.points;

  return (
    <ScrollView contentContainerStyle={{ paddingHorizontal: space.lg, paddingBottom: space.xl, gap: space.lg }}>
      <HStack justify="space-between" align="center">
        <Text variant="label" tone="faint">Gameweek {data.gwNumber}</Text>
        <Pill label={`${Math.round(data.total)} pts`} tone="accent" />
      </HStack>

      <Pitch
        starters={starters}
        captainId={captainId}
        points={points}
        sub={data.sub ? data.sub.player : null}
        subActivated={data.subActivated}
      />

      <Text variant="small" tone="faint">Points under each player are their score for this gameweek. The captain (C) counts double, and the substitute (below the line) only comes on if a starter plays zero minutes.</Text>
    </ScrollView>
  );
}
