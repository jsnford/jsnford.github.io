import { useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator } from "react-native";
import { Pitch } from "../../components/Pitch";
import { HStack, Pill, Screen, Text, VStack } from "../../components/ui";
import { useAuth } from "../../lib/auth";
import { getMyTeamForGameweek, type GwTeamView, type PoolPlayer } from "../../lib/data";
import { useColors } from "../../theme/tokens";

const fmtPts = (n: number) => String(+n.toFixed(2));

export default function GwView() {
  const { gw } = useLocalSearchParams<{ gw: string }>();
  const { session } = useAuth();
  const c = useColors();
  const [data, setData] = useState<GwTeamView | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const uid = session?.user.id;
      if (uid && gw) setData(await getMyTeamForGameweek(Number(gw), uid).catch(() => null));
      setLoading(false);
    })();
  }, [gw, session?.user.id]);

  if (loading) {
    return <Screen><VStack style={{ paddingTop: 100 }} align="center"><ActivityIndicator color={c.accent} /></VStack></Screen>;
  }
  if (!data) {
    return <Screen><Text variant="h3">No team for gameweek {gw}</Text></Screen>;
  }

  const starters: (PoolPlayer | null)[] = data.starters.map((s) => s.player);
  while (starters.length < 5) starters.push(null);
  const captainId = data.starters.find((s) => s.isCaptain)?.player.id ?? null;
  const points: Record<string, number> = {};
  for (const s of data.starters) points[s.player.id] = s.points;
  if (data.sub) points[data.sub.player.id] = data.sub.points;

  return (
    <Screen>
      <VStack gap={4}>
        <Text variant="label" tone="faint">Gameweek {data.gwNumber} · final</Text>
        <HStack justify="space-between" align="flex-end">
          <Text variant="h1">Your team</Text>
          <Pill label={`${fmtPts(data.total)} pts`} tone="accent" />
        </HStack>
      </VStack>

      <Pitch
        starters={starters}
        captainId={captainId}
        points={points}
        sub={data.sub ? data.sub.player : null}
        subActivated={data.subActivated}
      />

      <Text variant="small" tone="faint">Points under each player are their score for this gameweek. Your captain (C) counts double, and the substitute (below the line) only comes on if a starter plays zero minutes.</Text>
    </Screen>
  );
}
