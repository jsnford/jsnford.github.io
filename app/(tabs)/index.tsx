import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, View } from "react-native";
import { FixtureStrip } from "../../components/FixtureStrip";
import { Button, Card, HStack, ListRow, Pill, Screen, Text, VStack } from "../../components/ui";
import { identity, useAuth } from "../../lib/auth";
import { getCurrentGameweek, getDonkeyGame, getGameweekFixtures, getMyStanding, getMyTeam, type DonkeyGame, type FixtureLite, type Gameweek, type MyStanding, type MyTeam } from "../../lib/data";
import { radius, space, useColors } from "../../theme/tokens";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
function fmt(iso: string) {
  const d = new Date(iso);
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${DAYS[d.getDay()]} ${d.getDate()} ${MON[d.getMonth()]} · ${hh}:${mm}`;
}

export default function Home() {
  const router = useRouter();
  const { profile, session } = useAuth();
  const [gw, setGw] = useState<Gameweek | null>(null);
  const [team, setTeam] = useState<MyTeam | null>(null);
  const [standing, setStanding] = useState<MyStanding | null>(null);
  const [fixtures, setFixtures] = useState<FixtureLite[]>([]);
  const [donkeyGame, setDonkeyGame] = useState<DonkeyGame | null>(null);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      const g = await getCurrentGameweek().catch(() => null);
      if (!alive) return;
      setGw(g);
      if (g) getGameweekFixtures(g.id).then((f) => alive && setFixtures(f)).catch(() => {});
      getDonkeyGame().then((dg) => alive && setDonkeyGame(dg)).catch(() => {});
      const uid = session?.user.id;
      if (uid) {
        if (g) getMyTeam(g.id, uid).then((t) => alive && setTeam(t)).catch(() => {});
        getMyStanding(uid).then((s) => alive && setStanding(s)).catch(() => {});
      }
    };
    load();
    // Poll while the app is open so live scores/fixtures update without a reload.
    const id = setInterval(load, 45000);
    return () => { alive = false; clearInterval(id); };
  }, [session?.user.id]);

  const c = useColors();
  const hasTeam = !!team;
  const locked = !!gw && (gw.status !== "upcoming" || (gw.deadline_at != null && Date.parse(gw.deadline_at) <= Date.now()));

  return (
    <Screen>
      <VStack gap={4}>
        <HStack justify="space-between" align="center">
          <Text variant="label" tone="faint">{gw ? `Gameweek ${gw.number}` : "Fantasy Fives"}</Text>
          {locked ? <Pill label="Live" tone="accent" /> : null}
        </HStack>
        <Text variant="h1">{profile ? identity(profile).lead : "Fantasy Fives"}</Text>
      </VStack>

      {fixtures.length ? (
        <VStack gap={8}>
          <Text variant="label" tone="faint">{locked ? "This gameweek · live" : "This gameweek"}</Text>
          <FixtureStrip fixtures={fixtures} />
        </VStack>
      ) : null}

      {locked ? (
        <Card>
          <HStack justify="space-between" align="center">
            <Text variant="label" tone="faint">Gameweek live</Text>
            <Button title="View your team" onPress={() => router.push("/(tabs)/team")} />
          </HStack>
          <Text variant="small" tone="soft">The deadline has passed and matches are under way. Your team is locked — points update as games play out.</Text>
        </Card>
      ) : (
        <Card>
          <HStack justify="space-between">
            <Text variant="label" tone="faint">Deadline</Text>
            {gw ? <Pill label={gw.deadline_confirmed ? "Confirmed" : "Provisional"} tone={gw.deadline_confirmed ? "accent" : "neutral"} /> : null}
          </HStack>
          <Text variant="h2">{gw?.deadline_at ? fmt(gw.deadline_at) : "—"}</Text>
          <Text variant="small" tone="soft">{hasTeam ? "Your team is in. Edit any time before the deadline." : "Pick five and a sub before the deadline to score."}</Text>
          <Button title={hasTeam ? "Edit your team" : "Pick your team"} full onPress={() => router.push("/(tabs)/team")} />
        </Card>
      )}

      <Card title="Your team — live">
        <HStack justify="space-between" align="flex-end">
          <VStack gap={2}>
            <Text variant="display" tone="accent">{hasTeam ? Math.round(team!.basePoints) : "—"}</Text>
            <Text variant="small" tone="faint">points this week</Text>
          </VStack>
          <VStack gap={2} align="flex-end">
            <Text variant="h2">{standing?.rank ? `#${standing.rank}` : "—"}</Text>
            <Text variant="small" tone="faint">overall rank</Text>
          </VStack>
        </HStack>
        {!hasTeam ? <Text variant="small" tone="faint">No team submitted for this gameweek yet.</Text>
          : team!.subActivated ? <Text variant="small" tone="faint">Your substitute was brought on.</Text> : null}
      </Card>

      <VStack gap={8}>
        <Text variant="label" tone="faint">Global league</Text>
        <ListRow title="Global" subtitle="Everyone who plays" right={standing?.rank ? `#${standing.rank}` : "—"} rightSub="rank" onPress={() => router.push("/(tabs)/standings")} />
      </VStack>

      <Pressable onPress={() => router.push("/donkey")} style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1, marginTop: space.sm })}>
        <View style={{ borderWidth: 1, borderColor: c.accent, borderRadius: radius.md, backgroundColor: c.accentWash, padding: space.md }}>
          <HStack justify="space-between" align="center" gap={12}>
            <VStack gap={2} flex={1}>
              <Text variant="label" tone="accent">New · side game</Text>
              <Text variant="h3">🫏 DONKEY</Text>
              <Text variant="small" tone="soft">{donkeyGame ? `${donkeyGame.home.name} v ${donkeyGame.away.name} — pick the player who won't flop their chances` : "Miss your chances and you're the donkey"}</Text>
            </VStack>
            <Text variant="h2" tone="accent">→</Text>
          </HStack>
        </View>
      </Pressable>
    </Screen>
  );
}
