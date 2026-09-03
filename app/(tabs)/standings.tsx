import { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { TeamPitchView } from "../../components/TeamPitchView";
import { Card, HStack, ListRow, Pill, Screen, Sheet, Text, VStack } from "../../components/ui";
import { useAuth } from "../../lib/auth";
import { getGlobalStandings, getUserLatestTeamView, type GwTeamView, type StandingRow } from "../../lib/data";
import { useColors } from "../../theme/tokens";

export default function Standings() {
  const { profile } = useAuth();
  const c = useColors();
  const [rows, setRows] = useState<StandingRow[] | null>(null);
  const me = profile?.username;

  // Selected rival to peek at: null = sheet closed.
  const [selected, setSelected] = useState<StandingRow | null>(null);
  const [team, setTeam] = useState<GwTeamView | null>(null);
  const [teamLoading, setTeamLoading] = useState(false);

  useEffect(() => { getGlobalStandings().then(setRows).catch(() => setRows([])); }, []);

  useEffect(() => {
    if (!selected) return;
    setTeam(null);
    setTeamLoading(true);
    getUserLatestTeamView(selected.userId)
      .then(setTeam)
      .catch(() => setTeam(null))
      .finally(() => setTeamLoading(false));
  }, [selected]);

  return (
    <Screen>
      <VStack gap={4}>
        <Text variant="label" tone="faint">Global · everyone</Text>
        <HStack justify="space-between" align="flex-end">
          <Text variant="h1">Standings</Text>
          <Pill label="Season total" />
        </HStack>
      </VStack>

      {rows === null ? (
        <VStack style={{ paddingTop: 40 }} align="center"><ActivityIndicator color={c.accent} /></VStack>
      ) : rows.length === 0 ? (
        <Card>
          <Text variant="h3">No standings yet</Text>
          <Text variant="body" tone="soft">Once the first gameweek is scored, everyone who's played shows up here, ranked by season total.</Text>
        </Card>
      ) : (
        <VStack gap={8}>
          {rows.map((r) => {
            const isMe = !!me && r.handle === me;
            return (
              <ListRow
                key={`${r.rank}-${r.handle}`}
                lead={`${r.rank}`}
                title={r.name}
                subtitle={r.name !== r.handle ? `@${r.handle}${isMe ? " · you" : ""}` : (isMe ? "you" : undefined)}
                right={`${r.total}`}
                rightSub="pts"
                onPress={() => setSelected(r)}
              />
            );
          })}
        </VStack>
      )}

      <Text variant="small" tone="faint">Everyone who signs up joins the Global league automatically. Tap anyone to see their team.</Text>

      <Sheet visible={!!selected} onClose={() => setSelected(null)} title={selected?.name}>
        {teamLoading ? (
          <VStack style={{ paddingTop: 40 }} align="center"><ActivityIndicator color={c.accent} /></VStack>
        ) : team ? (
          <TeamPitchView data={team} />
        ) : (
          <View style={{ padding: 20 }}>
            <Text variant="body" tone="soft">{selected?.name} hasn't submitted a team yet.</Text>
          </View>
        )}
      </Sheet>
    </Screen>
  );
}
